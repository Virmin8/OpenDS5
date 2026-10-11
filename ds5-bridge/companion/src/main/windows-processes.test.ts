import { describe, expect, it, vi } from 'vitest';
import { listWindowsCandidateGameProcesses } from './game-watcher';
import {
  createWindowsProcessLister,
  parseTasklistCsv,
  parseWindowsProcessJson,
  readWindowsSteamPath
} from './windows-processes';

describe('parseTasklistCsv', () => {
  it('reads lowercased, de-duplicated image names', () => {
    const text = '"System Idle Process","0","Services","0","8 K"\r\n"Hades.exe","412","Console","1","900,000 K"\r\n"svchost.exe","1","Services","0","1 K"\r\n"svchost.exe","2","Services","0","1 K"\r\n';
    expect(parseTasklistCsv(text)).toEqual(['system idle process', 'hades.exe', 'svchost.exe']);
  });
});

describe('createWindowsProcessLister', () => {
  it('returns the last finished scan without waiting for the next', async () => {
    const run = vi.fn().mockResolvedValue('"Hades.exe","412"\r\n');
    const list = createWindowsProcessLister(run);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(list()).toEqual(['hades.exe']);
    expect(run).toHaveBeenCalledWith('tasklist.exe', ['/fo', 'csv', '/nh']);
  });
});

describe('parseWindowsProcessJson', () => {
  it('accepts one object or an array and keeps missing paths as null', () => {
    expect(parseWindowsProcessJson('{"Name":"a.exe","ExecutablePath":"C:\\\\a.exe"}')).toEqual([
      { name: 'a.exe', exePath: 'C:\\a.exe' }
    ]);
    expect(parseWindowsProcessJson('[{"Name":"System","ExecutablePath":null},{"Name":""}]')).toEqual([
      { name: 'System', exePath: null }
    ]);
    expect(parseWindowsProcessJson('not json')).toEqual([]);
  });
});

describe('readWindowsSteamPath', () => {
  it('reads SteamPath from reg query output', async () => {
    const run = vi.fn().mockResolvedValue(
      '\r\nHKEY_CURRENT_USER\\Software\\Valve\\Steam\r\n    SteamPath    REG_SZ    c:/program files (x86)/steam\r\n\r\n'
    );
    await expect(readWindowsSteamPath(run)).resolves.toBe('c:\\program files (x86)\\steam');
  });

  it('is null without Steam', async () => {
    await expect(readWindowsSteamPath(vi.fn().mockRejectedValue(new Error('not found')))).resolves.toBeNull();
  });
});

describe('listWindowsCandidateGameProcesses', () => {
  it('offers processes under a game library and skips launchers', () => {
    expect(listWindowsCandidateGameProcesses([
      { name: 'Hades.exe', exePath: 'D:\\Epic Games\\Hades\\x64\\Hades.exe' },
      { name: 'eldenring.exe', exePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ELDEN RING\\Game\\eldenring.exe' },
      { name: 'steam.exe', exePath: 'C:\\Program Files (x86)\\Steam\\steam.exe' },
      { name: 'EasyAntiCheat.exe', exePath: 'C:\\Games\\X\\EasyAntiCheat.exe' },
      { name: 'notepad.exe', exePath: 'C:\\Windows\\System32\\notepad.exe' }
    ])).toEqual([
      { name: 'eldenring.exe', kind: 'game-path' },
      { name: 'hades.exe', kind: 'game-path' }
    ]);
  });

  it('falls back to user programs outside Windows folders', () => {
    expect(listWindowsCandidateGameProcesses([
      { name: 'Quake.exe', exePath: 'E:\\Quake\\Quake.exe' },
      { name: 'svchost.exe', exePath: 'C:\\Windows\\System32\\svchost.exe' },
      { name: 'chrome.exe', exePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
      { name: 'System', exePath: null }
    ])).toEqual([{ name: 'quake.exe', kind: 'other' }]);
  });
});
