import {
  IconBluetooth,
  IconBulb,
  IconCpu,
  IconDeviceGamepad2,
  IconDeviceGamepad3,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconTargetArrow,
  IconVolume,
  IconSparkles as Sparkles,
  type TablerIcon
} from '@tabler/icons-react';
import type {
  ControllerProfileSettings,
  HostPersonaMode,
  MuteButtonMode,
  MuteKeyboardBehavior,
  PollingRateMode
} from '../../shared/protocol';
import type { BridgeSnapshot, UiScalePercent, UiThemePreset } from '../../shared/types';
import { DEFAULT_UI_THEME_PRESET, UI_THEME_OPTIONS } from '../ui-themes';
import type { ControlTab, StartupTutorialStep } from './types';

export const CONTROLLER_POWER_SAVING_CAP_PERCENT = 60;
export const SLEEP_CONFIRM_MS = 2400;
export const PERCENT_SLIDER_TICKS = Array.from({ length: 11 }, (_, index) => index * 10);
export const MUTE_KEY_OPTIONS: Array<[string, number]> = [
  ['F1', 0x3A], ['F2', 0x3B], ['F3', 0x3C], ['F4', 0x3D], ['F5', 0x3E], ['F6', 0x3F],
  ['F7', 0x40], ['F8', 0x41], ['F9', 0x42], ['F10', 0x43], ['F11', 0x44], ['F12', 0x45],
  ['F13', 0x68], ['F14', 0x69], ['F15', 0x6A], ['F16', 0x6B], ['F17', 0x6C], ['F18', 0x6D],
  ['F19', 0x6E], ['F20', 0x6F], ['F21', 0x70], ['F22', 0x71], ['F23', 0x72], ['F24', 0x73],
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, index) => [letter, 0x04 + index] as [string, number]),
  ['1', 0x1E], ['2', 0x1F], ['3', 0x20], ['4', 0x21], ['5', 0x22],
  ['6', 0x23], ['7', 0x24], ['8', 0x25], ['9', 0x26], ['0', 0x27],
  ['Enter', 0x28], ['Escape', 0x29], ['Backspace', 0x2A], ['Tab', 0x2B], ['Space', 0x2C],
  ['-', 0x2D], ['=', 0x2E], ['[', 0x2F], [']', 0x30], ['\\', 0x31],
  [';', 0x33], ["'", 0x34], ['`', 0x35], [',', 0x36], ['.', 0x37], ['/', 0x38],
  ['Insert', 0x49], ['Home', 0x4A], ['Page Up', 0x4B], ['Delete', 0x4C], ['End', 0x4D], ['Page Down', 0x4E],
  ['Right Arrow', 0x4F], ['Left Arrow', 0x50], ['Down Arrow', 0x51], ['Up Arrow', 0x52]
];
export const MUTE_MODIFIER_OPTIONS: Array<[string, number]> = [
  ['Ctrl', 0x01],
  ['Shift', 0x02],
  ['Alt', 0x04],
  ['Win', 0x08]
];
export const ALL_MUTE_BUTTON_MODE_OPTIONS: Array<[string, MuteButtonMode]> = [
  ['Normal', 'normal'],
  ['Keyboard Key', 'keyboard'],
  ['Quiet Toggle', 'quiet'],
  ['Chord', 'chord']
];
export const MUTE_KEYBOARD_BEHAVIOR_OPTIONS: Array<[string, MuteKeyboardBehavior]> = [
  ['Tap Once', 'tap'],
  ['Hold While Pressed', 'hold']
];
export const OPENDS5_REPOSITORY_URL = 'https://github.com/Virmin8/OpenDS5';
// The LordVicky/OpenDS5 release this fork is based on.
export const UPSTREAM_OPENDS5_VERSION = '1.8.1';
export const VDS_AVAILABLE = typeof window !== 'undefined' && window.vds?.vdsd === true;
export const VDS_LINUX = VDS_AVAILABLE && window.vds.platform === 'linux';
// The touchpad moves the cursor through Linux's DualSense driver (vdsd can
// grab it) or the Pico firmware; vdsd on Windows has no pointer to toggle.
export const TOUCHPAD_MOUSE_AVAILABLE = !VDS_AVAILABLE || VDS_LINUX;
// Trigger modifiers and state switch rules react to controller input, which
// the app reads from the Linux input device; Windows has no reader yet.
// Windows exposes no RSSI for a classic Bluetooth link (Linux reads it via HCI).
export const SIGNAL_STRENGTH_AVAILABLE = !VDS_AVAILABLE || VDS_LINUX;
// Bars lit in the Device card's signal icon for each signal quality.
export const SIGNAL_BAR_COUNTS: Record<string, number> = { Excellent: 4, Good: 3, 'Audio Risk': 2, Poor: 1 };
export const CONTROLLER_INPUT_AVAILABLE =typeof window === 'undefined' || window.vds?.platform !== 'win32';
// A distribution package removes the driver and vdsd itself, so the in-app
// uninstaller is hidden. On Windows it removes the vdsd service; the app
// itself goes from the Apps list.
export const SYSTEM_UNINSTALL_AVAILABLE = VDS_AVAILABLE && !window.vds.systemPackage;
// vdsd handles Mute as mic mute (Normal) or a chord starter (Chord); it has no
// keyboard emulation or quiet mode.
export const MUTE_BUTTON_MODE_OPTIONS = ALL_MUTE_BUTTON_MODE_OPTIONS.filter(
  ([, mode]) => !VDS_AVAILABLE || mode === 'normal' || mode === 'chord'
);
export const POLLING_RATE_OPTIONS: Array<[string, PollingRateMode]> = [
  ['1000 Hz / Real-time', '1000'],
  ['500 Hz', '500'],
  ['250 Hz', '250']
];
export const STARTUP_PROFILE_LAST_USED = '__last__';
export const HOST_PERSONA_OPTIONS: Array<[string, HostPersonaMode]> = [
  ['DualSense', 'dualsense'],
  ['DualShock 4', 'ds4'],
  ['Xbox', 'xbox']
];
export const IDLE_DISCONNECT_TIMEOUT_OPTIONS: Array<[string, number]> = [
  ['1 min', 1],
  ['5 min', 5],
  ['15 min', 15],
  ['30 min', 30],
  ['1 hour', 60],
  ['2 hours', 120]
];
export const UI_SCALE_OPTIONS: Array<[string, UiScalePercent]> = [
  ['75%', 75],
  ['100%', 100],
  ['125%', 125],
  ['150%', 150]
];
// Volume/profile/turn-off shortcuts: vdsd uses a touchpad click as the modifier
// (Mute is the mic mute; holding PS powers the DualSense off); the DS5 Bridge
// firmware uses PS.
export const SHORTCUT_MODIFIER_LABEL = VDS_AVAILABLE ? 'Touchpad' : 'PlayStation Home';
export const CONTROL_TABS: Array<{ id: ControlTab; label: string; Icon: TablerIcon }> = [
  { id: 'game-profile', label: 'Game Profile', Icon: IconLayoutGrid },
  { id: 'overview', label: 'Overview', Icon: IconLayoutDashboard },
  ...(VDS_AVAILABLE ? [{ id: 'vds' as const, label: 'Bluetooth', Icon: IconBluetooth }] : []),
  { id: 'audio', label: 'Audio', Icon: IconVolume },
  { id: 'haptics', label: 'Haptics', Icon: Sparkles },
  { id: 'triggers', label: 'Triggers', Icon: IconDeviceGamepad2 },
  { id: 'trigger-profiles', label: 'Trigger Profiles', Icon: IconTargetArrow },
  { id: 'lighting', label: 'Lighting', Icon: IconBulb },
  { id: 'remapping', label: 'Button Remapping', Icon: IconDeviceGamepad3 },
  { id: 'system', label: 'System', Icon: IconCpu }
];
export const UI_THEME_PRESET_STORAGE_KEY = 'ds5bridge.uiThemePreset';
export const STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY = 'ds5bridge.startupTutorialCompleted.v1';
export const STARTUP_READY_HOLD_MS = 1000;

