import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * "Larger audio blocks" (Linux): PipeWire's usual 256-frame blocks for the
 * controller instead of OpenDS5's 128-frame ones, for PCs where the small
 * blocks crackle. It is a user WirePlumber override, the same file the
 * README describes, so a copy made by hand also counts as on.
 */
export const LARGER_AUDIO_BLOCKS_CONFIG = `# Written by OpenDS5 (Audio > Larger Audio Blocks). Gives controller audio
# PipeWire's usual block size instead of OpenDS5's low-latency one, for PCs
# where the small blocks crackle. Turn the switch off, or delete this file
# and restart PipeWire, to undo.
monitor.alsa.rules = [
  {
    matches = [
      { node.name = "~alsa_output.usb-Sony_Interactive_Entertainment_DualSense.*" }
    ]
    actions = {
      update-props = {
        node.latency = "256/48000"
        api.alsa.period-size = 256
        api.alsa.period-num = 3
      }
    }
  }
]
`;

export function largerAudioBlocksPath(
  env: NodeJS.ProcessEnv = process.env,
  home: string = os.homedir()
): string {
  const configHome = env.XDG_CONFIG_HOME?.trim() || path.join(home, '.config');
  return path.join(configHome, 'wireplumber', 'wireplumber.conf.d', '99-opends5-latency.conf');
}

export function largerAudioBlocksEnabled(file = largerAudioBlocksPath()): boolean {
  return fs.existsSync(file);
}

/** Restarts the user's PipeWire session so WirePlumber reads the change. */
export function restartPipeWire(): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'systemctl',
      ['--user', 'restart', 'wireplumber', 'pipewire', 'pipewire-pulse'],
      { timeout: 15_000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolve();
      }
    );
  });
}

/**
 * Writes or removes the override and restarts PipeWire if anything changed.
 * Returns whether larger blocks are now on.
 */
export async function setLargerAudioBlocks(
  enabled: boolean,
  options: { file?: string; restart?: () => Promise<void> } = {}
): Promise<boolean> {
  const file = options.file ?? largerAudioBlocksPath();
  const restart = options.restart ?? restartPipeWire;
  if (largerAudioBlocksEnabled(file) === enabled) {
    return enabled;
  }
  if (enabled) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, LARGER_AUDIO_BLOCKS_CONFIG);
  } else {
    fs.rmSync(file, { force: true });
  }
  await restart();
  return enabled;
}
