import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { PairingResult } from './controller-pairing';

type Launch = { command: string; args: string[] };
type Spawn = (launch: Launch) => ChildProcessWithoutNullStreams;

/**
 * Windows: pairs through the helper's --pair-controller mode, which uses the
 * WinRT pairing API and reports JSON lines ({"stage"} then one {"result"}).
 * Same shape as ControllerPairing so the Bluetooth tab doesn't care which
 * platform it is on. Emits 'progress' with each stage.
 */
export class WindowsControllerPairing extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private cancelled = false;

  constructor(
    private readonly helper: (args: string[]) => Launch,
    private readonly spawnHelper: Spawn = (launch) => spawn(launch.command, launch.args, { stdio: 'pipe', windowsHide: true })
  ) {
    super();
  }

  start(): Promise<PairingResult> {
    if (this.child) {
      return Promise.resolve({ ok: false, cancelled: false, error: 'Pairing is already running.' });
    }
    this.cancelled = false;
    return new Promise<PairingResult>((resolve) => {
      let settled = false;
      const finish = (result: PairingResult) => {
        if (settled) return;
        settled = true;
        this.child = null;
        resolve(result);
      };
      let child: ChildProcessWithoutNullStreams;
      try {
        child = this.spawnHelper(this.helper(['--pair-controller']));
      } catch (error) {
        finish({ ok: false, cancelled: false, error: `Could not start the OpenDS5 helper: ${String(error)}` });
        return;
      }
      this.child = child;
      let buffer = '';
      child.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          let message: { stage?: string; result?: PairingResult };
          try {
            message = JSON.parse(line) as typeof message;
          } catch {
            continue;
          }
          if (message.stage) this.emit('progress', message.stage);
          if (message.result) finish(message.result);
        }
      });
      child.on('error', (error) => finish({ ok: false, cancelled: false, error: `Could not start the OpenDS5 helper: ${error.message}` }));
      child.on('exit', () => finish(this.cancelled
        ? { ok: false, cancelled: true, error: 'Cancelled.' }
        : { ok: false, cancelled: false, error: 'The OpenDS5 helper stopped before pairing finished.' }));
    });
  }

  cancel(): void {
    if (this.child) {
      this.cancelled = true;
      this.child.kill();
    }
  }
}

/** Removes a controller from the system's Bluetooth pairings. */
export function forgetSystemPairing(
  address: string,
  platform: NodeJS.Platform,
  helper: (args: string[]) => Launch,
  run: (command: string, args: string[]) => Promise<{ code: number; stdout: string }> = runCommand
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (platform === 'win32') {
    const launch = helper(['--unpair-controller', address]);
    return run(launch.command, launch.args).then(({ stdout }) => {
      const line = stdout.split(/\r?\n/).reverse().find((l) => l.includes('"result"'));
      try {
        const result = (JSON.parse(line ?? '') as { result: { ok: boolean; error?: string } }).result;
        return result.ok ? { ok: true as const } : { ok: false as const, error: result.error ?? 'Windows could not forget the controller.' };
      } catch {
        return { ok: false as const, error: 'The OpenDS5 helper did not answer.' };
      }
    });
  }
  return run('bluetoothctl', ['remove', address]).then(({ code, stdout }) => (
    code === 0 || /has been removed|not available/i.test(stdout)
      ? { ok: true as const }
      : { ok: false as const, error: stdout.trim().split('\n').pop() || 'bluetoothctl could not remove the controller.' }
  ), (error: NodeJS.ErrnoException) => ({
    ok: false as const,
    error: error.code === 'ENOENT'
      ? 'bluetoothctl was not found. Remove the controller in your Bluetooth settings.'
      : `bluetoothctl failed: ${error.message}`
  }));
}

function runCommand(command: string, args: string[]): Promise<{ code: number; stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: 20_000, windowsHide: true }, (error, stdout) => {
      if (error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(error);
        return;
      }
      resolve({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout: String(stdout) });
    });
  });
}
