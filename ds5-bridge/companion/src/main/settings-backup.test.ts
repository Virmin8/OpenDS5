import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PENDING_RESTORE_DIR,
  applyPendingRestore,
  createBackup,
  parseBackup,
  stageRestore
} from './settings-backup';

function write(file: string, contents: string | Buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

describe('settings backup', () => {
  let source: string;
  let target: string;

  beforeEach(() => {
    source = fs.mkdtempSync(path.join(os.tmpdir(), 'opends5-backup-src-'));
    target = fs.mkdtempSync(path.join(os.tmpdir(), 'opends5-backup-dst-'));
    write(path.join(source, 'settings.json'), JSON.stringify({
      lightbarColor: '#00ff00',
      installedModuleSourceHash: 'source-pc-hash',
      setupSkipped: true
    }));
    write(path.join(source, 'trigger-profiles', 'control.json'), '{"name":"Control"}');
    write(path.join(source, 'trigger-profiles', 'engine-state.json'), '{"running":true}');
    write(path.join(source, 'game-artwork', 'control.jpg'), Buffer.from([0xff, 0xd8, 0x00, 0x01]));
    write(path.join(source, 'profile-library', 'library-cache.json'), '{}');
    write(path.join(source, 'window-state.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(source, { recursive: true, force: true });
    fs.rmSync(target, { recursive: true, force: true });
  });

  it('backs up settings, trigger profiles and artwork, not caches or runtime state', () => {
    const backup = createBackup(source, '1.9.12', new Date('2026-10-17T12:00:00Z'));
    expect(backup).toMatchObject({ format: 'opends5-backup', version: 1, appVersion: '1.9.12' });
    expect(backup.settings.lightbarColor).toBe('#00ff00');
    expect(Object.keys(backup.files).sort()).toEqual(['game-artwork/control.jpg', 'trigger-profiles/control.json']);
  });

  it('restores on the next launch, keeping this PC\'s own settings and runtime state', () => {
    const backup = parseBackup(JSON.stringify(createBackup(source, '1.9.12')));
    write(path.join(target, 'settings.json'), JSON.stringify({
      lightbarColor: '#0000ff',
      installedModuleSourceHash: 'this-pc-hash'
    }));
    write(path.join(target, 'trigger-profiles', 'old.json'), '{}');
    write(path.join(target, 'trigger-profiles', 'engine-state.json'), '{"running":false}');

    stageRestore(target, backup);
    // Nothing changes until the next launch applies it.
    expect(JSON.parse(fs.readFileSync(path.join(target, 'settings.json'), 'utf8')).lightbarColor).toBe('#0000ff');

    expect(applyPendingRestore(target)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(path.join(target, 'settings.json'), 'utf8'));
    expect(settings.lightbarColor).toBe('#00ff00');
    expect(settings.installedModuleSourceHash).toBe('this-pc-hash');
    expect('setupSkipped' in settings).toBe(false);
    expect(fs.readdirSync(path.join(target, 'trigger-profiles')).sort()).toEqual(['control.json', 'engine-state.json']);
    expect(fs.readFileSync(path.join(target, 'trigger-profiles', 'engine-state.json'), 'utf8')).toBe('{"running":false}');
    expect([...fs.readFileSync(path.join(target, 'game-artwork', 'control.jpg'))]).toEqual([0xff, 0xd8, 0x00, 0x01]);
    expect(fs.existsSync(path.join(target, PENDING_RESTORE_DIR))).toBe(false);
  });

  it('does nothing without a complete staged restore, and clears a partial one', () => {
    expect(applyPendingRestore(target)).toBe(false);
    write(path.join(target, PENDING_RESTORE_DIR, 'trigger-profiles', 'x.json'), '{}');
    expect(applyPendingRestore(target)).toBe(false);
    expect(fs.existsSync(path.join(target, PENDING_RESTORE_DIR))).toBe(false);
  });

  it('rejects files that are not backups, newer formats and unsafe paths', () => {
    expect(() => parseBackup('not json')).toThrow("isn't an OpenDS5 settings backup");
    expect(() => parseBackup('{"format":"other"}')).toThrow("isn't an OpenDS5 settings backup");
    expect(() => parseBackup('{"format":"opends5-backup","version":2,"settings":{}}')).toThrow('newer OpenDS5');
    for (const key of ['../settings.json', 'trigger-profiles/../../x', 'trigger-profiles/.hidden', 'other/x.json', 'game-artwork/a/b.jpg']) {
      expect(() => parseBackup(JSON.stringify({
        format: 'opends5-backup', version: 1, settings: {}, files: { [key]: '' }
      }))).toThrow('unexpected file');
    }
  });
});
