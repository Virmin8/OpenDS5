import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Reads installed games from Steam, Heroic Games Launcher, Lutris (Linux) and the
 * Epic Games Launcher (Windows) on-disk data —
 * no store APIs, no logins. See docs/superpowers/specs/2026-07-15-installed-games-
 * import-design.md.
 *
 * A scan never throws: unreadable roots and malformed manifests are skipped, and
 * per-source failures are collected as diagnostic strings on the result.
 */

export interface InstalledGame {
  source: 'steam' | 'heroic' | 'lutris' | 'epic';
  /** Display name, normalized (trademark marks stripped, whitespace collapsed). */
  name: string;
  /** Steam appid, Heroic app_name or Epic AppName — stable key into the session scan cache. */
  sourceId: string;
  installDir: string | null;
  /** Executable basenames for the process match, best guess first. */
  processCandidates: string[];
  artwork:
    | { kind: 'file'; path: string }
    | { kind: 'url'; url: string }
    | null;
}

export interface InstalledGamesScanResult {
  games: InstalledGame[];
  errors: string[];
}

export interface ScannerRoots {
  /** Steam install roots (contain steamapps/ and appcache/). */
  steam: string[];
  /** Heroic config roots (contain store_cache/, gog_store/, sideload_apps/). */
  heroic: string[];
  /** legendary config roots (contain installed.json for Epic installs). */
  legendary: string[];
  /** Lutris data roots (contain pga.db and games/*.yml). */
  lutris: string[];
  /** Epic Games Launcher manifest dirs (Windows; *.item JSON per install). */
  epic?: string[];
}

export function defaultScannerRoots(home: string): ScannerRoots {
  return {
    steam: [
      path.join(home, '.steam', 'steam'),
      path.join(home, '.local', 'share', 'Steam'),
      path.join(home, '.var', 'app', 'com.valvesoftware.Steam', '.local', 'share', 'Steam')
    ],
    heroic: [
      path.join(home, '.config', 'heroic'),
      path.join(home, '.var', 'app', 'com.heroicgameslauncher.hgl', 'config', 'heroic')
    ],
    legendary: [
      // Heroic's bundled legendary keeps its config inside Heroic's own dir.
      path.join(home, '.config', 'heroic', 'legendaryConfig', 'legendary'),
      path.join(home, '.config', 'legendary'),
      path.join(home, '.var', 'app', 'com.heroicgameslauncher.hgl', 'config', 'heroic', 'legendaryConfig', 'legendary'),
      path.join(home, '.var', 'app', 'com.heroicgameslauncher.hgl', 'config', 'legendary')
    ],
    lutris: [
      path.join(home, '.local', 'share', 'lutris'),
      path.join(home, '.var', 'app', 'net.lutris.Lutris', 'data', 'lutris')
    ]
  };
}

export type WindowsScannerEnv = {
  home: string;
  appData: string;
  programData: string;
  programFilesX86: string;
};

/**
 * Windows launcher locations. Steam's install path comes from the registry
 * (HKCU\Software\Valve\Steam SteamPath) when known; Heroic keeps its config in
 * %APPDATA%\heroic, legendary in ~\.config\legendary, the Epic Games Launcher its
 * manifests in %PROGRAMDATA%. Lutris is Linux-only.
 */
