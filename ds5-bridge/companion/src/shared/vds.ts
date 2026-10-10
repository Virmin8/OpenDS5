export type VdsBluetoothMode = 'vds' | 'normal';

export type VdsBluetoothStatus = {
  /** 'vds': OpenDS5 owns controller Bluetooth; 'normal': BlueZ input plugin on. */
  mode: VdsBluetoothMode;
  switching: boolean;
  /** vdsd is listening for controllers (vds mode only). */
  listening: boolean;
  auto: boolean;
  idleSeconds: number;
  lastError: string;
};

export type VdsController = {
  address: string;
  name: string;
  /** Known to BlueZ (paired). */
  paired: boolean;
  /** Connected to the system Bluetooth stack (BlueZ). */
  online: boolean;
  /** Attached to vds (registered in vdsd). */
  registered: boolean;
  /** Bridged by vdsd onto a virtual USB controller. */
  connected: boolean;
  path: string;
  profile: string;
  ports: number[];
};

export type VdsStatus = {
  available: boolean;
  error: string;
  /** Set when the socket refused us for permissions: what the user has to do about it. */
  accessHint?: string;
  /** null when the running vdsd does not support Bluetooth mode control. */
  bluetooth: VdsBluetoothStatus | null;
  controllers: VdsController[];
};

export type VdsDaemonLog = {
  available: boolean;
  error: string;
  traceInput: boolean;
  traceOutput: boolean;
  lines: string[];
};

export type VdsTraceScope = 'input' | 'output';

/** Audio delivery for one bridged controller (vdsd `audio` command). */
export type VdsAudioPortStats = {
  path: string;
  /** Audio packets went out within the last 250 ms. */
  streaming: boolean;
  /** Controller audio buffer, in 3 kHz samples and milliseconds. */
  bufferLength: number;
  bufferMs: number;
  /** Measured since the previous poll. */
  windowSeconds: number;
  packetsPerSecond: number;
  maxGapMs: number;
  /** Send gaps longer than the buffer: probable audible dropouts. */
  late: number;
  /** Times the send queue ran dry mid-stream. */
  refills: number;
  packetsTotal: number;
  lateTotal: number;
  refillsTotal: number;
  queueDepth: number;
  queueDroppedTotal: number;
  blockedTotal: number;
  headphones: boolean;
  speakerMono: boolean;
  speakerBoostDb: number;
  speakerVolumePercent: number;
  hapticsGainPercent: number;
};

export type VdsAudioStats = {
  available: boolean;
  error: string;
  ports: VdsAudioPortStats[];
};

export const VDS_IDLE_SECONDS_MIN = 10;
export const VDS_IDLE_SECONDS_MAX = 3600;
