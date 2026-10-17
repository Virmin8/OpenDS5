import { isGameSettingsProfileId } from '../../shared/game-settings';
import type { TriggerTestMode, TriggerTestTarget } from '../../shared/protocol';
import {
  defaultEffectForMode,
  type EngineStatus,
  type InputConditionType,
  KNOWN_BUTTONS,
  MAX_STATE_NAME_LENGTH,
  type StateSwitchAction,
  type TriggerEffectSpec,
  type TriggerModifier,
  type TriggerProfile,
  type TriggerSlotPair,
  type TriggerStateDef
} from '../../shared/trigger-profiles';
import type { BridgeSnapshot } from '../../shared/types';
import { capControllerPowerSavingValue } from './common';
import type { TriggerProfileSlotKey, TriggerStripChipSelection } from './types';

export const TRIGGER_EFFECT_STEP = 10;
export const TEST_TRIGGER_LOCK_MS = 2800;
export const TRIGGER_EFFECT_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 70],
  ['High', 100]
];
// The daemon's short-test/preview commands (0x0D / 0x1F) only understand the
// three classic V1 arms; the richer modes preview through profile drafts.
export const TRIGGER_LAB_TESTABLE_MODES: TriggerTestMode[] = ['feedback', 'weapon', 'vibration'];
export const TRIGGER_TEST_MODE_OPTIONS: Array<[string, TriggerTestMode]> = [
  ['Resistance', 'feedback'],
  ['Weapon', 'weapon'],
  ['Vibration', 'vibration']
];
export const TRIGGER_TEST_TARGET_OPTIONS: Array<[string, TriggerTestTarget]> = [
  ['L2', 'l2'],
  ['Both', 'both'],
  ['R2', 'r2']
];
// vdsd plays a preview for 2.5 s; keep the button busy a little longer.
export const TRIGGER_PREVIEW_MS = 2600;
export const TRIGGER_PROFILE_SLOTS: Array<[TriggerProfileSlotKey, string]> = [
  ['l2', 'L2'],
  ['r2', 'R2']
];
export const TRIGGER_PROFILE_CONDITION_OPTIONS: Array<[string, InputConditionType]> = [
  ['Trigger Held Over', 'trigger-held-over'],
  ['Trigger Full Pull', 'trigger-full-pull'],
  ['Button Held', 'button-held'],
  ['Rapid Fire', 'rapid-fire']
];
export const STATE_SWITCH_BUTTON_LABELS: Record<string, string> = {
  cross: 'Cross', circle: 'Circle', triangle: 'Triangle', square: 'Square',
  l1: 'L1', r1: 'R1', l3: 'L3', r3: 'R3',
  create: 'Create', options: 'Options', ps: 'PS',
  'dpad-up': 'D-Pad Up', 'dpad-down': 'D-Pad Down',
  'dpad-left': 'D-Pad Left', 'dpad-right': 'D-Pad Right'
};
export const STATE_SWITCH_BUTTON_OPTIONS: Array<[string, string]> = KNOWN_BUTTONS.map(
  (button) => [STATE_SWITCH_BUTTON_LABELS[button] ?? button, button]
);
export const STATE_SWITCH_MENU_OPTIONS: Array<[string, string]> = [
  ['No menu guard', ''],
  ...STATE_SWITCH_BUTTON_OPTIONS
];
export const STATE_SWITCH_ACTION_OPTIONS: Array<[string, StateSwitchAction]> = [
  ['cycle to next state', 'cycle'],
  ['switch to…', 'select']
];
// Compact glyphs for the rule capture chips, matching the DualSense faces.
export const STATE_SWITCH_BUTTON_GLYPHS: Record<string, string> = {
  cross: '✕', circle: '○', triangle: '△', square: '□',
  l1: 'L1', r1: 'R1', l3: 'L3', r3: 'R3',
  create: 'CR', options: 'OP', ps: 'PS',
  'dpad-up': '↑', 'dpad-down': '↓', 'dpad-left': '←', 'dpad-right': '→'
};

export function snapTriggerEffectIntensity(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value / TRIGGER_EFFECT_STEP) * TRIGGER_EFFECT_STEP));
}

