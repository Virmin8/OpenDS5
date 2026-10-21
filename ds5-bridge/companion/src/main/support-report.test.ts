import { describe, expect, it } from 'vitest';
import type { BridgeSnapshot } from '../shared/types';
import { DEFAULT_SETTINGS } from './settings-store';
import { buildSupportReport, maskBluetoothAddresses, type SupportReportInput } from './support-report';

function input(overrides: Partial<SupportReportInput> = {}): SupportReportInput {
  const snapshot = {
    state: 'connected',
    message: 'Companion firmware connected',
    status: {
      controllerConnected: true,
      controllerType: 'dualsense',
      firmwareVersion: '1.6.3',
      batteryPercent: 64,
      rawPowerState: 1,
      hostPersonaMode: 'dualsense'
    },
    settings: {
      ...DEFAULT_SETTINGS,
      steamGridDbApiKey: 'secret-api-key-123',
      controllerProfiles: [{ id: 'p1', name: 'Racing' }],
      selectedControllerProfileId: 'p1'
    },
    diagnostics: { protocolVersion: '1.16', lastError: null }
  } as unknown as BridgeSnapshot;
  return {
    appVersion: '1.9.14',
    electronVersion: '44.7.2',
    platform: 'linux',
    arch: 'x64',
    osName: 'CachyOS',
    kernel: '7.2.11-1-cachyos',
    installType: 'distro package',
    vdsdVersion: 'vds 46711b5',
    moduleVersion: '1.9.13',
    snapshot,
    vds: {
      available: true,
      error: '',
      bluetooth: { mode: 'vds', listening: true, auto: false } as never,
      controllers: [{
        address: 'D4:2F:4B:9D:AD:BC', name: 'Wireless Controller', paired: true, online: true,
        registered: true, connected: true, path: '/dev/vds0', profile: '', ports: [0]
      }]
    },
    daemonLog: {
      available: true, error: '', traceInput: false, traceOutput: false,
      lines: [
        ...Array.from({ length: 100 }, (_, i) => `old line ${i}`),
        'config|INFO|controller registered address=d4:2f:4b:9d:ad:bc profile=""',
        'daemon|INFO|log=/home/alice/.local/state/vdsd.log'
      ]
    },
    homeDir: '/home/alice',
    now: new Date('2026-10-21T10:00:00Z'),
    ...overrides
  };
}

describe('support report', () => {
  it('lists versions, install, controller state and settings', () => {
    const report = buildSupportReport(input());
    expect(report).toContain('OpenDS5: 1.9.14');
    expect(report).toContain('Electron: 44.7.2');
    expect(report).toContain('OS: CachyOS (linux x64, kernel 7.2.11-1-cachyos)');
    expect(report).toContain('Install: distro package');
    expect(report).toContain('vdsd: vds 46711b5');
    expect(report).toContain('Battery: 64%');
    expect(report).toContain('Power: charging');
    expect(report).toContain('Profile: Racing');
    expect(report).toContain('Bluetooth mode: vds, listening');
  });

  it('includes only the end of the vdsd log', () => {
    const report = buildSupportReport(input());
    expect(report).not.toContain('old line 21\n');
    expect(report).toContain('old line 22');
    expect(report).toContain('old line 99');
  });

  it('never includes the SteamGridDB key, full Bluetooth addresses or the home folder', () => {
    const report = buildSupportReport(input());
    expect(report).not.toContain('secret-api-key-123');
    expect(report).not.toMatch(/9D:AD:BC|9d:ad:bc/);
    expect(report).toContain('D4:2F:4B:xx:xx:xx');
    expect(report).toContain('d4:2f:4b:xx:xx:xx');
    expect(report).not.toContain('/home/alice');
    expect(report).toContain('log=~/.local/state/vdsd.log');
  });

  it('says when vdsd or its log is unavailable', () => {
    const report = buildSupportReport(input({
      vds: null,
      daemonLog: { available: false, error: 'permission denied', traceInput: false, traceOutput: false, lines: [] }
    }));
    expect(report).toContain('(unavailable: permission denied)');
    expect(report).not.toContain('[vdsd]\n');
  });

  it('masks addresses with any separator but leaves other hex alone', () => {
    expect(maskBluetoothAddresses('dev_D4_2F_4B_9D_AD_BC')).toBe('dev_D4_2F_4B_xx_xx_xx');
    expect(maskBluetoothAddresses('sha 0a1b2c3d4e5f')).toBe('sha 0a1b2c3d4e5f');
  });
});
