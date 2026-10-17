import fs from 'node:fs';
import path from 'node:path';

/**
 * One-file backup of the user's own setup: settings.json plus the trigger
 * profiles and game artwork folders. Caches, window state and runtime state
 * stay out. A restore is staged in PENDING_RESTORE_DIR and applied on the
 * next launch, before anything has loaded the settings, so nothing that is
 * still running can write over it on the way out.
 */
export const BACKUP_FORMAT = 'opends5-backup';
export const BACKUP_VERSION = 1;
export const PENDING_RESTORE_DIR = 'pending-restore';

const BACKUP_FOLDERS = ['trigger-profiles', 'game-artwork'] as const;
/** Runtime state inside a backed-up folder, not part of the user's setup. */
const SKIPPED_FILES = new Set(['trigger-profiles/engine-state.json']);
/** Settings that describe this PC rather than the user's setup; a restore keeps the current values. */
const MACHINE_SETTINGS = [
  'installedModuleSourceHash',
  'lastUpdateCheckAt',
  'setupSkipped',
  'launchAtStartupEnabled'
] as const;
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._ -]*$/;

export interface SettingsBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  appVersion: string;
  createdAt: string;
  settings: Record<string, unknown>;
  /** "<folder>/<file name>" -> base64 file contents. */
  files: Record<string, string>;
}

export function createBackup(userDataDir: string, appVersion: string, now = new Date()): SettingsBackup {
  let settingsText = '{}';
  try {
    settingsText = fs.readFileSync(path.join(userDataDir, 'settings.json'), 'utf8');
  } catch {
    // A new install has nothing saved yet; back up the defaults.
  }
  const files: Record<string, string> = {};
  for (const folder of BACKUP_FOLDERS) {
    let names: string[];
    try {
      names = fs.readdirSync(path.join(userDataDir, folder));
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      const key = `${folder}/${name}`;
      const file = path.join(userDataDir, folder, name);
      if (SKIPPED_FILES.has(key) || !SAFE_NAME.test(name) || !fs.statSync(file).isFile()) continue;
      files[key] = fs.readFileSync(file).toString('base64');
    }
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    appVersion,
    createdAt: now.toISOString(),
    settings: JSON.parse(settingsText) as Record<string, unknown>,
    files
  };
}

/** Checks a backup file's contents; throws a message fit to show the user. */
export function parseBackup(text: string): SettingsBackup {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This file isn't an OpenDS5 settings backup.");
  }
  const backup = value as Partial<SettingsBackup> | null;
  if (!backup || backup.format !== BACKUP_FORMAT) {
    throw new Error("This file isn't an OpenDS5 settings backup.");
  }
  if (typeof backup.version !== 'number' || backup.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer OpenDS5. Update OpenDS5, then restore it.');
  }
  if (!backup.settings || typeof backup.settings !== 'object' || Array.isArray(backup.settings)) {
    throw new Error('This backup has no settings in it.');
  }
  const files = backup.files ?? {};
  for (const [key, contents] of Object.entries(files)) {
    const [folder, name, ...rest] = key.split('/');
    if (
      rest.length > 0
      || !(BACKUP_FOLDERS as readonly string[]).includes(folder)
      || !name
      || !SAFE_NAME.test(name)
      || typeof contents !== 'string'
    ) {
      throw new Error(`This backup has an unexpected file in it (${key}).`);
    }
  }
  return {
    format: BACKUP_FORMAT,
    version: backup.version,
    appVersion: typeof backup.appVersion === 'string' ? backup.appVersion : '',
    createdAt: typeof backup.createdAt === 'string' ? backup.createdAt : '',
    settings: backup.settings,
    files
  };
}

/** Writes a checked backup to the pending-restore folder for the next launch. */
export function stageRestore(userDataDir: string, backup: SettingsBackup): void {
  const pending = path.join(userDataDir, PENDING_RESTORE_DIR);
  fs.rmSync(pending, { recursive: true, force: true });
  fs.mkdirSync(pending, { recursive: true });
  for (const folder of BACKUP_FOLDERS) {
    fs.mkdirSync(path.join(pending, folder));
  }
  for (const [key, contents] of Object.entries(backup.files)) {
    fs.writeFileSync(path.join(pending, key), Buffer.from(contents, 'base64'));
  }
  // settings.json last: its presence marks the staged restore as complete.
  fs.writeFileSync(path.join(pending, 'settings.json'), `${JSON.stringify(backup.settings, null, 2)}\n`);
}

/**
 * Applies a staged restore, if there is a complete one. Runs at startup
 * before the settings are loaded. Returns whether a restore was applied.
 */
export function applyPendingRestore(userDataDir: string): boolean {
  const pending = path.join(userDataDir, PENDING_RESTORE_DIR);
  const stagedSettings = path.join(pending, 'settings.json');
  if (!fs.existsSync(stagedSettings)) {
    fs.rmSync(pending, { recursive: true, force: true });
    return false;
  }
  const settings = JSON.parse(fs.readFileSync(stagedSettings, 'utf8')) as Record<string, unknown>;
  const currentFile = path.join(userDataDir, 'settings.json');
  try {
    const current = JSON.parse(fs.readFileSync(currentFile, 'utf8')) as Record<string, unknown>;
    for (const key of MACHINE_SETTINGS) {
      if (key in current) {
        settings[key] = current[key];
      } else {
        delete settings[key];
      }
    }
  } catch {
    for (const key of MACHINE_SETTINGS) delete settings[key];
  }
  for (const folder of BACKUP_FOLDERS) {
    const target = path.join(userDataDir, folder);
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(target)) {
      if (!SKIPPED_FILES.has(`${folder}/${name}`)) {
        fs.rmSync(path.join(target, name), { recursive: true, force: true });
      }
    }
    fs.cpSync(path.join(pending, folder), target, { recursive: true });
  }
  fs.writeFileSync(currentFile, `${JSON.stringify(settings, null, 2)}\n`);
  fs.rmSync(pending, { recursive: true, force: true });
  return true;
}
