import { execFile } from 'node:child_process';
import type { ProcessLister, WindowsProcessInfo } from './game-watcher';

type RunCommand = (file: string, args: string[]) => Promise<string>;

function runCommand(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

/** Image names from `tasklist /fo csv /nh` ("name.exe","pid",...), lowercased. */
export function parseTasklistCsv(text: string): string[] {
  const names = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^"([^"]+)"/.exec(line.trim());
    if (match) names.add(match[1].toLowerCase());
  }
  return [...names];
}

/**
 * GameWatcher polls synchronously, but listing Windows processes means running
 * tasklist. The lister returns the last finished scan and starts the next one
 * in the background, so a poll never blocks the main process; matches lag by
 * at most one poll interval.
 */
export function createWindowsProcessLister(run: RunCommand = runCommand): ProcessLister {
  let latest: string[] = [];
  let inFlight = false;
  const refresh = () => {
    if (inFlight) return;
    inFlight = true;
    run('tasklist.exe', ['/fo', 'csv', '/nh'])
      .then((stdout) => {
        latest = parseTasklistCsv(stdout);
      })
      .catch(() => undefined)
      .finally(() => {
        inFlight = false;
      });
  };
  refresh();
  return () => {
    refresh();
    return latest;
  };
}

/** `ConvertTo-Json` output of Win32_Process Name/ExecutablePath (one object or an array). */
export function parseWindowsProcessJson(text: string): WindowsProcessInfo[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const infos: WindowsProcessInfo[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const { Name: name, ExecutablePath: exePath } = row as { Name?: unknown; ExecutablePath?: unknown };
    if (typeof name !== 'string' || !name) continue;
    infos.push({ name, exePath: typeof exePath === 'string' && exePath ? exePath : null });
  }
  return infos;
}

/** Running processes with their executable paths, for "Detect Running Game". */
export async function readWindowsProcesses(run: RunCommand = runCommand): Promise<WindowsProcessInfo[]> {
  try {
    return parseWindowsProcessJson(await run('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      'Get-CimInstance Win32_Process | Select-Object Name,ExecutablePath | ConvertTo-Json -Compress'
    ]));
  } catch {
    return [];
  }
}

/** Steam's install path from HKCU\Software\Valve\Steam, or null. */
export async function readWindowsSteamPath(run: RunCommand = runCommand): Promise<string | null> {
  try {
    const stdout = await run('reg.exe', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath']);
    const match = /SteamPath\s+REG_SZ\s+(.+?)\s*$/m.exec(stdout);
    return match ? match[1].replace(/\//g, '\\') : null;
  } catch {
    return null;
  }
}