export function isUiThemePreset(value: string | null): value is UiThemePreset {
  return UI_THEME_OPTIONS.some(([, preset]) => preset === value);
}

export function storedUiThemePreset(): UiThemePreset {
  const saved = window.localStorage.getItem(UI_THEME_PRESET_STORAGE_KEY);
  return isUiThemePreset(saved) ? saved : DEFAULT_UI_THEME_PRESET;
}

export function saveUiThemePreset(preset: UiThemePreset): void {
  window.localStorage.setItem(UI_THEME_PRESET_STORAGE_KEY, preset);
}

export function storedStartupTutorialStep(): StartupTutorialStep {
  return window.localStorage.getItem(STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY) === '1' ? 'done' : 'feature-toggle';
}

export function saveStartupTutorialCompleted(): void {
  window.localStorage.setItem(STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY, '1');
}

/**
 * Filter select options by a case-insensitive substring match against the
 * option label. A blank query returns a copy of every option unchanged.
 */
export function filterSelectOptionsByLabel<T>(
  options: ReadonlyArray<[string, T]>,
  query: string
): Array<[string, T]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...options];
  return options.filter(([label]) => label.toLowerCase().includes(needle));
}

export function controllerPowerSavingActiveFromSnapshot(snapshot: BridgeSnapshot | null | undefined): boolean {
  return Boolean(snapshot?.settings.controllerPowerSavingEnabled && snapshot.diagnostics.audioStatus?.headsetPlugged);
}

