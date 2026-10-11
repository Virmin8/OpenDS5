import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type SetupProgressEvent =
  | { event: 'plan'; total: number; steps: string[]; log: string }
  | { event: 'step'; index: number; status: 'start' | 'ok' | 'fail'; exit?: number }
  | { event: 'done'; exit: number };

export function parseProgressLine(line: string): SetupProgressEvent | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    if (obj.event === 'plan' && Array.isArray(obj.steps)) return obj as unknown as SetupProgressEvent;
    if (obj.event === 'step' && typeof obj.index === 'number') return obj as unknown as SetupProgressEvent;
    if (obj.event === 'done' && typeof obj.exit === 'number') return obj as unknown as SetupProgressEvent;
    return null;
  } catch {
    return null;
  }
}

export function isSetupNeeded(opts?: {
  moduleSysfs?: string;
  serviceActive?: () => boolean;
}): boolean {
  const sysfs = opts?.moduleSysfs ?? '/sys/module/vds_hcd';
  const serviceActive =
    opts?.serviceActive ??
    (() => spawnSync('systemctl', ['is-active', '--quiet', 'vdsd.service']).status === 0);
  if (!fs.existsSync(sysfs)) return true;
  return !serviceActive();
}

/** Where Windows setup installs vdsd (admin-only, see opends5-setup.ps1). */
export function windowsInstalledVdsdPath(env: NodeJS.ProcessEnv = process.env): string {
  const programFiles = env.ProgramW6432 ?? env.ProgramFiles ?? 'C:\\Program Files';
  return path.win32.join(programFiles, 'OpenDS5', 'vds', 'vdsd.exe');
}

function fileDigest(filePath: string): string | null {
  try {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Windows: setup is needed while the vdsd service is missing, or when this app
 * version bundles a different vdsd than the one installed (after an update).
 */
export function isWindowsSetupNeeded(opts: {
  bundledVdsd: string;
  installedVdsd?: string;
  serviceInstalled?: () => boolean;
}): boolean {
  const serviceInstalled =
    opts.serviceInstalled ??
    (() => spawnSync('sc.exe', ['query', 'vdsd'], { stdio: 'ignore', windowsHide: true }).status === 0);
  if (!serviceInstalled()) return true;
  const bundled = fileDigest(opts.bundledVdsd);
  // A dev run without a bundled vdsd never nags about updating the service.
  if (bundled === null) return false;
  return bundled !== fileDigest(opts.installedVdsd ?? windowsInstalledVdsdPath());
}

// opends5-install's flags as opends5-setup.ps1 switches.
const WINDOWS_INSTALLER_SWITCHES: Record<string, string> = {
  '--dry-run': '-DryRun',
  '--yes': '-Yes',
  '--json-progress': '-JsonProgress',
  '--uninstall': '-Uninstall',
  '--purge': '-Purge',
  '--rebuild-module': '-RebuildModule'
};

/** How to run the platform installer: bash on Linux, PowerShell on Windows. */
export function installerCommand(
  installerPath: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
): { command: string; args: string[] } {
  if (platform !== 'win32') {
    return { command: 'bash', args: [installerPath, ...args] };
  }
  return {
    command: 'powershell.exe',
    args: [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      installerPath,
      ...args.map((arg) => WINDOWS_INSTALLER_SWITCHES[arg] ?? arg),
    ],
  };
}

export class SetupService {
  constructor(
    private readonly installerPath: string,
    private readonly appVersion: string,
  ) {}

  private env() {
    return { ...process.env, OPENDS5_MODULE_VERSION: this.appVersion };
  }

  dryRunPlan(): Promise<string> {
    return new Promise((resolve, reject) => {
      const launch = installerCommand(this.installerPath, ['--dry-run', '--yes']);
      const child = spawn(launch.command, launch.args, { env: this.env(), windowsHide: true });
      let out = '';
      let err = '';
      child.stdout.on('data', (d: Buffer) => (out += d));
      child.stderr.on('data', (d: Buffer) => (err += d));
      child.on('close', (code) =>
        code === 0 ? resolve(out) : reject(new Error(`dry-run failed (${code}): ${err}`)),
      );
    });
  }

  /**
   * Runs the installer unprivileged; it escalates itself once (pkexec on
   * Linux, UAC on Windows).
   * Resolves with the installer's exit code; progress events stream to onEvent.
   */
  /**
   * `rebuildModule` forces a fresh DKMS build even when vds_hcd is loaded — used after
   * an app update ships new module sources (the installer skips a loaded module otherwise).
   */
  install(onEvent: (e: SetupProgressEvent) => void, rebuildModule = false): Promise<number> {
    return this.run(['--yes', '--json-progress', ...(rebuildModule ? ['--rebuild-module'] : [])], onEvent);
  }

  /**
   * Removes everything the installer set up (module, vdsd, udev rules, wireplumber
   * config, BlueZ override, vds group, launcher); `purge` also drops app settings.
   */
  uninstall(purge: boolean, onEvent: (e: SetupProgressEvent) => void): Promise<number> {
    return this.run(['--uninstall', '--yes', '--json-progress', ...(purge ? ['--purge'] : [])], onEvent);
  }

  private run(args: string[], onEvent: (e: SetupProgressEvent) => void): Promise<number> {
    return new Promise((resolve) => {
      const launch = installerCommand(this.installerPath, args);
      const child = spawn(launch.command, launch.args, {
        env: this.env(),
        windowsHide: true,
      });
      let buffer = '';
      child.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk;
        let nl;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const event = parseProgressLine(buffer.slice(0, nl));
          buffer = buffer.slice(nl + 1);
          if (event) onEvent(event);
        }
      });
      child.on('close', (code) => resolve(code ?? 1));
    });
  }
}
