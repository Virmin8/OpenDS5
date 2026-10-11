import type { EventEmitter } from 'node:events';
import { WinUsbCompanionTransport } from './winusb-companion-transport';
import { VdsdCompanionTransport } from './vdsd-companion-transport';
import { MockCompanionTransport } from './mock-companion-transport';
import { vdsdBackendActive } from './vdsd-backend';

export type CompanionTransportOpenOptions = {
  retryTimeoutMs?: number;
  retryDelayMs?: number;
};

/**
 * Shared surface of the companion transports: vdsd's control socket/pipe
 * (Linux, and Windows with vdsd installed) and the Pico WinUSB helper.
 */
export interface CompanionTransport extends EventEmitter {
  readonly path: string;
  getFeatureReport(reportId: number, length?: number): Promise<number[]>;
  sendFeatureReport(report: ArrayLike<number>): Promise<void>;
  write(report: ArrayLike<number>): Promise<void>;
  close(): void;
}

export function openCompanionTransport(
  options: CompanionTransportOpenOptions = {}
): Promise<CompanionTransport> {
  if (process.env.DS5_BRIDGE_MOCK_CONTROLLER === '1') {
    return MockCompanionTransport.open(options);
  }
  if (process.platform === 'win32' && !vdsdBackendActive()) {
    return WinUsbCompanionTransport.open(options);
  }
  return VdsdCompanionTransport.open(options);
}
