import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LARGER_AUDIO_BLOCKS_CONFIG,
  largerAudioBlocksEnabled,
  largerAudioBlocksPath,
  setLargerAudioBlocks
} from './audio-blocks';

describe('largerAudioBlocksPath', () => {
  it('uses XDG_CONFIG_HOME, else ~/.config', () => {
    expect(largerAudioBlocksPath({ XDG_CONFIG_HOME: '/cfg' }, '/home/u'))
      .toBe('/cfg/wireplumber/wireplumber.conf.d/99-opends5-latency.conf');
    expect(largerAudioBlocksPath({}, '/home/u'))
      .toBe('/home/u/.config/wireplumber/wireplumber.conf.d/99-opends5-latency.conf');
  });
});

describe('setLargerAudioBlocks', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opends5-blocks-'));
    file = path.join(dir, 'wireplumber', 'wireplumber.conf.d', '99-opends5-latency.conf');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes the override and restarts PipeWire', async () => {
    const restart = vi.fn().mockResolvedValue(undefined);
    await expect(setLargerAudioBlocks(true, { file, restart })).resolves.toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe(LARGER_AUDIO_BLOCKS_CONFIG);
    expect(largerAudioBlocksEnabled(file)).toBe(true);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('removes the override and restarts PipeWire', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'hand-written');
    const restart = vi.fn().mockResolvedValue(undefined);
    await expect(setLargerAudioBlocks(false, { file, restart })).resolves.toBe(false);
    expect(fs.existsSync(file)).toBe(false);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('does not restart PipeWire when nothing changes', async () => {
    const restart = vi.fn().mockResolvedValue(undefined);
    await setLargerAudioBlocks(false, { file, restart });
    expect(restart).not.toHaveBeenCalled();
  });

  it('passes on a failed restart', async () => {
    const restart = vi.fn().mockRejectedValue(new Error('Unit pipewire.service not found.'));
    await expect(setLargerAudioBlocks(true, { file, restart })).rejects.toThrow('pipewire.service');
  });
});
