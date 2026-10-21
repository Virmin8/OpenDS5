import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { describe, expect, it, vi } from 'vitest';
import { forgetSystemPairing, WindowsControllerPairing } from './windows-pairing';

const helper = (args: string[]) => ({ command: 'OpenDS5AudioHelper.exe', args });

function fakeHelper() {
  const child = new EventEmitter() as ChildProcessWithoutNullStreams;
  const stdout = new PassThrough();
  Object.assign(child, {
    stdout,
    stderr: new PassThrough(),
    stdin: new PassThrough(),
    kill: vi.fn(() => { queueMicrotask(() => child.emit('exit', null)); return true; })
  });
  const say = (value: unknown) => stdout.write(`${JSON.stringify(value)}\r\n`);
  return { child, say };
}

describe('WindowsControllerPairing', () => {
  it('runs the helper, reports its stages and returns its result', async () => {
    const fake = fakeHelper();
    const spawnHelper = vi.fn(() => fake.child);
    const pairing = new WindowsControllerPairing(helper, spawnHelper);
    const stages: string[] = [];
    pairing.on('progress', (stage) => stages.push(stage));
    const result = pairing.start();
    fake.say({ stage: 'searching' });
    fake.say({ stage: 'pairing' });
    fake.say({ result: { ok: true, address: 'D4:2F:4B:11:22:33', name: 'Wireless Controller' } });
    await expect(result).resolves.toEqual({ ok: true, address: 'D4:2F:4B:11:22:33', name: 'Wireless Controller' });
    expect(spawnHelper).toHaveBeenCalledWith({ command: 'OpenDS5AudioHelper.exe', args: ['--pair-controller'] });
    expect(stages).toEqual(['searching', 'pairing']);
  });

  it('passes on a failure from the helper', async () => {
    const fake = fakeHelper();
    const result = new WindowsControllerPairing(helper, () => fake.child).start();
    fake.say({ result: { ok: false, cancelled: false, error: 'Pairing failed (Failed).' } });
    await expect(result).resolves.toMatchObject({ ok: false, error: 'Pairing failed (Failed).' });
  });

  it('cancels by ending the helper, and reports a helper that dies', async () => {
    const fake = fakeHelper();
    const pairing = new WindowsControllerPairing(helper, () => fake.child);
    const result = pairing.start();
    pairing.cancel();
    await expect(result).resolves.toEqual({ ok: false, cancelled: true, error: 'Cancelled.' });
    expect(fake.child.kill).toHaveBeenCalled();

    const dying = fakeHelper();
    const second = new WindowsControllerPairing(helper, () => dying.child).start();
    dying.child.emit('exit', 1);
    await expect(second).resolves.toMatchObject({ ok: false, cancelled: false, error: expect.stringMatching(/stopped/) });
  });
});

describe('forgetSystemPairing', () => {
  it('Linux: removes the device with bluetoothctl', async () => {
    const run = vi.fn(async () => ({ code: 0, stdout: 'Device has been removed\n' }));
    await expect(forgetSystemPairing('d4:2f:4b:9d:ad:bc', 'linux', helper, run)).resolves.toEqual({ ok: true });
    expect(run).toHaveBeenCalledWith('bluetoothctl', ['remove', 'd4:2f:4b:9d:ad:bc']);
  });

  it('Linux: a device BlueZ no longer knows counts as forgotten', async () => {
    const run = vi.fn(async () => ({ code: 1, stdout: 'Device D4:2F:4B:9D:AD:BC not available\n' }));
    await expect(forgetSystemPairing('D4:2F:4B:9D:AD:BC', 'linux', helper, run)).resolves.toEqual({ ok: true });
  });

  it('Linux: reports other errors and a missing bluetoothctl', async () => {
    const failing = vi.fn(async () => ({ code: 1, stdout: 'Failed to remove device: org.bluez.Error.Failed\n' }));
    await expect(forgetSystemPairing('x', 'linux', helper, failing)).resolves.toMatchObject({ ok: false, error: expect.stringMatching(/Failed to remove/) });
    const missing = vi.fn(async () => { throw Object.assign(new Error('spawn bluetoothctl ENOENT'), { code: 'ENOENT' }); });
    await expect(forgetSystemPairing('x', 'linux', helper, missing)).resolves.toMatchObject({ ok: false, error: expect.stringMatching(/not found/) });
  });

  it('Windows: asks the helper to unpair and reads its answer', async () => {
    const run = vi.fn(async () => ({ code: 0, stdout: '{"result":{"ok":true,"address":"D4:2F:4B:9D:AD:BC"}}\r\n' }));
    await expect(forgetSystemPairing('d4:2f:4b:9d:ad:bc', 'win32', helper, run)).resolves.toEqual({ ok: true });
    expect(run).toHaveBeenCalledWith('OpenDS5AudioHelper.exe', ['--unpair-controller', 'd4:2f:4b:9d:ad:bc']);
    const refused = vi.fn(async () => ({ code: 1, stdout: '{"result":{"ok":false,"error":"Windows could not forget the controller (Failed)."}}\r\n' }));
    await expect(forgetSystemPairing('x', 'win32', helper, refused)).resolves.toMatchObject({ ok: false, error: expect.stringMatching(/could not forget/) });
  });
});