export function capControllerPowerSavingValue(value: number, snapshot: BridgeSnapshot | null | undefined): number {
  return controllerPowerSavingActiveFromSnapshot(snapshot)
    ? Math.min(value, CONTROLLER_POWER_SAVING_CAP_PERCENT)
    : value;
}

export function sliderTickClass(value: number, max: number): string | undefined {
  if (value === 0 || value === max) {
    return 'milestone endpoint';
  }
  if (value === max / 2) {
    return 'milestone';
  }
  return undefined;
}

export function controllerProfileSettingsFromSnapshot(snapshot: BridgeSnapshot): ControllerProfileSettings {
  return {
    hapticsEnabled: snapshot.settings.hapticsEnabled,
    hapticsGainPercent: snapshot.settings.hapticsGainPercent,
    feedbackBoostEnabled: snapshot.settings.feedbackBoostEnabled,
    classicRumbleEnabled: snapshot.settings.classicRumbleEnabled,
    classicRumbleGainPercent: snapshot.settings.classicRumbleGainPercent,
    classicRumbleV1Enabled: snapshot.settings.classicRumbleV1Enabled,
    adaptiveTriggersEnabled: snapshot.settings.adaptiveTriggersEnabled,
    triggerEffectIntensityPercent: snapshot.settings.triggerEffectIntensityPercent,
    triggerTestMode: snapshot.settings.triggerTestMode,
    speakerEnabled: snapshot.settings.speakerEnabled,
    speakerVolumePercent: snapshot.settings.speakerVolumePercent,
    micVolumePercent: snapshot.settings.micVolumePercent,
    micMuted: snapshot.settings.micMuted,
    lightbarEnabled: snapshot.settings.lightbarEnabled,
    lightbarColor: snapshot.settings.lightbarColor,
    lightbarBrightnessPercent: snapshot.settings.lightbarBrightnessPercent,
    lightbarOverrideEnabled: snapshot.settings.lightbarOverrideEnabled,
    muteButtonMode: snapshot.settings.muteButtonMode,
    muteKeyboardUsage: snapshot.settings.muteKeyboardUsage,
    muteKeyboardModifiers: snapshot.settings.muteKeyboardModifiers,
    muteKeyboardBehavior: snapshot.settings.muteKeyboardBehavior,
    muteKeyboardChordStarterEnabled: snapshot.settings.muteKeyboardChordStarterEnabled,
    sleepKeybindEnabled: snapshot.settings.sleepKeybindEnabled,
    speakerVolumeShortcutEnabled: snapshot.settings.speakerVolumeShortcutEnabled,
    pollingRateMode: snapshot.settings.pollingRateMode,
    hostPersonaMode: snapshot.settings.hostPersonaMode,
    duplexMicEnabled: snapshot.settings.duplexMicEnabled,
    audioReactiveHapticsEnabled: snapshot.settings.audioReactiveHapticsEnabled,
    audioReactiveHapticsSource: snapshot.settings.audioReactiveHapticsSource,
    audioReactiveHapticsMode: snapshot.settings.audioReactiveHapticsMode,
    audioReactiveHapticsGainPercent: snapshot.settings.audioReactiveHapticsGainPercent,
    audioReactiveHapticsBassFocus: snapshot.settings.audioReactiveHapticsBassFocus,
    audioReactiveHapticsResponse: snapshot.settings.audioReactiveHapticsResponse,
    audioReactiveHapticsAttack: snapshot.settings.audioReactiveHapticsAttack,
    audioReactiveHapticsRelease: snapshot.settings.audioReactiveHapticsRelease,
    controllerPowerSavingEnabled: snapshot.settings.controllerPowerSavingEnabled
  };
}