export function parseProcessNamesInput(input: string): string[] {
  return input
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function mergeDetectedProcessName(processNamesInput: string, candidateName: string): string {
  const existing = parseProcessNamesInput(processNamesInput);
  const name = candidateName.trim().toLowerCase();
  if (!name || existing.includes(name)) {
    return existing.join(', ');
  }
  return [...existing, name].join(', ');
}

export function formatEngineStatusLine(status: EngineStatus, activeProfileName: string): string {
  const name = status.activeStateName
    ? `${activeProfileName} — ${status.activeStateName}`
    : activeProfileName;
  if (status.suspended) return `Active: ${name} (suspended)`;
  if (status.matchedBy === 'pin') return `Active: ${name} (pinned)`;
  if (status.matchedBy === 'process') return `Active: ${name} (matched: ${status.matchedName})`;
  return `Active: ${name} (default)`;
}

export function triggerProfileHasEffects(profile: TriggerProfile): boolean {
  return (['l2', 'r2'] as const).some((slot) => (
    profile.triggers[slot].base !== null || profile.triggers[slot].modifiers.length > 0
  ));
}

export function emptyTriggerSlotPair(): TriggerSlotPair {
  return {
    l2: { base: null, modifiers: [] },
    r2: { base: null, modifiers: [] }
  };
}

/** The slot pair the editor is currently working on: the selected state's, or the profile's own. */
export function editingStateTriggers(profile: TriggerProfile, stateIndex: number): TriggerSlotPair {
  if (profile.states && profile.states.length > 0) {
    return profile.states[Math.min(stateIndex, profile.states.length - 1)].triggers;
  }
  return profile.triggers;
}

export function uniqueStateName(base: string, taken: readonly string[]): string {
  const names = new Set(taken);
  if (!names.has(base)) return base;
  let suffix = 2;
  while (names.has(`${base} ${suffix}`)) suffix += 1;
  return `${base} ${suffix}`;
}

/**
 * Normalizes a drafted multi-state profile for save: state names are trimmed,
 * empty names become "State N", duplicates get a numeric suffix, switching
 * rules and defaultState are re-pointed at the normalized names, and the
 * profile-level triggers mirror states[0] so pre-states consumers keep seeing
 * the profile's default feel.
 */
export function sanitizeDraftStates(profile: TriggerProfile): TriggerProfile {
  if (!profile.states || profile.states.length === 0) {
    const { states: _states, switching: _switching, ...rest } = profile;
    return rest;
  }
  const renames = new Map<string, string>();
  const names: string[] = [];
  const states: TriggerStateDef[] = profile.states.map((state, index) => {
    const trimmed = state.name.trim().slice(0, MAX_STATE_NAME_LENGTH);
    const fallback = trimmed.length > 0 ? trimmed : `State ${index + 1}`;
    const name = uniqueStateName(fallback, names);
    names.push(name);
    if (state.name !== name) renames.set(state.name, name);
    return { ...state, name };
  });
  let switching = profile.switching;
  if (switching) {
    const stateNames = new Set(names);
    const rules = switching.rules
      .map((rule) => {
        if (rule.action !== 'select') return rule;
        const target = renames.get(rule.state ?? '') ?? rule.state;
        return { ...rule, state: target };
      })
      .filter((rule) => rule.action !== 'select' || (rule.state !== undefined && stateNames.has(rule.state)));
    const defaultState = renames.get(switching.defaultState ?? '') ?? switching.defaultState;
    switching = {
      ...switching,
      rules,
      ...(defaultState !== undefined && stateNames.has(defaultState)
        ? { defaultState }
        : {})
    };
    if (defaultState !== undefined && !stateNames.has(defaultState)) {
      delete switching.defaultState;
    }
  }
  return { ...profile, states, ...(switching ? { switching } : {}), triggers: states[0].triggers };
}

/**
 * Profile dropdown options with game-owned entries hidden: game settings profiles are
 * managed from the Game Profile tab, not the generic pickers. The one exception is the
 * currently selected profile — hiding it would leave the select displaying nothing while
 * a game's settings are active — which stays visible with a "— Game" suffix.
 */
export function visibleProfileOptions(
  profiles: ReadonlyArray<{ id: string; name: string }>,
  selectedId: string
): Array<[string, string]> {
  const options: Array<[string, string]> = [];
  for (const profile of profiles) {
    if (isGameSettingsProfileId(profile.id)) {
      if (profile.id !== selectedId) continue;
      options.push([`${profile.name} — Game`, profile.id]);
    } else {
      options.push([profile.name, profile.id]);
    }
  }
  return options;
}

export function defaultTriggerEffectSpec(): TriggerEffectSpec {
  return defaultEffectForMode('feedback');
}

export function defaultTriggerModifier(): TriggerModifier {
  return {
    when: { source: 'input', condition: 'trigger-held-over', threshold: 50, ms: 200 },
    effect: defaultTriggerEffectSpec()
  };
}

export const PROVISIONAL_TRIGGER_PROFILE_ID_PREFIX = 'draft-';

export function makeProvisionalTriggerProfileId(): string {
  return `${PROVISIONAL_TRIGGER_PROFILE_ID_PREFIX}${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`;
}

export function isProvisionalTriggerProfileId(id: string): boolean {
  return id.startsWith(PROVISIONAL_TRIGGER_PROFILE_ID_PREFIX);
}

export function mergeTriggerProfiles(
  localProfiles: readonly TriggerProfile[],
  backendProfiles: readonly TriggerProfile[],
  excludeIds: readonly string[] = []
): TriggerProfile[] {
  const backendIds = new Set(backendProfiles.map((profile) => profile.id));
  const excluded = new Set(excludeIds);
  const unsavedDrafts = localProfiles.filter(
    (profile) => !backendIds.has(profile.id) && !excluded.has(profile.id)
  );
  return [...backendProfiles, ...unsavedDrafts];
}

export function mirrorTriggerSlotBase(
  triggers: TriggerProfile['triggers'],
  sourceSlot: TriggerProfileSlotKey
): TriggerProfile['triggers'] {
  const otherSlot: TriggerProfileSlotKey = sourceSlot === 'l2' ? 'r2' : 'l2';
  const sourceBase = triggers[sourceSlot].base;
  return {
    ...triggers,
    [otherSlot]: {
      ...triggers[otherSlot],
      base: sourceBase ? { ...sourceBase } : null
    }
  };
}

export function filterTriggerProfiles(
  profiles: readonly TriggerProfile[],
  query: string
): TriggerProfile[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...profiles];
  return profiles.filter((profile) => (
    profile.name.toLowerCase().includes(needle)
    || profile.match.processNames.some((name) => name.toLowerCase().includes(needle))
  ));
}