export function windowsScannerRoots(env: WindowsScannerEnv, steamPath: string | null): ScannerRoots {
  const steam: string[] = [];
  for (const root of [steamPath, path.win32.join(env.programFilesX86, 'Steam')]) {
    const normalized = root ? path.win32.normalize(root) : '';
    // Windows paths are case-insensitive; the registry often lowercases them.
    if (normalized && !steam.some((known) => known.toLowerCase() === normalized.toLowerCase())) {
      steam.push(normalized);
    }
  }
  return {
    steam,
    heroic: [path.win32.join(env.appData, 'heroic')],
    legendary: [
      path.win32.join(env.appData, 'heroic', 'legendaryConfig', 'legendary'),
      path.win32.join(env.home, '.config', 'legendary')
    ],
    lutris: [],
    epic: [path.win32.join(env.programData, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')]
  };
}

// Build-output folders between a game's install dir and its executable.
const GENERIC_EXE_DIRS = /^(bin(32|64)?|x(64|86)|win(32|64)|windows(no editor)?|binaries|shipping|retail|release|game|client|launcher|exe|common|build|dist|program)$/i;

/**
 * A title for a manually picked executable: the nearest folder above it that is
 * not a build-output folder ("…/Cyberpunk 2077/bin/x64/Cyberpunk2077.exe" ->
 * "Cyberpunk 2077"), else the file name without its extension.
 */
export function suggestGameTitleFromExecutable(exePath: string): string {
  const parts = exePath.split(/[\\/]+/).filter(Boolean);
  const fileName = parts.pop() ?? '';
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const dir = parts[index];
    if (/^[a-z]:$/i.test(dir) || /^(steamapps|common|games|program files( \(x86\))?|home)$/i.test(dir)) break;
    if (!GENERIC_EXE_DIRS.test(dir)) return normalizeGameTitle(dir);
  }
  return normalizeGameTitle(fileName.replace(/\.(exe|x86_64|x86|sh|bin)$/i, ''));
}

export function normalizeGameTitle(raw: string): string {
  return raw.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Tolerant parser for Valve's flat VDF/ACF quoted key-value format. Returns every
 * `"key" "value"` pair found, later duplicates overwriting earlier ones — nesting
 * is ignored on purpose, since the fields we need are unique per file.
 */
export function parseVdfPairs(text: string): Record<string, string> {
  const pairs: Record<string, string> = {};
  const re = /"((?:[^"\\]|\\.)*)"\s+"((?:[^"\\]|\\.)*)"/g;
  for (const match of text.matchAll(re)) {
    const unescape = (value: string) => value.replace(/\\(.)/g, '$1');
    pairs[unescape(match[1]).toLowerCase()] = unescape(match[2]);
  }
  return pairs;
}

/** All `"path" "..."` values — how libraryfolders.vdf names its library roots. */
export function parseVdfPaths(text: string): string[] {
  const paths: string[] = [];
  const re = /"path"\s+"((?:[^"\\]|\\.)*)"/gi;
  for (const match of text.matchAll(re)) {
    paths.push(match[1].replace(/\\(.)/g, '$1'));
  }
  return [...new Set(paths)];
}

const JUNK_PATTERNS = [
  /^unins/, /setup/, /redist/, /^vcredist/, /^dxsetup/, /crashreport/,
  /cefsubprocess/, /prereq/, /^dotnet/, /^easyanticheat_setup/,
  /webengineprocess/, /diagnose/, /^upload_/, /^capturepro/,
  // Engine/launcher helpers that sit next to the real game binary.
  /crashhandler/, /crashpad/, /^unitycrash/, /epiconlineservices/, /^eosbootstrapper/,
  /^ue4prereq/, /^ueprereq/, /^benchmark/, /^gpuburner/, /^vc_redist/, /installer/,
  /^launcherpatcher/, /^bugreport/, /^errorreporter/, /^cleanup/, /^quicksfv/, /^7za?\b/
];

// Steam tooling ships with the same manifests as games; nobody wants a trigger
// profile for Proton or a runtime.
const STEAM_TOOL_NAMES = [
  /^proton\b/i, /^steam linux runtime/i, /^steamworks common/i, /^steam controller configs/i
];

/** How deep the executable scan walks — Unreal ships binaries 4 levels down. */
const EXE_SCAN_DEPTH = 4;

interface ExecutableInfo {
  baseName: string;
  size: number;
}

function similarName(fileBase: string, dirName: string): boolean {
  const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const file = squash(fileBase.replace(/\.exe$/i, ''));
  const dir = squash(dirName);
  if (!file || !dir) return false;
  return file.includes(dir) || dir.includes(file);
}

function isElfExecutable(filePath: string): boolean {
  // Only the 4-byte magic is needed; reading whole multi-GB binaries here used
  // to stall the main process for seconds per game.
  let fd: number | null = null;
  try {
    fd = openSync(filePath, 'r');
    const magic = Buffer.alloc(4);
    const read = readSync(fd, magic, 0, 4, 0);
    return read === 4 && magic[0] === 0x7f && magic[1] === 0x45 && magic[2] === 0x4c && magic[3] === 0x46;
  } catch {
    return false;
  } finally {
    if (fd !== null) closeSync(fd);
  }
}