export function optionLabel<T extends string | number>(options: Array<[string, T]>, value: T): string {
  return options.find(([, optionValue]) => optionValue === value)?.[0] ?? String(value);
}

export function enabledLabel(enabled: boolean): string {
  return enabled ? 'On' : 'Off';
}

export function percentLabel(value: number): string {
  return `${value}%`;
}

export const VDS_PACKET_MODE_LABELS: Record<string, string> = {
  haptics: 'Haptics only',
  'haptics+speaker': 'Haptics + speaker',
  'haptics+mic': 'Haptics + mic',
  'haptics+speaker+mic': 'Haptics + speaker + mic',
  mic: 'Mic only',
  idle: 'None'
};

export function vdsPacketModeLabel(mode: string, hapticsOnly: boolean, streaming: boolean): string {
  if (mode) {
    return VDS_PACKET_MODE_LABELS[mode] ?? mode;
  }
  // Older vdsd without packet_mode.
  if (!streaming) {
    return 'None';
  }
  return hapticsOnly ? 'Haptics only' : 'Haptics + speaker';
}

export function effectiveMuteButtonMode(mode: MuteButtonMode): MuteButtonMode {
  return VDS_AVAILABLE && mode !== 'chord' ? 'normal' : mode;
}

export function muteButtonSummary(settings: ControllerProfileSettings): string {
  if (effectiveMuteButtonMode(settings.muteButtonMode) === 'normal') {
    return 'Normal';
  }
  if (settings.muteButtonMode === 'quiet') {
    return 'Quiet Toggle';
  }
  const key = optionLabel(MUTE_KEY_OPTIONS, settings.muteKeyboardUsage);
  const modifiers = MUTE_MODIFIER_OPTIONS
    .filter(([, bit]) => (settings.muteKeyboardModifiers & bit) !== 0)
    .map(([label]) => label);
  const chordStarter = settings.muteButtonMode === 'keyboard' && settings.muteKeyboardChordStarterEnabled
    ? ['Chord Starter']
    : [];
  return [...modifiers, key, ...chordStarter].join(' + ');
}

export function batteryLabel(snapshot: BridgeSnapshot | null | undefined): string {
  const battery = snapshot?.status?.batteryPercent;
  return battery === null || battery === undefined ? '--' : `${battery}%`;
}

export function batteryTone(percent: number | null | undefined): 'healthy' | 'warning' | 'low' | 'unknown' {
  if (percent === null || percent === undefined) return 'unknown';
  if (percent <= 20) return 'low';
  if (percent <= 45) return 'warning';
  return 'healthy';
}

export function isChargingPowerState(rawPowerState: number | undefined): boolean {
  return rawPowerState === 0x01 || rawPowerState === 0x02;
}

export function controllerName(type: string | undefined): string {
  if (type === 'dualsense-edge') return 'DualSense Edge';
  if (type === 'dualsense') return 'DualSense';
  return 'Controller';
}

export function healthLabel(snapshot: BridgeSnapshot | null | undefined): string {
  if (!snapshot) return 'Unavailable';
  if (snapshot.state !== 'connected') {
    return /^Firmware .+ update required$/i.test(snapshot.message)
      ? 'Update required: Bridge Settings > Firmware'
      : snapshot.message;
  }
  if (snapshot.diagnostics.lastError) return snapshot.diagnostics.lastError;
  if (!snapshot.status?.controllerConnected) return 'Controller not connected';
  if (snapshot.diagnostics.firmwareUpdateAvailable) {
    return `Firmware ${snapshot.diagnostics.firmwareUpdateAvailable.availableVersion} available`;
  }
  return 'All systems normal';
}

export const HOST_PERSONA_FULL_LABELS: Record<HostPersonaMode, string> = {
  dualsense: 'DualSense',
  ds4: 'DualShock 4',
  xbox: 'Xbox 360'
};
