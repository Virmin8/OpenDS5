import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';

export type PairingStage = 'starting' | 'searching' | 'pairing' | 'trusting';

export type PairingResult =
  | { ok: true; address: string; name: string }
  | { ok: false; cancelled: boolean; error: string };

const CONTROLLER_NAME = /wireless controller|dualsense/i;
const SEARCH_TIMEOUT_MS = 60_000;
const PAIR_TIMEOUT_MS = 30_000;
// bluetoothctl colours its output and redraws its prompt.
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]|\u0001|\u0002|\r/g;
const DEVICE_LINE = /Device ([0-9A-F]{2}(?::[0-9A-F]{2}){5})(?: (.*))?$/i;

type Spawn = () => ChildProcessWithoutNullStreams;

/**
 * Pairs a DualSense in pairing mode through BlueZ, driving bluetoothctl the
 * way you would by hand: power on, a no-PIN agent, scan for a "Wireless
 * Controller", pair, trust. OpenDS5 mode only stops bluetoothd's input
 * plugin, so pairing works in either Bluetooth mode. Emits 'progress' with
 * the current stage.
 */
export class ControllerPairing extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private settle: ((result: PairingResult) => void) | null = null;
  private timer: NodeJS.Timeout | null = null;
  private buffer = '';
  private names = new Map<string, string>();
  /** Devices BlueZ already knew when pairing started. */
  private known = new Set<string>();
  private removing: string | null = null;
  private removed = false;
  private target: string | null = null;
  private stage: PairingStage = 'starting';

  constructor(private readonly spawnBluetoothctl: Spawn = () => spawn('bluetoothctl', [], { stdio: 'pipe' })) {
    super();
  }

  get running(): boolean {
    return this.child !== null;
  }

  start(): Promise<PairingResult> {
    if (this.child) {
      return Promise.resolve({ ok: false, cancelled: false, error: 'Pairing is already running.' });
    }
    return new Promise<PairingResult>((resolve) => {
      this.settle = resolve;
      let child: ChildProcessWithoutNullStreams;
      try {
        child = this.spawnBluetoothctl();
      } catch {
        this.finish({ ok: false, cancelled: false, error: notInstalled() });
        return;
      }
      this.child = child;
      child.on('error', (error: NodeJS.ErrnoException) => {
        this.finish({
          ok: false,
          cancelled: false,
          error: error.code === 'ENOENT' ? notInstalled() : `bluetoothctl failed: ${error.message}`
        });
      });
      child.on('exit', () => {
        if (this.settle) {
          this.finish({ ok: false, cancelled: false, error: 'bluetoothctl stopped unexpectedly.' });
        }
      });
      child.stdout.on('data', (chunk: Buffer) => this.onOutput(chunk.toString('utf8')));
      child.stderr.on('data', (chunk: Buffer) => this.onOutput(chunk.toString('utf8')));
      this.setStage('starting');
      this.send('power on');
      this.send('agent NoInputNoOutput');
      this.send('default-agent');
      this.send('devices');
      this.send('scan on');
      this.setStage('searching');
      this.arm(SEARCH_TIMEOUT_MS, 'No controller found. Hold PS and Create until the light bar flashes quickly, then try again.');
    });
  }

  cancel(): void {
    if (this.settle) {
      this.finish({ ok: false, cancelled: true, error: 'Cancelled.' });
    }
  }

  private setStage(stage: PairingStage): void {
    this.stage = stage;
    this.emit('progress', stage);
  }

  private send(command: string): void {
    this.child?.stdin.write(`${command}\n`);
  }

  private arm(ms: number, message: string): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.finish({ ok: false, cancelled: false, error: message }), ms);
    this.timer.unref?.();
  }

  private onOutput(text: string): void {
    this.buffer += text.replace(ANSI, '');
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    for (const raw of lines) {
      this.onLine(raw.replace(/^\[[^\]]*\][#>]\s*/, '').trim());
    }
  }

  private onLine(line: string): void {
    if (!line) return;
    if (/No default controller available|org\.bluez\.Error\.NotReady/i.test(line)) {
      this.finish({ ok: false, cancelled: false, error: 'No Bluetooth adapter is available, or it is turned off.' });
      return;
    }
    const event = /^\[(NEW|CHG|DEL)\]\s+/.exec(line);
    const device = DEVICE_LINE.exec(event ? line.slice(event[0].length) : line);
    if (device) {
      this.onDevice(event?.[1] ?? null, device[1].toUpperCase(), (device[2] ?? '').trim());
      return;
    }
    if (/Device has been removed/i.test(line) && this.removing) {
      this.removed = true;
      return;
    }
    if (this.stage === 'pairing' && /Pairing successful|AlreadyExists/i.test(line)) {
      this.send(`trust ${this.target}`);
      this.setStage('trusting');
      return;
    }
    if (this.stage === 'pairing' && /Failed to pair|AuthenticationFailed|AuthenticationCanceled|ConnectionAttemptFailed|not available/i.test(line)) {
      this.finish({
        ok: false,
        cancelled: false,
        error: `Pairing failed (${line.replace(/^Failed to pair:\s*/i, '')}). Put the controller back in pairing mode and try again.`
      });
      return;
    }
    if (this.stage === 'trusting' && /trust succeeded/i.test(line)) {
      const address = this.target!;
      this.finish({ ok: true, address, name: this.names.get(address) ?? 'Wireless Controller' });
    }
  }

  /**
   * A device line: from the startup `devices` listing (event null) or a scan
   * event. Only scan events mean the controller is advertising, i.e. in
   * pairing mode.
   */
  private onDevice(event: string | null, address: string, rest: string): void {
    const nameChange = /^Name:\s*(.+)$/.exec(rest);
    const isProperty = /^[A-Za-z]+:/.test(rest);
    if (nameChange) {
      this.names.set(address, nameChange[1]);
    } else if (rest && !isProperty) {
      this.names.set(address, rest);
    }
    if (event === null) {
      this.known.add(address);
      return;
    }
    if (event === 'DEL') {
      if (address === this.removing) this.removed = true;
      return;
    }
    if (this.stage !== 'searching' || !CONTROLLER_NAME.test(this.names.get(address) ?? '')) {
      return;
    }
    if (this.removing === address) {
      // Removed and seen again: pair it fresh.
      if (this.removed) this.pair(address);
      return;
    }
    if (this.known.has(address)) {
      // BlueZ still has old keys for it; a controller in pairing mode has new
      // ones, so forget it and pair again once the scan sees it.
      this.removing = address;
      this.removed = false;
      this.send(`remove ${address}`);
      return;
    }
    this.pair(address);
  }

  private pair(address: string): void {
    this.target = address;
    this.send('scan off');
    this.send(`pair ${address}`);
    this.setStage('pairing');
    this.arm(PAIR_TIMEOUT_MS, 'Pairing timed out. Put the controller back in pairing mode and try again.');
  }

  private finish(result: PairingResult): void {
    const settle = this.settle;
    this.settle = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const child = this.child;
    this.child = null;
    if (child) {
      try {
        child.stdin.write('scan off\nquit\n');
        child.stdin.end();
      } catch {
        // already gone
      }
      setTimeout(() => child.kill(), 2000).unref?.();
    }
    this.target = null;
    this.removing = null;
    this.removed = false;
    this.known.clear();
    this.buffer = '';
    settle?.(result);
  }
}

function notInstalled(): string {
  return 'bluetoothctl was not found. Install your distribution\'s BlueZ tools (bluez-utils or bluez), or pair the controller in your Bluetooth settings.';
}