function collectExecutables(dir: string, depth: number, out: ExecutableInfo[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      if (depth > 0) collectExecutables(full, depth - 1, out);
      continue;
    }
    if (!stats.isFile()) continue;
    const isExe = /\.exe$/i.test(entry);
    const isNativeBinary = !entry.includes('.')
      && (stats.mode & 0o111) !== 0
      && stats.size > 65536
      && isElfExecutable(full);
    if (isExe || isNativeBinary) {
      out.push({ baseName: entry, size: stats.size });
    }
  }
}

/**
 * Ranks the executables in an install dir as process-match candidates. The
 * ranking only has to make the default usually right — the Add Game dialog lets
 * the user untick, and live process detection is the ground-truth fallback.
 */
export function rankProcessCandidates(installDir: string): string[] {
  const executables: ExecutableInfo[] = [];
  collectExecutables(installDir, EXE_SCAN_DEPTH, executables);
  if (executables.length === 0) return [];
  const dirName = path.basename(installDir);
  const largest = Math.max(...executables.map((exe) => exe.size));
  const scored = executables.map((exe) => {
    const lower = exe.baseName.toLowerCase();
    let score = 0;
    if (similarName(exe.baseName, dirName)) score += 2;
    if (exe.size === largest) score += 2;
    if (JUNK_PATTERNS.some((pattern) => pattern.test(lower))) score -= 3;
    if (exe.size < 4 * 1024 * 1024) score -= 1;
    return { name: exe.baseName, score, size: exe.size };
  });
  scored.sort((a, b) => b.score - a.score || b.size - a.size || a.name.localeCompare(b.name));
  // De-dupe basenames (the same exe can exist at two depths, e.g. shipped twice).
  return [...new Set(scored.map((entry) => entry.name))];
}

