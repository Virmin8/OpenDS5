import { execFileSync } from 'node:child_process';

/** vdsd's control pipe on Windows (Linux uses the /run/vdsd.sock socket). */
export const WINDOWS_VDSD_PIPE = '\\\\.\\pipe\\vdsd';

let windowsServiceInstalled: boolean | null = null;

/**
 * Whether the companion app talks to vdsd instead of the DS5 Bridge Pico
 * dongle: always on Linux, and on Windows once the vdsd service is installed.
 * OPENDS5_VDSD=1/0 forces it either way.
 */
export function vdsdBackendActive(platform: NodeJS.Platform = process.platform): boolean {
  const override = process.env.OPENDS5_VDSD;
  if (override === '1' || override === '0') {
    return override === '1';
  }
  if (platform === 'linux') {
    return true;
  }
  if (platform !== 'win32') {
    return false;
  }
  if (windowsServiceInstalled === null) {
    try {
      execFileSync('sc.exe', ['query', 'vdsd'], { stdio: 'ignore', windowsHide: true });
      windowsServiceInstalled = true;
    } catch {
      windowsServiceInstalled = false;
    }
  }
  return windowsServiceInstalled;
}
