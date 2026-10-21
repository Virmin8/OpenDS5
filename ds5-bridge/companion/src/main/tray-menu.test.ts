import type { MenuItemConstructorOptions } from 'electron';
import { describe, expect, it, vi } from 'vitest';
import type { BridgeSnapshot } from '../shared/types';
import { DEFAULT_SETTINGS } from './settings-store';
import { trayMenuSignature, trayMenuTemplate, trayStatusLine, type TrayMenuActions } from './tray-menu';

function snapshot(overrides: {
  state?: BridgeSnapshot['state'];
  controllerConnected?: boolean;
  batteryPercent?: number | null;
  rawPowerState?: number;
  settings?: Partial<BridgeSnapshot['settings']>;
  sleep?: boolean;
  personas?: string[];
} = {}): BridgeSnapshot {
  return {
    state: overrides.state ?? 'connected',
    message: '',
    status: {
      controllerConnected: overrides.controllerConnected ?? true,
      controllerType: 'dualsense',
      batteryPercent: overrides.batteryPercent === undefined ? 80 : overrides.batteryPercent,
      rawPowerState: overrides.rawPowerState ?? 0,
      supportedHostPersonaModes: overrides.personas ?? ['dualsense', 'ds4', 'xbox'],
      firmwareFlags: { sleepControllerControl: overrides.sleep ?? true }
    },
    settings: {
      ...DEFAULT_SETTINGS,
      controllerProfiles: [
        { id: 'default', name: 'Default' },
        { id: 'p-racing', name: 'Racing' },
        { id: 'game:steam:123', name: 'Control' }
      ],
      selectedControllerProfileId: 'p-racing',
      ...overrides.settings
    },
    diagnostics: {}
  } as unknown as BridgeSnapshot;
}

function actions(): TrayMenuActions {
  return {
    open: vi.fn(),
    quit: vi.fn(),
    selectProfile: vi.fn(),
    setPersona: vi.fn(),
    setMicrophone: vi.fn(),
    turnOffController: vi.fn()
  };
}

const find = (items: MenuItemConstructorOptions[], label: string) => {
  const item = items.find((entry) => entry.label === label);
  expect(item, label).toBeDefined();
  return item!;
};
const click = (item: MenuItemConstructorOptions) => (item.click as () => void)();

describe('tray menu', () => {
  it('describes the controller, battery and charging state', () => {
    expect(trayStatusLine(snapshot())).toBe('DualSense — 80%');
    expect(trayStatusLine(snapshot({ rawPowerState: 0x01 }))).toBe('DualSense — 80%, charging');
    expect(trayStatusLine(snapshot({ rawPowerState: 0x02, batteryPercent: 100 }))).toBe('DualSense — 100%, charged');
    expect(trayStatusLine(snapshot({ controllerConnected: false }))).toBe('Controller not connected');
    expect(trayStatusLine(snapshot({ state: 'no-bridge' }))).toBe('Bridge not detected');
  });

  it('lists your profiles (not other games\') and switches to the one clicked', () => {
    const acts = actions();
    const items = trayMenuTemplate(snapshot(), acts, { appName: 'OpenDS5', vdsd: true });
    const profiles = find(items, 'Profile').submenu as MenuItemConstructorOptions[];
    expect(profiles.map((p) => [p.label, p.checked])).toEqual([['Default', false], ['Racing', true]]);
    click(profiles[0]);
    expect(acts.selectProfile).toHaveBeenCalledWith('default');
  });

  it('switches controller mode among the supported personas', () => {
    const acts = actions();
    const items = trayMenuTemplate(snapshot({ personas: ['dualsense', 'xbox'] }), acts, { appName: 'OpenDS5', vdsd: true });
    const modes = find(items, 'Controller Mode').submenu as MenuItemConstructorOptions[];
    expect(modes.map((m) => m.label)).toEqual(['DualSense', 'Xbox 360']);
    click(modes[1]);
    expect(acts.setPersona).toHaveBeenCalledWith('xbox');
  });

  it('toggles the microphone the way the app\'s switch shows it', () => {
    const acts = actions();
    const on = snapshot({ settings: { duplexMicEnabled: true, micMuted: false } });
    const muted = snapshot({ settings: { duplexMicEnabled: true, micMuted: true } });
    const mic = find(trayMenuTemplate(on, acts, { appName: 'OpenDS5', vdsd: true }), 'Microphone');
    expect(mic.checked).toBe(true);
    click(mic);
    expect(acts.setMicrophone).toHaveBeenCalledWith(false);
    expect(find(trayMenuTemplate(muted, acts, { appName: 'OpenDS5', vdsd: true }), 'Microphone').checked).toBe(false);
    expect(find(trayMenuTemplate(muted, acts, { appName: 'OpenDS5', vdsd: false }), 'Microphone').checked).toBe(true);
  });

  it('disables controller actions without a controller', () => {
    const items = trayMenuTemplate(snapshot({ controllerConnected: false }), actions(), { appName: 'OpenDS5', vdsd: true });
    expect(find(items, 'Microphone').enabled).toBe(false);
    expect(find(items, 'Turn Off Controller').enabled).toBe(false);
    const noSleep = trayMenuTemplate(snapshot({ sleep: false }), actions(), { appName: 'OpenDS5', vdsd: true });
    expect(find(noSleep, 'Turn Off Controller').enabled).toBe(false);
    expect(find(items, 'Open OpenDS5').enabled).not.toBe(false);
  });

  it('changes signature only when something on the menu changes', () => {
    const base = trayMenuSignature(snapshot(), true);
    expect(trayMenuSignature(snapshot(), true)).toBe(base);
    expect(trayMenuSignature(snapshot({ batteryPercent: 79 }), true)).not.toBe(base);
    expect(trayMenuSignature(snapshot({ settings: { selectedControllerProfileId: 'default' } }), true)).not.toBe(base);
  });
});