/** Score threshold below which the dialog should leave a candidate unticked. */
export function isLikelyJunkCandidate(baseName: string): boolean {
  return JUNK_PATTERNS.some((pattern) => pattern.test(baseName.toLowerCase()));
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export class InstalledGamesScanner {
  private readonly roots: ScannerRoots;

  constructor(roots: ScannerRoots) {
    this.roots = roots;
  }

  scan(): InstalledGamesScanResult {
    const errors: string[] = [];
    const games: InstalledGame[] = [];
    for (const root of this.roots.steam) {
      try {
        games.push(...this.scanSteamRoot(root));
      } catch (err) {
        errors.push(`Steam (${root}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    for (const root of this.roots.heroic) {
      try {
        games.push(...this.scanHeroicRoot(root));
      } catch (err) {
        errors.push(`Heroic (${root}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    for (const root of this.roots.lutris ?? []) {
      try {
        games.push(...this.scanLutrisRoot(root));
      } catch (err) {
        errors.push(`Lutris (${root}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    for (const root of this.roots.epic ?? []) {
      try {
        games.push(...this.scanEpicManifests(root));
      } catch (err) {
        errors.push(`Epic (${root}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    // The same game can appear under two roots (symlinked Steam dirs, flatpak +
    // native Heroic). First occurrence wins; source order is stable.
    const seen = new Set<string>();
    const deduped = games.filter((game) => {
      const key = `${game.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { games: deduped, errors };
  }

  private scanSteamRoot(root: string): InstalledGame[] {
    const librariesVdf = path.join(root, 'steamapps', 'libraryfolders.vdf');
    if (!existsSync(librariesVdf)) return [];
    const libraryPaths = new Set<string>(parseVdfPaths(readFileSync(librariesVdf, 'utf8')));
    libraryPaths.add(root);
    const games: InstalledGame[] = [];
    for (const library of libraryPaths) {
      const steamapps = path.join(library, 'steamapps');
      let manifests: string[];
      try {
        manifests = readdirSync(steamapps).filter((entry) => /^appmanifest_\d+\.acf$/.test(entry));
      } catch {
        continue;
      }
      for (const manifest of manifests) {
        try {
          const fields = parseVdfPairs(readFileSync(path.join(steamapps, manifest), 'utf8'));
          const appid = fields.appid;
          const name = fields.name;
          if (!appid || !name) continue;
          if (STEAM_TOOL_NAMES.some((pattern) => pattern.test(name))) continue;
          // StateFlags bit 4 = fully installed; skip partial downloads.
          const stateFlags = Number(fields.stateflags ?? '0');
          if ((stateFlags & 4) === 0) continue;
          const installDir = fields.installdir
            ? path.join(steamapps, 'common', fields.installdir)
            : null;
          games.push({
            source: 'steam',
            name: normalizeGameTitle(name),
            sourceId: appid,
            installDir,
            processCandidates: installDir && existsSync(installDir)
              ? rankProcessCandidates(installDir)
              : [],
            artwork: this.steamArtwork(root, appid)
          });
        } catch {
          // One bad manifest never hides the rest of the library.
        }
      }
    }
    return games;
  }

  private steamArtwork(root: string, appid: string): InstalledGame['artwork'] {
    const cacheDir = path.join(root, 'appcache', 'librarycache');
    // Oldest layout: flat file named after the app.
    const flat = path.join(cacheDir, `${appid}_library_600x900.jpg`);
    if (existsSync(flat)) return { kind: 'file', path: flat };
    // Newer layouts: a per-app directory, either holding the portrait directly
    // or nesting it one hashed directory down (library_capsule = the 600x900).
    const appDir = path.join(cacheDir, appid);
    const portraitNames = ['library_600x900.jpg', 'library_capsule.jpg'];
    const direct = portraitNames.map((name) => path.join(appDir, name)).find(existsSync);
    if (direct) return { kind: 'file', path: direct };
    try {
      for (const entry of readdirSync(appDir)) {
        const nested = portraitNames.map((name) => path.join(appDir, entry, name)).find(existsSync);
        if (nested) return { kind: 'file', path: nested };
      }
    } catch {
      // No cache directory for this app.
    }
    return null;
  }

  /**
   * Lutris: titles come from pga.db, the game executable from games/<configpath>.yml.
   * Without SQLite support the yml files alone still list the games (title from the
   * config file name).
   */
  private scanLutrisRoot(root: string): InstalledGame[] {
    const gamesDir = path.join(root, 'games');
    if (!existsSync(gamesDir)) return [];
    const titles = readLutrisTitles(path.join(root, 'pga.db'));
    const games: InstalledGame[] = [];
    let configs: string[];
    try {
      configs = readdirSync(gamesDir).filter((entry) => entry.endsWith('.yml'));
    } catch {
      return [];
    }
    for (const config of configs) {
      const configPath = config.slice(0, -'.yml'.length);
      const known = titles.get(configPath);
      if (titles.size > 0 && !known) continue; // removed from Lutris, config left behind
      let exe: string | null = null;
      try {
        exe = parseLutrisExe(readFileSync(path.join(gamesDir, config), 'utf8'));
      } catch {
        continue;
      }
      const installDir = exe ? path.dirname(exe) : null;
      const executable = exe ? path.basename(exe) : null;
      games.push({
        source: 'lutris',
        name: normalizeGameTitle(known?.name ?? lutrisTitleFromConfigPath(configPath)),
        sourceId: known?.slug ?? configPath,
        installDir,
        processCandidates: this.candidatesWithExplicit(executable, installDir),
        artwork: this.lutrisArtwork(root, known?.slug ?? configPath)
      });
    }
    return games;
  }

  private lutrisArtwork(root: string, slug: string): InstalledGame['artwork'] {
    for (const dir of ['coverart', 'banners']) {
      for (const ext of ['jpg', 'png']) {
        const file = path.join(root, dir, `${slug}.${ext}`);
        if (existsSync(file)) return { kind: 'file', path: file };
      }
    }
    return null;
  }

  private scanHeroicRoot(root: string): InstalledGame[] {
    if (!existsSync(root)) return [];
    return [
      ...this.scanLegendary(root),
      ...this.scanGog(root),
      ...this.scanSideload(root)
    ];
  }

  /** Epic via legendary: titles/art from Heroic's store cache, installs from legendary. */
  private scanLegendary(root: string): InstalledGame[] {
    const installed = this.readLegendaryInstalled();
    if (installed.size === 0) return [];
    const libraryFile = path.join(root, 'store_cache', 'legendary_library.json');
    const metadata = new Map<string, Record<string, unknown>>();
    if (existsSync(libraryFile)) {
      try {
        const parsed = asRecord(readJson(libraryFile));
        for (const entry of asArray(parsed?.library)) {
          const record = asRecord(entry);
          if (record && typeof record.app_name === 'string') metadata.set(record.app_name, record);
        }
      } catch {
        // Store cache is decoration; installs alone still list the games.
      }
    }
    const games: InstalledGame[] = [];
    for (const [appName, install] of installed) {
      const meta = metadata.get(appName);
      const title = typeof meta?.title === 'string'
        ? meta.title
        : typeof install.title === 'string' ? install.title : appName;
      const installPath = typeof install.install_path === 'string' ? install.install_path : null;
      const executable = typeof install.executable === 'string'
        ? path.basename(install.executable.replace(/\\/g, '/'))
        : null;
      games.push({
        source: 'heroic',
        name: normalizeGameTitle(title),
        sourceId: appName,
        installDir: installPath,
        processCandidates: this.candidatesWithExplicit(executable, installPath),
        artwork: typeof meta?.art_cover === 'string' && meta.art_cover.startsWith('https://')
          ? { kind: 'url', url: meta.art_cover }
          : null
      });
    }
    return games;
  }

  private readLegendaryInstalled(): Map<string, Record<string, unknown>> {
    const installed = new Map<string, Record<string, unknown>>();
    for (const root of this.roots.legendary) {
      const file = path.join(root, 'installed.json');
      if (!existsSync(file)) continue;
      try {
        const parsed = asRecord(readJson(file));
        if (!parsed) continue;
        for (const [appName, value] of Object.entries(parsed)) {
          const record = asRecord(value);
          if (record && !installed.has(appName)) installed.set(appName, record);
        }
      } catch {
        // Skip unreadable installed.json; the other root may still work.
      }
    }
    return installed;
  }

  private scanGog(root: string): InstalledGame[] {
    const installedFile = path.join(root, 'gog_store', 'installed.json');
    if (!existsSync(installedFile)) return [];
    let installedEntries: unknown[] = [];
    try {
      const parsed = asRecord(readJson(installedFile));
      installedEntries = asArray(parsed?.installed);
    } catch {
      return [];
    }
    const titles = new Map<string, Record<string, unknown>>();
    const libraryFile = path.join(root, 'store_cache', 'gog_library.json');
    if (existsSync(libraryFile)) {
      try {
        const parsed = asRecord(readJson(libraryFile));
        for (const entry of asArray(parsed?.games)) {
          const record = asRecord(entry);
          if (record && typeof record.app_name === 'string') titles.set(record.app_name, record);
        }
      } catch {
        // Fall back to app ids as names.
      }
    }
    const games: InstalledGame[] = [];
    for (const entry of installedEntries) {
      const record = asRecord(entry);
      if (!record || typeof record.appName !== 'string') continue;
      const meta = titles.get(record.appName);
      const title = typeof meta?.title === 'string' ? meta.title : record.appName;
      const installPath = typeof record.install_path === 'string' ? record.install_path : null;
      games.push({
        source: 'heroic',
        name: normalizeGameTitle(title),
        sourceId: record.appName,
        installDir: installPath,
        processCandidates: this.candidatesWithExplicit(null, installPath),
        artwork: typeof meta?.art_cover === 'string' && meta.art_cover.startsWith('https://')
          ? { kind: 'url', url: meta.art_cover }
          : null
      });
    }
    return games;
  }

  private scanSideload(root: string): InstalledGame[] {
    const file = path.join(root, 'sideload_apps', 'library.json');
    if (!existsSync(file)) return [];
    let entries: unknown[] = [];
    try {
      const parsed = asRecord(readJson(file));
      entries = asArray(parsed?.games);
    } catch {
      return [];
    }
    const games: InstalledGame[] = [];
    for (const entry of entries) {
      const record = asRecord(entry);
      if (!record || typeof record.app_name !== 'string' || typeof record.title !== 'string') continue;
      const install = asRecord(record.install);
      const executable = typeof install?.executable === 'string'
        ? path.basename(install.executable.replace(/\\/g, '/'))
        : null;
      games.push({
        source: 'heroic',
        name: normalizeGameTitle(record.title),
        sourceId: record.app_name,
        installDir: null,
        processCandidates: executable ? [executable] : [],
        artwork: typeof record.art_cover === 'string' && record.art_cover.startsWith('https://')
          ? { kind: 'url', url: record.art_cover }
          : null
      });
    }
    return games;
  }

  /**
   * Epic Games Launcher: one JSON *.item manifest per install. Engine
   * prerequisites and plugins carry no "games" category and are skipped.
   */
  private scanEpicManifests(root: string): InstalledGame[] {
    if (!existsSync(root)) return [];
    const games: InstalledGame[] = [];
    for (const entry of readdirSync(root).filter((name) => /\.item$/i.test(name))) {
      try {
        const record = asRecord(readJson(path.join(root, entry)));
        if (!record || typeof record.DisplayName !== 'string') continue;
        const categories = asArray(record.AppCategories).map(String);
        if (categories.length > 0 && !categories.includes('games')) continue;
        if (record.bIsIncompleteInstall === true) continue;
        const installDir = typeof record.InstallLocation === 'string' ? record.InstallLocation : null;
        const executable = typeof record.LaunchExecutable === 'string' && record.LaunchExecutable
          ? path.basename(record.LaunchExecutable.replace(/\\/g, '/'))
          : null;
        games.push({
          source: 'epic',
          name: normalizeGameTitle(record.DisplayName),
          sourceId: typeof record.AppName === 'string' ? record.AppName : entry,
          installDir,
          processCandidates: this.candidatesWithExplicit(executable, installDir),
          artwork: null
        });
      } catch {
        // One bad manifest never hides the rest.
      }
    }
    return games;
  }

  /** A launcher-declared executable is ground truth: it goes first, unconditionally. */
  private candidatesWithExplicit(executable: string | null, installDir: string | null): string[] {
    const ranked = installDir && existsSync(installDir) ? rankProcessCandidates(installDir) : [];
    if (!executable) return ranked;
    return [executable, ...ranked.filter((name) => name.toLowerCase() !== executable.toLowerCase())];
  }
}

interface LutrisTitle {
  name: string;
  slug: string;
}

/** configpath -> title/slug for installed Lutris games; empty if pga.db can't be read. */
function readLutrisTitles(dbPath: string): Map<string, LutrisTitle> {
  const titles = new Map<string, LutrisTitle>();
  if (!existsSync(dbPath)) return titles;
  try {
    // node:sqlite ships with Electron's Node (22.13+); loaded lazily so a runtime
    // without it just falls back to config-file names.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const rows = db.prepare(
        'SELECT name, slug, configpath FROM games WHERE installed = 1 AND configpath IS NOT NULL'
      ).all() as Array<{ name?: unknown; slug?: unknown; configpath?: unknown }>;
      for (const row of rows) {
        if (typeof row.configpath === 'string' && typeof row.name === 'string') {
          titles.set(row.configpath, {
            name: row.name,
            slug: typeof row.slug === 'string' ? row.slug : row.configpath
          });
        }
      }
    } finally {
      db.close();
    }
  } catch {
    titles.clear();
  }
  return titles;
}

/** The `exe:` value of the `game:` section in a Lutris game config. */
export function parseLutrisExe(yml: string): string | null {
  let inGame = false;
  for (const line of yml.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inGame = /^game:\s*$/.test(line);
      continue;
    }
    if (!inGame) continue;
    const match = /^\s+exe:\s*(.+?)\s*$/.exec(line);
    if (match) {
      const value = match[1].replace(/^(['"])(.*)\1$/, '$2');
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

/** "final-fantasy-vii-rebirth-1790796165" -> "Final Fantasy Vii Rebirth". */
export function lutrisTitleFromConfigPath(configPath: string): string {
  return configPath
    .replace(/-\d{6,}$/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
