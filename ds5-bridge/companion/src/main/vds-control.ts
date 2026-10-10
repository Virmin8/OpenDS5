import { createConnection } from 'node:net';
import type {
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
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
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
