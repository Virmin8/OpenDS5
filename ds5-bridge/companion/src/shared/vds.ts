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

export const VDS_IDLE_SECONDS_MIN = 10;
export const VDS_IDLE_SECONDS_MAX = 3600;
