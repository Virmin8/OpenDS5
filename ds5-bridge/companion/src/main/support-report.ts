import type { BridgeSnapshot } from '../shared/types';
import type { VdsDaemonLog, VdsStatus } from '../shared/vds';

export interface SupportReportInput {
  appVersion: string;
  electronVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  osName: string;
  kernel: string;
  installType: string;
  vdsdVersion: string | null;
  moduleVersion: string | null;
  snapshot: BridgeSnapshot;
  vds: VdsStatus | null;
  daemonLog: VdsDaemonLog | null;
  homeDir: string;
  now: Date;
}

const LOG_LINES = 80;

/** Hides the device-specific half of Bluetooth addresses (AA:BB:CC:xx:xx:xx). */
export function maskBluetoothAddresses(text: string): string {
  return text.replace(
    /(?<![0-9A-Fa-f])([0-9A-Fa-f]{2}([:_-])[0-9A-Fa-f]{2}\2[0-9A-Fa-f]{2})\2[0-9A-Fa-f]{2}\2[0-9A-Fa-f]{2}\2[0-9A-Fa-f]{2}(?![0-9A-Fa-f])/g,
    (_match, vendor: string, sep: string) => `${vendor}${sep}xx${sep}xx${sep}xx`
  );
}

function redact(text: string, homeDir: string): string {
  let out = maskBluetoothAddresses(text);
  if (homeDir && homeDir.length > 1) {
    out = out.split(homeDir).join('~');
  }
  return out;
}

const POWER_STATES: Record<number, string> = { 0: 'discharging', 1: 'charging', 2: 'charged' };

/**
 * Plain text for a bug report: versions, install, bridge and controller
 * state, key settings and the end of the vdsd log. Bluetooth addresses are
 * masked, the home folder becomes ~, and the SteamGridDB key is never read.
 */
export function buildSupportReport(input: SupportReportInput): string {
  const { snapshot } = input;
  const status = snapshot.status;
  const settings = snapshot.settings;
  const lines: string[] = [];
  const row = (label: string, value: string | number | boolean | null | undefined) => {
    lines.push(`${label}: ${value === null || value === undefined || value === '' ? '--' : String(value)}`);
  };

  lines.push('### OpenDS5 support report', '', '```');
  row('Created', input.now.toISOString());
  row('OpenDS5', input.appVersion);
  row('Electron', input.electronVersion);
  row('OS', `${input.osName} (${input.platform} ${input.arch}, kernel ${input.kernel})`);
  row('Install', input.installType);
  row('vdsd', input.vdsdVersion);
  row('Driver (vds_hcd)', input.moduleVersion);

  lines.push('', '[Bridge]');
  row('State', snapshot.state);
  row('Message', snapshot.message);
  row('Protocol', snapshot.diagnostics.protocolVersion);
  row('Last error', snapshot.diagnostics.lastError);

  lines.push('', '[Controller]');
  if (status) {
    row('Connected', status.controllerConnected);
    row('Type', status.controllerType);
    row('Firmware', status.firmwareVersion);
    row('Battery', status.batteryPercent === null ? null : `${status.batteryPercent}%`);
    row('Power', POWER_STATES[status.rawPowerState] ?? `0x${status.rawPowerState.toString(16)}`);
    row('Mode', status.hostPersonaMode);
  } else {
    lines.push('(no status)');
  }

  lines.push('', '[Settings]');
  const profile = settings.controllerProfiles.find((p) => p.id === settings.selectedControllerProfileId);
  row('Profile', profile ? profile.name : settings.selectedControllerProfileId);
  row('Controller mode', settings.hostPersonaMode);
  row('HD haptics', `${settings.hapticsEnabled ? 'on' : 'off'}, ${settings.hapticsGainPercent}%`);
  row('Audio buffer', settings.hapticsBufferAuto ? 'auto' : settings.hapticsBufferLength);
  row('Speaker', `${settings.speakerEnabled ? 'on' : 'off'}, ${settings.speakerVolumePercent}%, boost ${settings.speakerBoostDb} dB`);
  row('Microphone', `${settings.duplexMicEnabled ? 'on' : 'off'}${settings.micMuted ? ', muted' : ''}`);
  row('Adaptive triggers', settings.adaptiveTriggersEnabled);
  row('Polling rate', settings.pollingRateMode);
  row('Idle disconnect', settings.idleDisconnectEnabled ? `${settings.idleDisconnectTimeoutMinutes} min` : 'off');

  if (input.vds) {
    lines.push('', '[vdsd]');
    row('Available', input.vds.available);
    if (input.vds.error) row('Error', input.vds.error);
    if (input.vds.bluetooth) {
      const bt = input.vds.bluetooth;
      row('Bluetooth mode', `${bt.mode}${bt.listening ? ', listening' : ''}${bt.auto ? ', auto' : ''}`);
    }
    for (const controller of input.vds.controllers) {
      row('Controller', [
        controller.address,
        controller.name,
        controller.connected ? 'connected' : controller.online ? 'online' : 'offline',
        controller.registered ? 'registered' : 'not registered'
      ].filter(Boolean).join(', '));
    }
  }

  if (input.daemonLog) {
    lines.push('', `[vdsd log, last ${LOG_LINES} lines]`);
    if (!input.daemonLog.available) {
      lines.push(`(unavailable: ${input.daemonLog.error || 'unknown'})`);
    } else {
      lines.push(...input.daemonLog.lines.slice(-LOG_LINES));
    }
  }
  lines.push('```', '');
  return redact(lines.join('\n'), input.homeDir);
}
