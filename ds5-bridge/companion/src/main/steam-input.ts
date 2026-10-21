import fs from 'node:fs';
import path from 'node:path';

/**
 * Linux: whether Steam has the virtual DualSense open. Steam Input opens a
 * controller's hidraw node to take it over; for a game with native DualSense
 * support that means doubled input and no adaptive triggers or haptics. The
 * virtual controller is the hidraw node under vds_hcd's virtual USB host, so a
 * real wired DualSense doesn't count.
 */
export function steamHasVirtualController(roots: { proc?: string; sys?: string; dev?: string } = {}): boolean {
  const proc = roots.proc ?? '/proc';
  const sys = roots.sys ?? '/sys';
  const dev = roots.dev ?? '/dev';

  const virtualNodes = new Set<string>();
  let hidraws: string[];
  try {
    hidraws = fs.readdirSync(path.join(sys, 'class', 'hidraw'));
  } catch {
    return false;
  }
  for (const name of hidraws) {
    try {
      const device = fs.realpathSync(path.join(sys, 'class', 'hidraw', name, 'device'));
      if (/\/vds_hcd\.\d+\//.test(device)) {
        virtualNodes.add(path.join(dev, name));
      }
    } catch {
      // went away while we looked
    }
  }
  if (virtualNodes.size === 0) {
    return false;
  }

  let pids: string[];
  try {
    pids = fs.readdirSync(proc).filter((entry) => /^\d+$/.test(entry));
  } catch {
    return false;
  }
  for (const pid of pids) {
    let comm: string;
    try {
      comm = fs.readFileSync(path.join(proc, pid, 'comm'), 'utf8').trim();
    } catch {
      continue;
    }
    if (comm !== 'steam') {
      continue;
    }
    let fds: string[];
    try {
      fds = fs.readdirSync(path.join(proc, pid, 'fd'));
    } catch {
      continue;
    }
    for (const fd of fds) {
      try {
        if (virtualNodes.has(fs.readlinkSync(path.join(proc, pid, 'fd', fd)))) {
          return true;
        }
      } catch {
        // closed while we looked
      }
    }
  }
  return false;
}

/**
 * Steam's "PlayStation Controller Support" setting for the account that used
 * Steam last: '0' Disabled, '1' Enabled in Games w/o Support (Steam's default,
 * used when the key is missing), '2' Enabled. Null when no Steam config is found.
 */
export function steamPlayStationSupport(homeDir: string): string | null {
  const roots = [
    path.join(homeDir, '.local', 'share', 'Steam', 'userdata'),
    path.join(homeDir, '.steam', 'steam', 'userdata'),
    path.join(homeDir, '.var', 'app', 'com.valvesoftware.Steam', '.local', 'share', 'Steam', 'userdata')
  ];
  const seen = new Set<string>();
  let newest: { file: string; mtime: number } | null = null;
  for (const root of roots) {
    let real: string;
    try {
      real = fs.realpathSync(root);
    } catch {
      continue;
    }
    if (seen.has(real)) continue;
    seen.add(real);
    for (const account of fs.readdirSync(real)) {
      const file = path.join(real, account, 'config', 'localconfig.vdf');
      try {
        const mtime = fs.statSync(file).mtimeMs;
        if (!newest || mtime > newest.mtime) newest = { file, mtime };
      } catch {
        // no config for this account
      }
    }
  }
  if (!newest) return null;
  try {
    const text = fs.readFileSync(newest.file, 'utf8');
    return /^\s*"SteamController_PSSupport"\s+"(\d+)"/m.exec(text)?.[1] ?? '1';
  } catch {
    return null;
  }
}

/**
 * Steam Input is taking over the virtual DualSense in every game: Steam has
 * it open and PlayStation Controller Support is set to Enabled. Steam opens
 * controllers in any case (to watch the guide button), so having it open
 * alone means nothing.
 */
export function steamInputTakesOverController(
  homeDir: string,
  roots: { proc?: string; sys?: string; dev?: string } = {}
): boolean {
  return steamPlayStationSupport(homeDir) === '2' && steamHasVirtualController(roots);
}
