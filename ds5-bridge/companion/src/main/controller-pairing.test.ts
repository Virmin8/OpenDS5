import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ControllerPairing } from './controller-pairing';

/** A stand-in bluetoothctl: records commands and answers through `respond`. */
function fakeBluetoothctl(respond: (command: string, say: (line: string) => void) => void) {
  const commands: string[] = [];
  const child = new EventEmitter() as ChildProcessWithoutNullStreams;
  const stdout = new PassThrough();
  const say = (line: string) => stdout.write(`\u001b[0;94m[bluetooth]\u001b[0m# ${line}\n`);
  Object.assign(child, {
    stdout,
    stderr: new PassThrough(),
    stdin: new Writable({
      write(chunk, _enc, done) {
        for (const command of chunk.toString().split('\n').filter(Boolean)) {
          commands.push(command);
          queueMicrotask(() => respond(command, say));
        }
        done();
      }
    }),
    kill: vi.fn()
  });
  return { child, commands, say };
}

const NEW_PAD = 'D4:2F:4B:11:22:33';
const OLD_PAD = 'D4:2F:4B:9D:AD:BC';

afterEach(() => {
  vi.useRealTimers();
});

describe('ControllerPairing', () => {
  it('finds a controller in pairing mode, pairs and trusts it', async () => {
    const fake = fakeBluetoothctl((command, say) => {
      if (command === 'scan on') {
        say('Discovery started');
        say('[NEW] Device 11:22:33:44:55:66 Some Speaker');
        say(`[NEW] Device ${NEW_PAD} Wireless Controller`);
      }
      if (command === `pair ${NEW_PAD}`) say('Pairing successful');
      if (command === `trust ${NEW_PAD}`) say(`Changing ${NEW_PAD} trust succeeded`);
    });
    const pairing = new ControllerPairing(() => fake.child);
    const stages: string[] = [];
    pairing.on('progress', (stage) => stages.push(stage));
    await expect(pairing.start()).resolves.toEqual({ ok: true, address: NEW_PAD, name: 'Wireless Controller' });
    expect(fake.commands).toEqual(expect.arrayContaining(['power on', 'agent NoInputNoOutput', 'default-agent', `pair ${NEW_PAD}`, `trust ${NEW_PAD}`]));
    expect(fake.commands).not.toContain('pair 11:22:33:44:55:66');
    expect(stages).toEqual(['starting', 'searching', 'pairing', 'trusting']);
  });

  it('does not count a controller that is merely already paired', async () => {
    vi.useFakeTimers();
    const fake = fakeBluetoothctl((command, say) => {
      if (command === 'devices') say(`Device ${OLD_PAD} DualSense Wireless Controller`);
    });
    const pairing = new ControllerPairing(() => fake.child);
    const result = pairing.start();
    await vi.advanceTimersByTimeAsync(61_000);
    await expect(result).resolves.toMatchObject({ ok: false, cancelled: false, error: expect.stringMatching(/No controller found/) });
    expect(fake.commands.some((c) => c.startsWith('pair'))).toBe(false);
  });

  it('forgets an already-known controller and pairs it fresh when it advertises', async () => {
    const fake = fakeBluetoothctl((command, say) => {
      if (command === 'devices') say(`Device ${OLD_PAD} DualSense Wireless Controller`);
      if (command === 'scan on') say(`[CHG] Device ${OLD_PAD} RSSI: -48`);
      if (command === `remove ${OLD_PAD}`) {
        say(`[DEL] Device ${OLD_PAD} DualSense Wireless Controller`);
        say('Device has been removed');
        say(`[NEW] Device ${OLD_PAD} ${OLD_PAD.replace(/:/g, '-')}`);
        say(`[CHG] Device ${OLD_PAD} Name: Wireless Controller`);
      }
      if (command === `pair ${OLD_PAD}`) say('Pairing successful');
      if (command === `trust ${OLD_PAD}`) say(`Changing ${OLD_PAD} trust succeeded`);
    });
    const pairing = new ControllerPairing(() => fake.child);
    await expect(pairing.start()).resolves.toMatchObject({ ok: true, address: OLD_PAD });
    const order = fake.commands.filter((c) => /^(remove|pair|trust) /.test(c));
    expect(order).toEqual([`remove ${OLD_PAD}`, `pair ${OLD_PAD}`, `trust ${OLD_PAD}`]);
  });

  it('reports a failed pairing', async () => {
    const fake = fakeBluetoothctl((command, say) => {
      if (command === 'scan on') say(`[NEW] Device ${NEW_PAD} Wireless Controller`);
      if (command === `pair ${NEW_PAD}`) say('Failed to pair: org.bluez.Error.AuthenticationFailed');
    });
    await expect(new ControllerPairing(() => fake.child).start())
      .resolves.toMatchObject({ ok: false, cancelled: false, error: expect.stringMatching(/AuthenticationFailed/) });
  });

  it('reports a missing adapter, a missing bluetoothctl, and cancelling', async () => {
    const noAdapter = fakeBluetoothctl((command, say) => {
      if (command === 'power on') say('No default controller available');
    });
    await expect(new ControllerPairing(() => noAdapter.child).start())
      .resolves.toMatchObject({ ok: false, error: expect.stringMatching(/No Bluetooth adapter/) });

    const missing = fakeBluetoothctl(() => undefined);
    const pairingMissing = new ControllerPairing(() => missing.child);
    const result = pairingMissing.start();
    missing.child.emit('error', Object.assign(new Error('spawn bluetoothctl ENOENT'), { code: 'ENOENT' }));
    await expect(result).resolves.toMatchObject({ ok: false, error: expect.stringMatching(/bluetoothctl was not found/) });

    const idle = fakeBluetoothctl(() => undefined);
    const pairing = new ControllerPairing(() => idle.child);
    const pending = pairing.start();
    pairing.cancel();
    await expect(pending).resolves.toEqual({ ok: false, cancelled: true, error: 'Cancelled.' });
    expect(pairing.running).toBe(false);
  });
});
