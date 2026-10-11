import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  installerCommand,
  isSetupNeeded,
  isWindowsSetupNeeded,
  parseProgressLine,
  windowsInstalledVdsdPath
} from './setup-service';

describe('parseProgressLine', () => {
  it('parses plan, step and done events', () => {
    expect(
      parseProgressLine(
        '{"event":"plan","total":2,"steps":["a","b"],"log":"/var/log/opends5/install.log"}',
      ),
    ).toEqual({ event: 'plan', total: 2, steps: ['a', 'b'], log: '/var/log/opends5/install.log' });
    expect(parseProgressLine('{"event":"step","index":1,"status":"fail","exit":4}')).toEqual({
      event: 'step',
      index: 1,
      status: 'fail',
      exit: 4,
    });
    expect(parseProgressLine('{"event":"done","exit":0}')).toEqual({ event: 'done', exit: 0 });
  });

  it('ignores non-JSON noise', () => {
    expect(parseProgressLine('==> Installing')).toBeNull();
    expect(parseProgressLine('{"event":"unknown"}')).toBeNull();
    expect(parseProgressLine('not json {')).toBeNull();
    expect(parseProgressLine('')).toBeNull();
  });
});

describe('isSetupNeeded', () => {
  it('needed when module sysfs missing', () => {
    expect(isSetupNeeded({ moduleSysfs: '/nonexistent/vds_hcd', serviceActive: () => true })).toBe(
      true,
    );
  });
  it('needed when service inactive', () => {
    expect(isSetupNeeded({ moduleSysfs: '/', serviceActive: () => false })).toBe(true);
  });
  it('not needed when both fine', () => {
    expect(isSetupNeeded({ moduleSysfs: '/', serviceActive: () => true })).toBe(false);
  });
});

describe('installerCommand', () => {
  it('runs opends5-install with bash on Linux', () => {
    expect(installerCommand('/r/installer/opends5-install', ['--yes', '--json-progress'], 'linux')).toEqual({
      command: 'bash',
      args: ['/r/installer/opends5-install', '--yes', '--json-progress']
    });
  });

  it('maps the flags to opends5-setup.ps1 switches on Windows', () => {
    expect(installerCommand('C:\\r\\opends5-setup.ps1', ['--uninstall', '--yes', '--json-progress', '--purge'], 'win32')).toEqual({
      command: 'powershell.exe',
      args: [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', 'C:\\r\\opends5-setup.ps1',
        '-Uninstall', '-Yes', '-JsonProgress', '-Purge'
      ]
    });
  });
});

describe('isWindowsSetupNeeded', () => {
  it('installs under Program Files', () => {
    expect(windowsInstalledVdsdPath({ ProgramW6432: 'C:\\Program Files' })).toBe('C:\\Program Files\\OpenDS5\\vds\\vdsd.exe');
  });

  it('is needed without the service, or when the bundled vdsd differs', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'setup-needed-'));
    try {
      const bundled = path.join(dir, 'bundled.exe');
      const installed = path.join(dir, 'installed.exe');
      writeFileSync(bundled, 'vdsd 2');
      writeFileSync(installed, 'vdsd 1');
      expect(isWindowsSetupNeeded({ bundledVdsd: bundled, installedVdsd: installed, serviceInstalled: () => false })).toBe(true);
      expect(isWindowsSetupNeeded({ bundledVdsd: bundled, installedVdsd: installed, serviceInstalled: () => true })).toBe(true);
      writeFileSync(installed, 'vdsd 2');
      expect(isWindowsSetupNeeded({ bundledVdsd: bundled, installedVdsd: installed, serviceInstalled: () => true })).toBe(false);
      expect(isWindowsSetupNeeded({
        bundledVdsd: path.join(dir, 'missing.exe'),
        installedVdsd: installed,
        serviceInstalled: () => true
      })).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
