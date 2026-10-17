import fs from 'node:fs';
import path from 'node:path';
import { compareVersions } from './update-checker';

export const PACMAN_LOCAL_DB = '/var/lib/pacman/local';
const PACKAGE_NAME = 'opends5-bin';
/** Quiet time after the last database change before looking at it. */
const SETTLE_MS = 3000;

/**
 * The opends5-bin version pacman has installed, from its local database
 * entry (`opends5-bin-<version>-<pkgrel>`), or null if there is none.
 */
export function installedPackageVersion(dbDir = PACMAN_LOCAL_DB): string | null {
  let entries: string[];
  try {
    entries = fs.readdirSync(dbDir);
  } catch {
    return null;
  }
  const prefix = `${PACKAGE_NAME}-`;
  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue;
    // <version>-<pkgrel>; the version itself never contains a dash.
    const match = /^([^-]+)-[^-]+$/.exec(entry.slice(prefix.length));
    if (match) return match[1];
  }
  return null;
}

/**
 * Calls onUpgrade once pacman has finished installing an opends5-bin newer
 * than the running app. pacman replaces the files under the running app, so
 * it keeps running the old version until it is restarted.
 *
 * Watches pacman's local database with inotify instead of polling, and waits
 * for pacman's lock to go away so the package's hooks (driver rebuild, vdsd
 * restart) are done before anyone is asked to restart.
 */
export function watchForPackageUpgrade(options: {
  currentVersion: string;
  onUpgrade: (version: string) => void;
  dbDir?: string;
  settleMs?: number;
}): () => void {
  const dbDir = options.dbDir ?? PACMAN_LOCAL_DB;
  const lockFile = path.join(dbDir, '..', 'db.lck');
  const settleMs = options.settleMs ?? SETTLE_MS;
  let timer: NodeJS.Timeout | null = null;
  let announced = options.currentVersion;

  const check = () => {
    timer = null;
    if (fs.existsSync(lockFile)) {
      schedule();
      return;
    }
    const installed = installedPackageVersion(dbDir);
    if (installed && compareVersions(installed, announced) > 0) {
      announced = installed;
      options.onUpgrade(installed);
    }
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(check, settleMs);
    timer.unref();
  };

  let watcher: fs.FSWatcher;
  try {
    watcher = fs.watch(dbDir, schedule);
  } catch {
    return () => undefined;
  }
  watcher.on('error', () => watcher.close());
  return () => {
    if (timer) clearTimeout(timer);
    watcher.close();
  };
}
