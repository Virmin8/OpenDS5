import { describe, expect, it, vi } from 'vitest';
import type { VdsStatus } from '../shared/vds';
import { pairNewController } from './pair-flow';

function vds(mode: 'vds' | 'normal', switching = false): VdsStatus {
  return {
    available: true,
    error: '',
    bluetooth: { mode, switching, listening: mode === 'vds', auto: false, idleSeconds: 120, lastError: '' },
    controllers: []
  };
}

function deps(start: 'vds' | 'normal', pairResult: Awaited<ReturnType<Parameters<typeof pairNewController>[0]['pair']>>) {
  let mode = start;
  let switchingPolls = 0;
  const calls: string[] = [];
  return {
    calls,
    deps: {
      status: vi.fn(async () => vds(mode, switchingPolls-- > 0)),
      setMode: vi.fn(async (next: 'vds' | 'normal') => { calls.push(`mode ${next}`); mode = next; switchingPolls = 2; return vds(mode, true); }),
      pair: vi.fn(async () => { calls.push(`pair (in ${mode})`); return pairResult; }),
      attach: vi.fn(async (address: string) => { calls.push(`attach ${address}`); return vds(mode); }),
      progress: vi.fn((stage: string) => calls.push(`> ${stage}`)),
      sleep: vi.fn(async () => undefined)
    }
  };
}

describe('pairNewController', () => {
  it('pairs in Normal mode, switches back to OpenDS5 mode, then attaches', async () => {
    const { calls, deps: d } = deps('vds', { ok: true, address: 'AA:BB:CC:DD:EE:FF', name: 'Wireless Controller' });
    const { result } = await pairNewController(d);
    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      '> to-normal', 'mode normal', 'pair (in normal)', '> restoring', 'mode vds', '> attaching', 'attach AA:BB:CC:DD:EE:FF'
    ]);
    expect(d.sleep).toHaveBeenCalled(); // waited for the switch to settle
  });

  it('leaves the mode alone when already in Normal mode', async () => {
    const { calls, deps: d } = deps('normal', { ok: true, address: 'AA:BB:CC:DD:EE:FF', name: 'Wireless Controller' });
    await pairNewController(d);
    expect(calls).toEqual(['pair (in normal)', '> attaching', 'attach AA:BB:CC:DD:EE:FF']);
  });

  it('switches back and does not attach when pairing fails or is cancelled', async () => {
    const { calls, deps: d } = deps('vds', { ok: false, cancelled: true, error: 'Cancelled.' });
    const { result } = await pairNewController(d);
    expect(result).toMatchObject({ ok: false, cancelled: true });
    expect(calls).toEqual(['> to-normal', 'mode normal', 'pair (in normal)', '> restoring', 'mode vds']);
  });

  it('switches back even if pairing throws', async () => {
    const { calls, deps: d } = deps('vds', { ok: true, address: 'x', name: 'y' });
    d.pair.mockRejectedValueOnce(new Error('boom'));
    await expect(pairNewController(d)).rejects.toThrow('boom');
    expect(calls.slice(-2)).toEqual(['> restoring', 'mode vds']);
  });
});