/**
 * Decide which trigger profiles are shown as inline chips versus moved into the
 * overflow dropdown. The Default profile is always the first chip. The next
 * chips are the currently selected non-default profile (if any), then the
 * remaining non-default profiles by most-recently-updated (updatedAtMs), up to
 * maxChips total. Everything else becomes overflow, preserving the incoming
 * order. With maxChips 0 every profile (including Default) collapses into the
 * dropdown so the strip fits arbitrarily narrow windows.
 */
export function pickTriggerStripChips(
  profiles: readonly TriggerProfile[],
  selectedId: string | null,
  maxChips = 2
): TriggerStripChipSelection {
  const defaultProfile = profiles.find((profile) => profile.id === 'default') ?? null;
  const ranked = profiles
    .filter((profile) => profile.id !== 'default')
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  if (selectedId && selectedId !== 'default') {
    const index = ranked.findIndex((profile) => profile.id === selectedId);
    if (index > 0) {
      const [selected] = ranked.splice(index, 1);
      ranked.unshift(selected);
    }
  }

  const chipIds = new Set<string>();
  const chips: TriggerProfile[] = [];
  if (maxChips > 0 && defaultProfile) {
    chips.push(defaultProfile);
    chipIds.add(defaultProfile.id);
  }
  for (const profile of ranked) {
    if (chips.length >= maxChips) break;
    chips.push(profile);
    chipIds.add(profile.id);
  }

  const overflow = profiles.filter((profile) => !chipIds.has(profile.id));
  return { chips, overflow };
}

/**
 * Chips that fit in the space left over after the strip's action buttons
 * (measured live, passed in as availableWidth = strip minus actions). Reserves
 * room for the overflow dropdown + gaps (~150px), then budgets ~120px per chip.
 */
export function triggerStripMaxChips(availableWidth: number): number {
  const reserved = 150;
  const perChip = 120;
  return Math.max(0, Math.floor((availableWidth - reserved) / perChip));
}

export function displayTriggerEffectIntensityValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.triggerEffectIntensityPercent, snapshot);
}
