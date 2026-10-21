import type { MenuItemConstructorOptions } from 'electron';
import type { HostPersonaMode } from '../shared/protocol';
import type { BridgeSnapshot } from '../shared/types';
import { isGameSettingsProfileId } from '../shared/game-settings';
import { formatTimeLeft } from '../shared/battery-time';

export interface TrayMenuActions {
  open(): void;
  quit(): void;
  selectProfile(id: string): void;
  setPersona(mode: HostPersonaMode): void;
  setMicrophone(on: boolean): void;
  turnOffController(): void;
}

const PERSONA_LABELS: Array<[HostPersonaMode, string]> = [
  ['dualsense', 'DualSense'],
  ['ds4', 'DualShock 4'],
  ['xbox', 'Xbox 360']
];

const CONTROLLER_NAMES: Record<string, string> = {
  dualsense: 'DualSense',
  'dualsense-edge': 'DualSense Edge'
};

/** The status line at the top of the tray menu. */
export function trayStatusLine(snapshot: BridgeSnapshot): string {
  if (snapshot.state !== 'connected') {
    return 'Bridge not detected';
  }
  const status = snapshot.status;
  if (!status?.controllerConnected) {
    return 'Controller not connected';
  }
  const name = CONTROLLER_NAMES[status.controllerType] ?? 'Controller';
  if (status.batteryPercent === null) {
    return name;
  }
  const detail = status.rawPowerState === 0x01
    ? ', charging'
    : status.rawPowerState === 0x02
      ? ', charged'
      : typeof snapshot.batteryMinutesLeft === 'number'
        ? `, ${formatTimeLeft(snapshot.batteryMinutesLeft)} left`
        : '';
  return `${name} — ${status.batteryPercent}%${detail}`;
}

/** Whether the microphone counts as on, the same way the app's switch shows it. */
export function trayMicrophoneOn(snapshot: BridgeSnapshot, vdsd: boolean): boolean {
  const settings = snapshot.settings;
  return vdsd ? settings.duplexMicEnabled && !settings.micMuted : settings.duplexMicEnabled;
}

/**
 * The tray's right-click menu: what the controller is doing, plus the
 * actions you'd want mid-game without opening the window.
 */
export function trayMenuTemplate(
  snapshot: BridgeSnapshot,
  actions: TrayMenuActions,
  options: { appName: string; vdsd: boolean }
): MenuItemConstructorOptions[] {
  const settings = snapshot.settings;
  const status = snapshot.status;
  const bridge = snapshot.state === 'connected';
  const controller = bridge && Boolean(status?.controllerConnected);

  const profiles = settings.controllerProfiles
    .filter((profile) => !isGameSettingsProfileId(profile.id) || profile.id === settings.selectedControllerProfileId)
    .map((profile): MenuItemConstructorOptions => ({
      label: isGameSettingsProfileId(profile.id) ? `${profile.name} (game)` : profile.name,
      type: 'radio',
      checked: profile.id === settings.selectedControllerProfileId,
      click: () => actions.selectProfile(profile.id)
    }));

  const supported = status?.supportedHostPersonaModes ?? ['dualsense'];
  const personas = PERSONA_LABELS
    .filter(([mode]) => supported.includes(mode) || mode === settings.hostPersonaMode)
    .map(([mode, label]): MenuItemConstructorOptions => ({
      label,
      type: 'radio',
      checked: mode === settings.hostPersonaMode,
      enabled: bridge && snapshot.personaTransition == null,
      click: () => actions.setPersona(mode)
    }));

  const microphoneOn = trayMicrophoneOn(snapshot, options.vdsd);
  const canTurnOff = controller && Boolean(status?.firmwareFlags.sleepControllerControl);

  return [
    { label: trayStatusLine(snapshot), enabled: false },
    { type: 'separator' },
    { label: 'Profile', enabled: profiles.length > 0, submenu: profiles },
    ...(personas.length > 1 ? [{ label: 'Controller Mode', enabled: bridge, submenu: personas }] : []),
    {
      label: 'Microphone',
      type: 'checkbox',
      checked: microphoneOn,
      enabled: controller,
      click: () => actions.setMicrophone(!microphoneOn)
    },
    { label: 'Turn Off Controller', enabled: canTurnOff, click: () => actions.turnOffController() },
    { type: 'separator' },
    { label: `Open ${options.appName}`, click: () => actions.open() },
    { label: 'Quit', click: () => actions.quit() }
  ];
}

/**
 * Everything the menu shows, so the tray only rebuilds its menu when one of
 * them changes rather than on every status poll.
 */
export function trayMenuSignature(snapshot: BridgeSnapshot, vdsd: boolean): string {
  const settings = snapshot.settings;
  const status = snapshot.status;
  return JSON.stringify([
    trayStatusLine(snapshot),
    settings.selectedControllerProfileId,
    settings.controllerProfiles.map((profile) => [profile.id, profile.name]),
    settings.hostPersonaMode,
    status?.supportedHostPersonaModes ?? null,
    snapshot.personaTransition == null,
    trayMicrophoneOn(snapshot, vdsd),
    Boolean(status?.firmwareFlags.sleepControllerControl)
  ]);
}
