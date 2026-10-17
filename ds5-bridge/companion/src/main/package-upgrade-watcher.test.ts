import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installedPackageVersion, watchForPackageUpgrade } from './package-upgrade-watcher';

describe('installedPackageVersion', () => {
  let root: string;
  let db: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'opends5-pacman-'));
    db = path.join(root, 'local');
    fs.mkdirSync(db);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reads the version from the database entry', () => {
    fs.mkdirSync(path.join(db, 'opends5-bin-1.9.11-1'));
    fs.mkdirSync(path.join(db, 'opends5-bin-extras-2.0.0-1'));
    expect(installedPackageVersion(db)).toBe('1.9.11');
  });

  it('is null when the package is not installed or there is no pacman', () => {
    fs.mkdirSync(path.join(db, 'linux-7.2.9-2'));
    expect(installedPackageVersion(db)).toBeNull();
    expect(installedPackageVersion(path.join(root, 'missing'))).toBeNull();
  });

  it('reports a newer install once pacman has released its lock', async () => {
    fs.mkdirSync(path.join(db, 'opends5-bin-1.9.11-1'));
    const upgrades: string[] = [];
    const lock = path.join(root, 'db.lck');
    fs.writeFileSync(lock, '');
    const stop = watchForPackageUpgrade({
      currentVersion: '1.9.11',
      onUpgrade: (version) => upgrades.push(version),
      dbDir: db,
      settleMs: 20
    });
    try {
      fs.renameSync(path.join(db, 'opends5-bin-1.9.11-1'), path.join(db, 'opends5-bin-1.9.12-1'));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(upgrades).toEqual([]);

      fs.rmSync(lock);
      await expect.poll(() => upgrades, { timeout: 1000 }).toEqual(['1.9.12']);

      // A reinstall of the same version is not announced again.
      fs.mkdirSync(path.join(db, 'unrelated-1-1'));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(upgrades).toEqual(['1.9.12']);
    } finally {
      stop();
    }
  });

  it('ignores a downgrade or the same version', async () => {
    fs.mkdirSync(path.join(db, 'opends5-bin-1.9.11-1'));
    const upgrades: string[] = [];
    const stop = watchForPackageUpgrade({
      currentVersion: '1.9.11',
      onUpgrade: (version) => upgrades.push(version),
      dbDir: db,
      settleMs: 20
    });
    try {
      fs.renameSync(path.join(db, 'opends5-bin-1.9.11-1'), path.join(db, 'opends5-bin-1.9.10-1'));
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(upgrades).toEqual([]);
    } finally {
      stop();
    }
  });
});
