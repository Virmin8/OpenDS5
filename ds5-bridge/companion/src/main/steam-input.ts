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
