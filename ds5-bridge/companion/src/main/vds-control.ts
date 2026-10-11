import fs from 'node:fs';
import { createConnection } from 'node:net';
import os from 'node:os';
import type {
  VdsAudioStats,
  VdsBluetoothMode,
  VdsBluetoothStatus,
  VdsController,
  VdsDaemonLog,
  VdsStatus,
  VdsTraceScope
} from '../shared/vds';
import { VDS_IDLE_SECONDS_MAX, VDS_IDLE_SECONDS_MIN } from '../shared/vds';
import { defaultVdsdSocketPath } from './vdsd-companion-transport';

type JsonObject = Record<string, unknown>;

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Sends one JSONL request to the vdsd control socket (the same protocol
 * vdsctl uses) and returns every JSON object line of the reply.
 */
function requestLines(payload: JsonObject, socketPath = defaultVdsdSocketPath()): Promise<JsonObject[]> {
  return new Promise<JsonObject[]>((resolve, reject) => {
    const socket = createConnection(socketPath);
    let response = '';
    let settled = false;
    const finish = (error: Error | null, lines?: JsonObject[]) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      if (error) {
        reject(error);
      } else {
        resolve(lines ?? []);
      }
    };
    const timeout = setTimeout(() => finish(new Error('vdsd control request timed out.')), REQUEST_TIMEOUT_MS);
    socket.on('error', (error) => finish(error));
    socket.on('connect', () => {
      socket.end(`${JSON.stringify(payload)}\n`);
    });
    socket.on('data', (chunk) => {
      response += chunk.toString('utf8');
    });
    socket.on('close', () => {
      try {
        const lines = response
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => JSON.parse(line) as JsonObject);
        if (lines.length === 1 && lines[0].OK === false) {
          finish(new Error(String(lines[0].error || 'vdsd rejected the request.')));
          return;
        }
        finish(null, lines);
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });
}

async function requestOk(payload: JsonObject): Promise<JsonObject> {
  const lines = await requestLines(payload);
  const reply = lines[0];
  if (!reply) {
    throw new Error('vdsd closed the control connection without a reply.');
  }
  return reply;
}

function parseBluetooth(reply: JsonObject): VdsBluetoothStatus {
  return {
    mode: reply.mode === 'normal' ? 'normal' : 'vds',
    switching: reply.switching === true,
    listening: reply.listening === true,
    auto: reply.auto === true,
    idleSeconds: typeof reply.idle_seconds === 'number' ? reply.idle_seconds : 120,
    lastError: typeof reply.last_error === 'string' ? reply.last_error : ''
  };
}

async function getBluetooth(): Promise<VdsBluetoothStatus | null> {
  try {
    return parseBluetooth(await requestOk({ command: 'bluetooth', op: 'get' }));
  } catch (error) {
    if (error instanceof Error && error.message.includes('unknown command')) {
      return null;
    }
    throw error;
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * vdsd only lets the vds group open its socket. Explains an EACCES: either the user
 * was added to vds (e.g. by the AUR package) after this session started, which only
 * a new login picks up, or the user is not in vds at all.
 */
export function vdsSocketAccessHint(groupFile: string, user: string, sessionGids: readonly number[]): string {
  const vds = groupFile.split('\n').map((line) => line.split(':')).find((fields) => fields[0] === 'vds');
  const gid = vds ? Number(vds[2]) : NaN;
  const members = vds?.[3]?.split(',').map((member) => member.trim()) ?? [];
  if (members.includes(user) && !sessionGids.includes(gid)) {
    return 'You were added to the vds group after logging in. Log out and back in to finish setting up OpenDS5.';
  }
  return 'Your user is not allowed to use vdsd. Add it to the vds group with "sudo usermod -aG vds $USER", then log out and back in.';
}

function socketAccessHint(): string {
  try {
    return vdsSocketAccessHint(fs.readFileSync('/etc/group', 'utf8'), os.userInfo().username, process.getgroups?.() ?? []);
  } catch {
    return vdsSocketAccessHint('', '', []);
  }
}

export async function getVdsStatus(): Promise<VdsStatus> {
  try {
    const bluetooth = await getBluetooth();
    const registered = await requestLines({ command: 'list' });
    const targets = await requestLines({ command: 'list-targets' });

    const controllers = new Map<string, VdsController>();
    const entry = (address: string): VdsController => {
      let controller = controllers.get(address);
      if (!controller) {
        controller = {
          address,
          name: '',
          paired: false,
          online: false,
          registered: false,
          connected: false,
          path: '',
          profile: '',
          ports: []
        };
        controllers.set(address, controller);
      }
      return controller;
    };
    for (const target of targets) {
      const address = asString(target.address);
      if (!address) {
        continue;
      }
      const controller = entry(address);
      controller.name = asString(target.name);
      controller.paired = true;
      controller.online = target.online === true;
      controller.registered = target.registered === true;
    }
    for (const item of registered) {
      const address = asString(item.address);
      if (!address) {
        continue;
      }
      const controller = entry(address);
      controller.registered = true;
      controller.connected = item.connected === true;
      controller.path = asString(item.path);
      controller.profile = asString(item.profile);
      controller.ports = Array.isArray(item.ports) ? item.ports.filter((port): port is number => typeof port === 'number') : [];
    }

    return {
      available: true,
      error: '',
      bluetooth,
      controllers: [...controllers.values()].sort((a, b) => a.address.localeCompare(b.address))
    };
  } catch (error) {
    const denied = (error as NodeJS.ErrnoException).code === 'EACCES';
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
      accessHint: denied ? socketAccessHint() : undefined,
      bluetooth: null,
      controllers: []
    };
  }
}

export async function attachVdsController(address: string): Promise<VdsStatus> {
  await requestOk({ command: 'attach', address, profile: '', ports: [] });
  return getVdsStatus();
}

export async function detachVdsController(address: string): Promise<VdsStatus> {
  await requestOk({ command: 'detach', address });
  return getVdsStatus();
}

export async function setVdsBluetoothMode(mode: VdsBluetoothMode): Promise<VdsStatus> {
  await requestOk({ command: 'bluetooth', op: 'set', mode });
  return getVdsStatus();
}

export async function setVdsBluetoothAuto(enabled: boolean, idleSeconds: number): Promise<VdsStatus> {
  const seconds = Math.round(Math.min(VDS_IDLE_SECONDS_MAX, Math.max(VDS_IDLE_SECONDS_MIN, idleSeconds)));
  await requestOk({
    command: 'bluetooth',
    op: 'set',
    auto: enabled ? 'on' : 'off',
    idle_seconds: String(seconds)
  });
  return getVdsStatus();
}

function parseDaemonLog(reply: JsonObject): VdsDaemonLog {
  return {
    available: true,
    error: '',
    traceInput: reply.trace_input === true,
    traceOutput: reply.trace_output === true,
    lines: Array.isArray(reply.lines) ? reply.lines.filter((line): line is string => typeof line === 'string') : []
  };
}

function daemonLogError(error: unknown): VdsDaemonLog {
  const message = error instanceof Error ? error.message : String(error);
  return {
    available: false,
    error: message.includes('unknown command') ? 'This vdsd is too old for log access; install the updated vdsd.' : message,
    traceInput: false,
    traceOutput: false,
    lines: []
  };
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Audio delivery stats per bridged controller; resets vdsd's per-poll window. */
export async function getVdsAudioStats(): Promise<VdsAudioStats> {
  try {
    const reply = await requestOk({ command: 'audio' });
    const ports = Array.isArray(reply.ports) ? reply.ports : [];
    return {
      available: true,
      error: '',
      ports: ports.filter((port): port is JsonObject => typeof port === 'object' && port !== null && !Array.isArray(port))
        .map((port) => ({
          path: asString(port.path),
          streaming: port.streaming === true,
          bufferLength: asNumber(port.buffer_length),
          bufferMs: asNumber(port.buffer_ms),
          windowSeconds: asNumber(port.window_seconds),
          packetsPerSecond: asNumber(port.packets_per_second),
          maxGapMs: asNumber(port.max_gap_ms),
          late: asNumber(port.late),
          refills: asNumber(port.refills),
          packetsTotal: asNumber(port.packets_total),
          lateTotal: asNumber(port.late_total),
          refillsTotal: asNumber(port.refills_total),
          queueDepth: asNumber(port.queue_depth),
          queueDroppedTotal: asNumber(port.queue_dropped_total),
          trimsTotal: asNumber(port.trims_total),
          hapticsOnly: port.haptics_only === true,
          hapticsOnlyTotal: asNumber(port.haptics_only_total),
          packetMode: asString(port.packet_mode),
          micOpen: port.mic_open === true,
          micPacketsPerSecond: asNumber(port.mic_packets_per_second),
          micPacketsTotal: asNumber(port.mic_packets_total),
          micStartupMs: typeof port.mic_startup_ms === 'number' ? port.mic_startup_ms : -1,
          micFirstSoundMs: typeof port.mic_first_sound_ms === 'number' ? port.mic_first_sound_ms : -1,
          micWhileClosedTotal: asNumber(port.mic_while_closed_total),
          blockedTotal: asNumber(port.blocked_total),
          bufferAuto: port.buffer_auto === true,
          headphones: port.headphones === true,
          speakerMono: port.speaker_mono === true,
          speakerBoostDb: asNumber(port.speaker_boost_db),
          speakerVolumePercent: asNumber(port.speaker_volume_percent),
          hapticsGainPercent: asNumber(port.haptics_gain_percent)
        }))
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      available: false,
      error: message.includes('unknown command') ? 'This vdsd is too old for audio stats; install the updated vdsd.' : message,
      ports: []
    };
  }
}

/** Tail of the root-only vdsd log plus the current trace flags. */
export async function getVdsDaemonLog(lines = 200): Promise<VdsDaemonLog> {
  try {
    return parseDaemonLog(await requestOk({ command: 'log', lines: String(Math.round(lines)) }));
  } catch (error) {
    return daemonLogError(error);
  }
}

/** Same as `vdsctl trace on|off --scope <scope>`, returning the refreshed log. */
export async function setVdsDaemonTrace(scope: VdsTraceScope, enabled: boolean, lines = 200): Promise<VdsDaemonLog> {
  try {
    return parseDaemonLog(await requestOk({
      command: 'log',
      lines: String(Math.round(lines)),
      trace: enabled ? 'on' : 'off',
      scope
    }));
  } catch (error) {
    return daemonLogError(error);
  }
}
