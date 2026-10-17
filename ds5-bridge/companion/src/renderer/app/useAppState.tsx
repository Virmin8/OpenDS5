import {
  IconHeadphones as Headphones,
  IconMinus as Minus,
  IconPlus as Plus,
  IconVolume as Volume2
} from '@tabler/icons-react';
import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { GameArtworkSearchResult } from '../../main/game-artwork';
import type { GameSettingsStatus } from '../../main/game-settings-coordinator';
import type { GameProcessCandidate } from '../../main/game-watcher';
import type { LibraryCatalog, LibraryEntry } from '../../main/profile-library';
import type { UpdateState } from '../../main/update-service';
import type { InstalledGamesList } from '../../preload';
import { gameSettingsProfileId, isGameSettingsProfileId } from '../../shared/game-settings';
import {
  ackResultName,
  type AudioReactiveHapticsAttack,
  type AudioReactiveHapticsBassFocus,
  type AudioReactiveHapticsConfig,
  type AudioReactiveHapticsMode,
  type AudioReactiveHapticsRelease,
  type AudioReactiveHapticsResponse,
  CHORD_CONTROLLER_SETTING_STEP_MAX,
  CHORD_CONTROLLER_SETTING_STEP_MIN,
  CHORD_MUTE_STARTER_ID,
  type ChordAssignableButtonId,
  type ChordAssignment,
  type ChordControllerSettingAction,
  type ChordFunction,
  type ChordStarterId,
  DEFAULT_BUTTON_REMAP_PROFILE_ID,
  DEFAULT_CONTROLLER_PROFILE_ID,
  type HostPersonaMode,
  isChordBindingAllowed,
  MAX_CHORD_ASSIGNMENTS,
  MAX_CHORD_FUNCTION_NAME_LENGTH,
  MAX_KEYBOARD_FUNCTION_KEYS,
  type MuteButtonMode,
  type MuteKeyboardBehavior,
  normalizeChordControllerSettingStepPercent,
  type PollingRateMode,
  type RemapButtonId,
  type TriggerTestMode,
  type TriggerTestTarget
} from '../../shared/protocol';
import {
  createDefaultProfile,
  DEFAULT_PROFILE_ID,
  type EngineStatus,
  MAX_STATES_PER_PROFILE,
  type StateSwitching,
  type StateSwitchRule,
  type StickWheelConfig,
  type TriggerProfile,
  type TriggerStateDef,
  uniqueTriggerProfileId
} from '../../shared/trigger-profiles';
import type { AudioHapticsSession, BridgeSnapshot, UiThemePreset } from '../../shared/types';
import type { VdsAudioStats, VdsDaemonLog, VdsStatus, VdsTraceScope } from '../../shared/vds';
import { matchGameInLibrary, nativeGameFeatureMap, nativeGameFeatures } from '../game-library-match';
import { filterLibrary } from '../library-search';
import type { StickSample } from '../StickWheelEditor';
import { usePageVisible } from '../usePageVisible';
import {
  audioHapticsSessionKey,
  audioHapticsSourceDisplayName,
  audioHapticsSourceFromSession,
  audioHapticsSourceKey,
  BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE,
  BRIDGE_MIC_ENDPOINT_UNAVAILABLE,
  clampAudioBufferLength,
  delay,
  displayClassicRumbleValue,
  displayHapticsValue,
  feedbackSliderMaxFromSnapshot,
  feedbackSliderTicks,
  findBridgeAudioOutputId,
  playMicLiveListen,
  snapHapticsValue,
  snapMicVolume,
  snapSpeakerVolume,
  stopMicLiveListen,
  TEST_HAPTICS_LOCK_MS,
  TEST_MIC_LISTEN_MS,
  TEST_SPEAKER_ENDPOINT_REFRESH_MS,
  TEST_SPEAKER_LOCK_MS,
  TEST_SPEAKER_VOLUME_SETTLE_MS
} from './audio';
import {
  CHORD_BUTTON_MENU_IDS,
  CHORD_KEYBOARD_MODIFIER_OPTIONS,
  CHORD_STARTER_OPTIONS,
  CHORD_STARTERS,
  CHORD_UNASSIGNED_BUTTON,
  chordAssignmentKey,
  chordBindingKey,
  chordButtonLabel,
  chordControllerSettingAdjustmentText,
  chordFunctionFromDraft,
  chordFunctionSummary,
  chordFunctionToDraft,
  chordFunctionTypeLabel,
  chordNotchTargetForAction,
  createChordAssignmentId,
  EMPTY_CHORD_FUNCTION_DRAFT
} from './chords';
import {
  batteryLabel,
  batteryTone,
  capControllerPowerSavingValue,
  CONTROLLER_POWER_SAVING_CAP_PERCENT,
  controllerName,
  controllerPowerSavingActiveFromSnapshot,
  healthLabel,
  HOST_PERSONA_OPTIONS,
  isChargingPowerState,
  POLLING_RATE_OPTIONS,
  saveUiThemePreset,
  SIGNAL_BAR_COUNTS,
  SLEEP_CONFIRM_MS,
  STARTUP_READY_HOLD_MS,
  storedStartupTutorialStep,
  storedUiThemePreset,
  VDS_AVAILABLE,
  VDS_LINUX
} from './common';
import { GAME_PROFILE_LINK_NONE, gameProfileTitle } from './games';
import {
  displayLightbarBrightnessValue,
  hexByte,
  isLightbarPresetColor,
  LIGHTBAR_COLOR_NAMES,
  LIGHTBAR_DEFAULT_CUSTOM_COLOR,
  LIGHTBAR_SWATCHES,
  lightbarColorFromSnapshot,
  normalizeHexColor,
  normalizeLightbarPresetColor,
  snapLightbarBrightness
} from './lighting';
import {
  DEFAULT_REMAP_DRAFT,
  LAST_REMAP_CONTROLLER_TYPE_STORAGE_KEY,
  REMAP_ALL_BUTTON_IDS,
  REMAP_EDGE_BUTTON_IDS,
  REMAP_EDGE_CONTROL_POINTS,
  REMAP_EDGE_LAYOUT_ASSET,
  REMAP_EDGE_LINE_POINTS,
  REMAP_LEFT_BUTTON_IDS,
  REMAP_RIGHT_BUTTON_IDS,
  REMAP_STANDARD_BUTTON_IDS,
  REMAP_STANDARD_LAYOUT_ASSET,
  REMAP_STANDARD_TARGET_BUTTON_IDS,
  storedRemapControllerType
} from './remap';
import {
  displayTriggerEffectIntensityValue,
  editingStateTriggers,
  emptyTriggerSlotPair,
  isProvisionalTriggerProfileId,
  makeProvisionalTriggerProfileId,
  mergeDetectedProcessName,
  mergeTriggerProfiles,
  mirrorTriggerSlotBase,
  parseProcessNamesInput,
  sanitizeDraftStates,
  snapTriggerEffectIntensity,
  TRIGGER_PREVIEW_MS,
  triggerProfileHasEffects,
  uniqueStateName,
  visibleProfileOptions
} from './triggers';
import type {
  ChordAssignmentDraftRow,
  ChordAssignmentDragSession,
  ChordAssignmentDropHint,
  ChordAssignmentScrollbarState,
  ChordButtonSelectValue,
  ChordFunctionDialogMode,
  ChordFunctionDialogState,
  ChordFunctionDraft,
  ChordKeyboardModifier,
  ControllerProfileDialogMode,
  ControlTab,
  DualSenseEdgeRemapButtonId,
  EdgeRemapControlLayout,
  KnownControllerType,
  NotificationFocusTarget,
  RemapCalloutLayout,
  RemapProfileDialogMode,
  SettingsFocusTarget,
  StandardRemapButtonId,
  StartupTutorialStep,
  TriggerProfileDeleteConfirmState,
  TriggerProfileSlotKey
} from './types';

/**
 * The main window's state and handlers. App renders the window chrome and
 * hands this to each tab page (tabs/), which picks out what it uses.
 */
export function useAppState() {
  const [snapshot, setSnapshot] = useState<BridgeSnapshot | null>(null);
  const [startupVisible, setStartupVisible] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<ControlTab>('game-profile');
  const [hapticsValue, setHapticsValue] = useState(100);
  const [classicRumbleValue, setClassicRumbleValue] = useState(100);
  const [speakerVolumeValue, setSpeakerVolumeValue] = useState(100);
  const [micVolumeValue, setMicVolumeValue] = useState(100);
  const [audioBufferLengthValue, setAudioBufferLengthValue] = useState(64);
  const [lightbarColor, setLightbarColor] = useState('#ffff00');
  const [customLightbarColor, setCustomLightbarColor] = useState<string | null>(() => {
    const saved = window.localStorage.getItem('ds5bridge.customLightbarColor');
    if (!saved || !/^#[0-9a-fA-F]{6}$/.test(saved)) return null;
    const color = normalizeLightbarPresetColor(saved);
    return LIGHTBAR_SWATCHES.includes(color) ? null : color;
  });
  const [customColorDraft, setCustomColorDraft] = useState(LIGHTBAR_DEFAULT_CUSTOM_COLOR);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customSwatchPrimed, setCustomSwatchPrimed] = useState(false);
  const [lightbarBrightnessValue, setLightbarBrightnessValue] = useState(100);
  const [triggerEffectIntensityValue, setTriggerEffectIntensityValue] = useState(100);
  const [audioHapticsOpen, setAudioHapticsOpen] = useState(false);
  const [audioHapticsSessions, setAudioHapticsSessions] = useState<AudioHapticsSession[]>([]);
  const [audioHapticsSessionsLoading, setAudioHapticsSessionsLoading] = useState(false);
  const [triggerProfiles, setTriggerProfiles] = useState<TriggerProfile[]>([]);
  const [triggerProfilesEnabled, setTriggerProfilesEnabled] = useState(false);
  const [triggerProfileEngineStatus, setTriggerProfileEngineStatus] = useState<EngineStatus | null>(null);
  const [gameSettingsStatus, setGameSettingsStatus] = useState<GameSettingsStatus | null>(null);
  const [gameArtwork, setGameArtwork] = useState<Record<string, string>>({});
  const [openGameProfileId, setOpenGameProfileId] = useState<string | null>(null);
  const [gameCreateOpen, setGameCreateOpen] = useState(false);
  const [gameCreateName, setGameCreateName] = useState('');
  const [gameCreateLinkedProfileId, setGameCreateLinkedProfileId] = useState(GAME_PROFILE_LINK_NONE);
  const [gameLibraryFilter, setGameLibraryFilter] = useState('');
  const [gameCreateProcessesInput, setGameCreateProcessesInput] = useState('');
  const [gameCreateBusy, setGameCreateBusy] = useState(false);
  const [gameCreateCandidates, setGameCreateCandidates] = useState<GameProcessCandidate[] | null>(null);
  const [gameCreateDetectLoading, setGameCreateDetectLoading] = useState(false);
  const [installedGames, setInstalledGames] = useState<InstalledGamesList | null>(null);
  const [installedGamesLoading, setInstalledGamesLoading] = useState(false);
  const [selectedInstalledGame, setSelectedInstalledGame] = useState<InstalledGamesList['games'][number] | null>(null);
  const [installedCandidateTicks, setInstalledCandidateTicks] = useState<Record<string, boolean>>({});
  const [gameArtworkDialogFor, setGameArtworkDialogFor] = useState<string | null>(null);
  const [gameArtworkQuery, setGameArtworkQuery] = useState('');
  const [gameArtworkResults, setGameArtworkResults] = useState<GameArtworkSearchResult[] | null>(null);
  const [gameArtworkBusy, setGameArtworkBusy] = useState(false);
  const [gameArtworkError, setGameArtworkError] = useState<string | null>(null);
  const [steamGridDbKeyDraft, setSteamGridDbKeyDraft] = useState<string | null>(null);
  const [gameDeleteConfirm, setGameDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedTriggerProfileId, setSelectedTriggerProfileId] = useState<string | null>(null);
  const [triggerProfileDraft, setTriggerProfileDraft] = useState<TriggerProfile | null>(null);
  const [stickSample, setStickSample] = useState<StickSample | null>(null);
  const stickWheelActive = triggerProfileDraft?.switching?.stickWheel !== undefined;
  // Which switch rule is listening for a controller press: a rule index, 'new'
  // for the Add-rule flow, or null when idle.
  const [ruleCapture, setRuleCapture] = useState<number | 'new' | null>(null);
  const ruleCaptureRef = useRef<number | 'new' | null>(null);
  ruleCaptureRef.current = ruleCapture;
  const prevSampleButtonsRef = useRef<string[]>([]);
  // Live input for the wheel configurator and rule capture; only subscribed
  // while needed so the 30Hz sample stream doesn't re-render the app the rest
  // of the time.
  useEffect(() => {
    if (!stickWheelActive && ruleCapture === null) {
      setStickSample(null);
      prevSampleButtonsRef.current = [];
      return;
    }
    return window.bridge.onStickSample((sample) => {
      setStickSample(sample);
      const capture = ruleCaptureRef.current;
      const previous = prevSampleButtonsRef.current;
      prevSampleButtonsRef.current = sample.buttons;
      if (capture === null) return;
      const pressed = sample.buttons.find((button) => !previous.includes(button));
      if (!pressed) return;
      const chord = sample.buttons.find((button) => button !== pressed) ?? null;
      setRuleCapture(null);
      updateTriggerProfileSwitching((switching) => {
        const rule: StateSwitchRule = {
          button: pressed,
          action: 'cycle',
          ...(chord ? { while: chord } : {})
        };
        if (capture === 'new') {
          return { ...switching, rules: [...switching.rules, rule] };
        }
        return {
          ...switching,
          rules: switching.rules.map((existing, at) => {
            if (at !== capture) return existing;
            const next: StateSwitchRule = { ...existing, button: pressed };
            if (chord) next.while = chord;
            else delete next.while;
            return next;
          })
        };
      });
    });
  }, [stickWheelActive, ruleCapture !== null]);
  const [triggerProfileEditingState, setTriggerProfileEditingState] = useState(0);
  const [triggerProfileProcessNamesInput, setTriggerProfileProcessNamesInput] = useState('');
  const [triggerProfileDeleteConfirm, setTriggerProfileDeleteConfirm] = useState<TriggerProfileDeleteConfirmState | null>(null);
  const [triggerProfileResetConfirm, setTriggerProfileResetConfirm] = useState<TriggerProfileDeleteConfirmState | null>(null);
  const [triggerProfileResetting, setTriggerProfileResetting] = useState(false);
  const [triggerProfilesLinked, setTriggerProfilesLinked] = useState(false);
  const [triggerProfileModifiersOpen, setTriggerProfileModifiersOpen] = useState<Record<TriggerProfileSlotKey, boolean>>({ l2: false, r2: false });
  const [triggerProfileTransferStatus, setTriggerProfileTransferStatus] = useState<{
    tone: string;
    message: string;
    failures?: Array<{ file: string; error: string }>;
  } | null>(null);
  const triggerProfileTransferStatusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerStripRef = useRef<HTMLDivElement | null>(null);
  const triggerStripActionsRef = useRef<HTMLDivElement | null>(null);
  const [triggerStripWidth, setTriggerStripWidth] = useState(0);
  const [triggerStripActionsWidth, setTriggerStripActionsWidth] = useState(0);
  const lastAutoMatchedProfileRef = useRef<string | null>(null);
  const [triggerProfileLibraryOpen, setTriggerProfileLibraryOpen] = useState(false);
  const [triggerProfileLibraryCatalog, setTriggerProfileLibraryCatalog] = useState<LibraryCatalog | null>(null);
  const [triggerProfileLibraryLoading, setTriggerProfileLibraryLoading] = useState(false);
  const [triggerProfileLibraryInstalling, setTriggerProfileLibraryInstalling] = useState<string | null>(null);
  const [triggerProfileLibraryInstallErrors, setTriggerProfileLibraryInstallErrors] = useState<Record<string, string>>({});
  const [triggerProfileLibraryQuery, setTriggerProfileLibraryQuery] = useState('');
  const [gameDetectPopoverOpen, setGameDetectPopoverOpen] = useState(false);
  const [gameDetectCandidates, setGameDetectCandidates] = useState<GameProcessCandidate[]>([]);
  const [gameDetectLoading, setGameDetectLoading] = useState(false);
  const gameDetectPopoverRef = useRef<HTMLDivElement>(null);
  // Manual process-match editor for a game profile, opened from the game detail view.
  const [gameProcessEditor, setGameProcessEditor] = useState<{ id: string; name: string } | null>(null);
  const [gameProcessEditorInput, setGameProcessEditorInput] = useState('');
  const [gameProcessEditorSaving, setGameProcessEditorSaving] = useState(false);
  const [gameProcessDetectOpen, setGameProcessDetectOpen] = useState(false);
  const gameProcessDetectRef = useRef<HTMLDivElement>(null);
  const triggerProfilePreviewArmedRef = useRef(false);
  const [remapDraft, setRemapDraft] = useState<Record<RemapButtonId, RemapButtonId>>(DEFAULT_REMAP_DRAFT);
  const [remapProfileDialogMode, setRemapProfileDialogMode] = useState<RemapProfileDialogMode | null>(null);
  const [remapProfileNameDraft, setRemapProfileNameDraft] = useState('');
  const [selectedChordFunctionId, setSelectedChordFunctionId] = useState('');
  const [chordFunctionDraft, setChordFunctionDraft] = useState<ChordFunctionDraft>(EMPTY_CHORD_FUNCTION_DRAFT);
  const [chordFunctionDialog, setChordFunctionDialog] = useState<ChordFunctionDialogState | null>(null);
  const [chordFunctionNameDraft, setChordFunctionNameDraft] = useState('');
  const [chordAssignmentDraftRows, setChordAssignmentDraftRows] = useState<ChordAssignmentDraftRow[]>([]);
  const [draggedChordAssignmentId, setDraggedChordAssignmentId] = useState<string | null>(null);
  const [chordAssignmentDropHint, setChordAssignmentDropHint] = useState<ChordAssignmentDropHint | null>(null);
  const [chordAssignmentScrollbar, setChordAssignmentScrollbar] = useState<ChordAssignmentScrollbarState>({
    visible: false,
    top: 0,
    height: 0
  });
  const [controllerProfileDialogMode, setControllerProfileDialogMode] = useState<ControllerProfileDialogMode | null>(null);
  const [controllerProfileNameDraft, setControllerProfileNameDraft] = useState('');
  const [remapCalloutLayout, setRemapCalloutLayout] = useState<Record<StandardRemapButtonId, RemapCalloutLayout> | null>(null);
  const [edgeRemapControlLayout, setEdgeRemapControlLayout] = useState<Record<DualSenseEdgeRemapButtonId, EdgeRemapControlLayout> | null>(null);
  const [hoveredRemapButton, setHoveredRemapButton] = useState<RemapButtonId | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showBridgeSettings, setShowBridgeSettings] = useState(false);
  const [uninstallDialog, setUninstallDialog] = useState<{
    phase: 'confirm' | 'running' | 'done';
    purge: boolean;
    steps: string[];
    statuses: Record<number, 'start' | 'ok' | 'fail'>;
    exit: number | null;
  } | null>(null);
  const [settingsFocusTarget, setSettingsFocusTarget] = useState<SettingsFocusTarget | null>(null);
  const [notificationFocusTarget, setNotificationFocusTarget] = useState<NotificationFocusTarget | null>(null);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showClassicRumbleControl, setShowClassicRumbleControl] = useState(false);
  const [showMicrophoneControl, setShowMicrophoneControl] = useState(false);
  const [lastRemapControllerType, setLastRemapControllerType] = useState<KnownControllerType>(storedRemapControllerType);
  const [windowDragging, setWindowDragging] = useState(false);
  const [testLocked, setTestLocked] = useState(false);
  const [triggerTest, setTriggerTest] = useState<{
    mode: TriggerTestMode;
    target: TriggerTestTarget;
    start: number;
    end: number;
    strength: number;
  }>({ mode: 'feedback', target: 'both', start: 20, end: 70, strength: 80 });
  const [triggerTestRunning, setTriggerTestRunning] = useState(false);
  const triggerTestTimerRef = useRef<number | null>(null);
  const [startupTheme, setStartupTheme] = useState<UiThemePreset>(storedUiThemePreset);
  const [speakerTestLocked, setSpeakerTestLocked] = useState(false);
  const [speakerOutputAvailable, setSpeakerOutputAvailable] = useState<boolean | null>(null);
  const [speakerTestError, setSpeakerTestError] = useState<string | null>(null);
  const [micTestLocked, setMicTestLocked] = useState(false);
  const [micTestError, setMicTestError] = useState<string | null>(null);
  const [hapticsCommitPending, setHapticsCommitPending] = useState(false);
  const [classicRumbleCommitPending, setClassicRumbleCommitPending] = useState(false);
  const [classicRumbleV1CommitPending, setClassicRumbleV1CommitPending] = useState(false);
  const [feedbackBoostCommitPending, setFeedbackBoostCommitPending] = useState(false);
  const [speakerVolumeCommitPending, setSpeakerVolumeCommitPending] = useState(false);
  const [micVolumeCommitPending, setMicVolumeCommitPending] = useState(false);
  const [audioBufferLengthCommitPending, setAudioBufferLengthCommitPending] = useState(false);
  const [audioReactiveHapticsCommitPending, setAudioReactiveHapticsCommitPending] = useState(false);
  const [lightbarCommitPending, setLightbarCommitPending] = useState(false);
  const [overviewSleepConfirmVisible, setOverviewSleepConfirmVisible] = useState(false);
  const [deviceCleanupConfirmVisible, setDeviceCleanupConfirmVisible] = useState(false);
  const [startupTutorialStep, setStartupTutorialStep] = useState<StartupTutorialStep>(storedStartupTutorialStep);
  const [startupTutorialFeatureActive, setStartupTutorialFeatureActive] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>({ phase: 'idle' });
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [settingsPath, setSettingsPath] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [manualUpdateCheck, setManualUpdateCheck] = useState<'idle' | 'checking' | 'current' | 'failed' | 'found'>('idle');
  const navHistoryRef = useRef<Array<{ tab: ControlTab; gameId: string | null }>>([
    { tab: 'game-profile', gameId: null }
  ]);
  const navIndexRef = useRef(0);
  const navApplyingRef = useRef(false);
  const applyNavStateRef = useRef<(state: { tab: ControlTab; gameId: string | null }) => void>(() => undefined);

  useEffect(() => {
    const onMouseUp = (event: MouseEvent) => {
      // 3 = browser-back thumb button, 4 = browser-forward.
      if (event.button !== 3 && event.button !== 4) return;
      event.preventDefault();
      const nextIndex = navIndexRef.current + (event.button === 3 ? -1 : 1);
      const history = navHistoryRef.current;
      if (nextIndex < 0 || nextIndex >= history.length) return;
      navIndexRef.current = nextIndex;
      applyNavStateRef.current(history[nextIndex]);
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);
  const [deviceCleanupMessage, setDeviceCleanupMessage] = useState<string | null>(null);
  const [deviceCleanupError, setDeviceCleanupError] = useState<string | null>(null);

  const startupTutorialOpen = startupTutorialStep !== 'done';
  // Every dialog that renders a .modal-backdrop. The update toast is suppressed while
  // any of them is up, so it can never sit on top of a dialog or first-run setup.
  const anyModalOpen = (
    deviceCleanupConfirmVisible
    || chordFunctionDialog !== null
    || triggerProfileDeleteConfirm !== null
    || triggerProfileResetConfirm !== null
    || remapProfileDialogMode !== null
    || controllerProfileDialogMode !== null
    || triggerProfileLibraryOpen
    || showBridgeSettings
    || gameCreateOpen
    || gameArtworkDialogFor !== null
    || gameDeleteConfirm !== null
  );

  useEffect(() => window.update.onState(setUpdateState), []);

  useEffect(() => {
    void window.appInfo.version().then(setAppVersion);
    void window.appInfo.settingsPath().then(setSettingsPath);
  }, []);

  const checkForUpdatesNow = () => {
    if (manualUpdateCheck === 'checking') return;
    setManualUpdateCheck('checking');
    void window.update.checkNow()
      .then(({ state, failed }) => {
        // Set the state here too: a toast dismissed earlier gets no new push.
        setUpdateState(state);
        setManualUpdateCheck(state.phase !== 'idle' ? 'found' : failed ? 'failed' : 'current');
      })
      .catch(() => setManualUpdateCheck('failed'));
  };

  useEffect(() => {
    if (startupTutorialOpen) return;
    // Let the window's opening animation settle before anything appears.
    const timer = setTimeout(() => {
      void window.update.check().then(setUpdateState);
    }, 1000);
    return () => clearTimeout(timer);
  }, [startupTutorialOpen]);
  const hapticsEditingRef = useRef(false);
  const classicRumbleEditingRef = useRef(false);
  const speakerVolumeEditingRef = useRef(false);
  const micVolumeEditingRef = useRef(false);
  const audioBufferLengthEditingRef = useRef(false);
  const lightbarBrightnessEditingRef = useRef(false);
  const triggerEffectEditingRef = useRef(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const remappingLayoutRef = useRef<HTMLDivElement>(null);
  const remappingLeftSideRef = useRef<HTMLDivElement>(null);
  const remappingRightSideRef = useRef<HTMLDivElement>(null);
  const remappingArtRef = useRef<HTMLImageElement>(null);
  const customColorPickerRef = useRef<HTMLDivElement>(null);
  const customSwatchPrimeTimerRef = useRef<number | null>(null);
  const overviewSleepConfirmTimerRef = useRef<number | null>(null);
  const settingsFocusTimerRef = useRef<number | null>(null);
  const notificationFocusTimerRef = useRef<number | null>(null);
  const chordAssignmentDragRef = useRef<ChordAssignmentDragSession | null>(null);
  const chordAssignmentListRef = useRef<HTMLDivElement>(null);
  const windowDraggingRef = useRef(false);
  const windowDragReleaseTimerRef = useRef<number | null>(null);
  const startupReadyTimerRef = useRef<number | null>(null);
  const startupReadyArmedRef = useRef(false);
  const deferredSnapshotRef = useRef<BridgeSnapshot | null>(null);
  const overviewSleepConfirmArmedRef = useRef(false);
  useEffect(() => () => {
    const session = chordAssignmentDragRef.current;
    session?.cleanup();
    session?.overlay?.remove();
    document.body.classList.remove('chords-assignment-pointer-dragging');
    chordAssignmentDragRef.current = null;
  }, []);

  useEffect(() => {
    const liveTheme = snapshot?.settings.uiThemePreset;
    if (!liveTheme) return;
    setStartupTheme(liveTheme);
    saveUiThemePreset(liveTheme);
  }, [snapshot?.settings.uiThemePreset]);

  useEffect(() => {
    const hasSnapshot = Boolean(snapshot);
    if (!hasSnapshot || !startupVisible || startupReadyArmedRef.current) return undefined;
    startupReadyArmedRef.current = true;
    startupReadyTimerRef.current = window.setTimeout(() => {
      setStartupVisible(false);
      startupReadyTimerRef.current = null;
    }, STARTUP_READY_HOLD_MS);
    return () => {
      if (startupReadyTimerRef.current !== null) {
        window.clearTimeout(startupReadyTimerRef.current);
        startupReadyTimerRef.current = null;
      }
    };
  }, [Boolean(snapshot), startupVisible]);

  const personaTransition = snapshot?.personaTransition ?? null;
  const personaTransitionActive = Boolean(personaTransition);
  const connected = snapshot?.state === 'connected';
  const controllerConnected = Boolean(snapshot?.status?.controllerConnected);
  const controllerControlsAvailable = connected && controllerConnected;
  // Shown on each page's status badges while there is nothing to talk to.
  const CONTROLLER_NOT_CONNECTED = 'Controller not connected';
  const liveControllerType = snapshot?.status?.controllerType;
  const remapControllerType = snapshot?.status?.controllerConnected && liveControllerType && liveControllerType !== 'unknown'
    ? liveControllerType
    : lastRemapControllerType;
  const showDualSenseEdgeRemapButtons = remapControllerType === 'dualsense-edge';
  const remapModifiedCount = useMemo(() => (
    REMAP_ALL_BUTTON_IDS.filter((buttonId) => remapDraft[buttonId] !== buttonId).length
  ), [remapDraft]);
  const triggerProfileLibraryRows = useMemo(() => (
    triggerProfileLibraryCatalog
      ? filterLibrary(triggerProfileLibraryCatalog, triggerProfileLibraryQuery)
      : []
  ), [triggerProfileLibraryCatalog, triggerProfileLibraryQuery]);
  // Library files already installed, so the library can offer Install only for what is not.
  const installedLibraryFiles = useMemo(() => new Set(
    triggerProfiles
      .map((profile) => profile.meta?.libraryFile)
      .filter((file): file is string => typeof file === 'string')
  ), [triggerProfiles]);
  const selectedControllerProfile = snapshot?.settings.controllerProfiles.find((profile) => (
    profile.id === snapshot.settings.selectedControllerProfileId
  ));
  const selectedControllerProfileId = selectedControllerProfile?.id ?? DEFAULT_CONTROLLER_PROFILE_ID;
  const controllerProfileOptions = useMemo<Array<[string, string]>>(() => (
    snapshot
      ? visibleProfileOptions(snapshot.settings.controllerProfiles, snapshot.settings.selectedControllerProfileId)
      : [['Default', DEFAULT_CONTROLLER_PROFILE_ID]]
  ), [snapshot?.settings.controllerProfiles, snapshot?.settings.selectedControllerProfileId]);
  const selectedControllerProfileIsDefault = selectedControllerProfileId === DEFAULT_CONTROLLER_PROFILE_ID;
  const selectedControllerProfileIsGameOwned = isGameSettingsProfileId(selectedControllerProfileId);
  // Default can go once another user profile exists to fall back to.
  const canDeleteControllerProfile = !selectedControllerProfileIsGameOwned && (
    !selectedControllerProfileIsDefault
    || Boolean(snapshot?.settings.controllerProfiles.some((profile) => (
      profile.id !== DEFAULT_CONTROLLER_PROFILE_ID && !isGameSettingsProfileId(profile.id)
    )))
  );
  const selectedRemapProfile = snapshot?.settings.buttonRemappingProfiles.find((profile) => (
    profile.id === snapshot.settings.selectedButtonRemappingProfileId
  ));
  const selectedRemapProfileId = selectedRemapProfile?.id ?? DEFAULT_BUTTON_REMAP_PROFILE_ID;
  const remapProfileOptions = useMemo<Array<[string, string]>>(() => (
    snapshot
      ? visibleProfileOptions(snapshot.settings.buttonRemappingProfiles, snapshot.settings.selectedButtonRemappingProfileId)
      : [['Default', DEFAULT_BUTTON_REMAP_PROFILE_ID]]
  ), [snapshot?.settings.buttonRemappingProfiles, snapshot?.settings.selectedButtonRemappingProfileId]);
  const selectedRemapProfileIsDefault = selectedRemapProfileId === DEFAULT_BUTTON_REMAP_PROFILE_ID;
  const selectedRemapProfileIsGameOwned = isGameSettingsProfileId(selectedRemapProfileId);
  // Game Profile tiles are the saved trigger profiles: the Default fallback and unsaved
  // editor drafts are not games.
  const gameProfiles = useMemo(() => (
    triggerProfiles.filter((profile) => (
      profile.id !== DEFAULT_PROFILE_ID && !isProvisionalTriggerProfileId(profile.id)
    ))
  ), [triggerProfiles]);
  // The OpenDS5-Profiles catalog drives what a new game gets (native / published
  // profile / nothing) and the NATIVE badge on existing tiles. Loaded once here;
  // the library dialog refreshes it when opened.
  useEffect(() => {
    void window.bridge.getProfileLibraryCatalog()
      .then(setTriggerProfileLibraryCatalog)
      .catch(() => undefined);
  }, []);
  const nativeFeatureMap = useMemo(
    () => nativeGameFeatureMap(triggerProfileLibraryCatalog),
    [triggerProfileLibraryCatalog]
  );
  // Game entries without custom effects ride the Default profile: they exist
  // for detection/settings/artwork and are managed from the Game Profile tab.
  // Showing them here would read as "adding a game created a trigger profile".
  // The one exception is the profile currently selected for editing — that is
  // exactly how a (non-native) game gets its first effects.
  const triggerStripProfiles = useMemo(() => (
    triggerProfiles.filter((profile) => (
      !profile.meta?.game
      || triggerProfileHasEffects(profile)
      || profile.id === selectedTriggerProfileId
    ))
  ), [triggerProfiles, selectedTriggerProfileId]);
  const openGameProfileEntry = openGameProfileId
    ? gameProfiles.find((profile) => profile.id === openGameProfileId) ?? null
    : null;
  const activeGameProfile = triggerProfileEngineStatus
    && triggerProfileEngineStatus.enabled
    && triggerProfileEngineStatus.activeProfileId !== DEFAULT_PROFILE_ID
    ? gameProfiles.find((profile) => profile.id === triggerProfileEngineStatus.activeProfileId) ?? null
    : null;
  const gameSettingsScope: 'game' | 'global' = openGameProfileId !== null
    && gameSettingsStatus?.editingProfileId === openGameProfileId
    ? 'game'
    : 'global';
  const gameHasSettings = (profileId: string): boolean => (
    snapshot?.settings.controllerProfiles.some((profile) => profile.id === gameSettingsProfileId(profileId)) ?? false
  );
  // The user's own profiles (game-owned settings excluded) a game can be linked to.
  const userControllerProfiles = (snapshot?.settings.controllerProfiles ?? [])
    .filter((profile) => !isGameSettingsProfileId(profile.id));
  const gameProfileLinkOptions: Array<[string, string]> = [
    ['No profile (game settings)', GAME_PROFILE_LINK_NONE],
    ...userControllerProfiles.map((profile): [string, string] => [profile.name, profile.id])
  ];
  const linkedProfileFor = (gameId: string) => {
    const linkedId = snapshot?.settings.gameProfileLinks?.[gameId];
    return linkedId ? userControllerProfiles.find((profile) => profile.id === linkedId) ?? null : null;
  };
  function setGameProfileLink(gameId: string, profileId: string) {
    const linking = profileId !== GAME_PROFILE_LINK_NONE;
    void runAction('game-profile-link', async () => {
      if (linking && gameSettingsStatus?.editingProfileId === gameId) {
        setScopeOptimistically(null);
        setGameSettingsStatus(await window.bridge.exitGameSettingsScope());
      }
      return window.bridge.setGameProfileLink(gameId, linking ? profileId : null);
    });
  }
  const remappingLayoutAsset = showDualSenseEdgeRemapButtons ? REMAP_EDGE_LAYOUT_ASSET : REMAP_STANDARD_LAYOUT_ASSET;
  const chordFunctions = snapshot?.settings.chordFunctions ?? [];
  const chordAssignments = snapshot?.settings.chordAssignments ?? [];
  const muteButtonChordStarterActive = snapshot?.settings.muteButtonMode === 'chord'
    || (
      !VDS_AVAILABLE
      && snapshot?.settings.muteButtonMode === 'keyboard'
      && snapshot.settings.muteKeyboardChordStarterEnabled
    );
  const selectedChordFunction = chordFunctions.find((func) => func.id === selectedChordFunctionId) ?? chordFunctions[0] ?? null;
  const chordFunctionDialogFunction = chordFunctionDialog
    ? chordFunctions.find((func) => func.id === chordFunctionDialog.functionId) ?? null
    : null;
  const chordAssignmentConflictState = useMemo(() => {
    const counts = new Map<string, number>();
    for (const assignment of chordAssignments) {
      const key = chordAssignmentKey(assignment);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const conflictKeys = new Set<string>();
    let conflictCount = 0;
    for (const [key, count] of counts) {
      if (count > 1) {
        conflictKeys.add(key);
        conflictCount += count - 1;
      }
    }
    const shortcutKeys = new Set<string>();
    // The firmware's shortcuts use PS, a chord starter; vdsd's use a touchpad
    // click, which cannot collide with chords.
    if (!VDS_AVAILABLE) {
      const shortcutModifier: ChordStarterId = 'ps';
      if (snapshot?.settings.sleepKeybindEnabled) {
        shortcutKeys.add(chordBindingKey(shortcutModifier, 'triangle'));
      }
      if (snapshot?.settings.speakerVolumeShortcutEnabled) {
        shortcutKeys.add(chordBindingKey(shortcutModifier, 'dpad-up'));
        shortcutKeys.add(chordBindingKey(shortcutModifier, 'dpad-down'));
      }
      if (snapshot?.settings.profileShortcutEnabled) {
        shortcutKeys.add(chordBindingKey(shortcutModifier, 'dpad-left'));
        shortcutKeys.add(chordBindingKey(shortcutModifier, 'dpad-right'));
      }
    }
    for (const assignment of chordAssignments) {
      const key = chordAssignmentKey(assignment);
      if (shortcutKeys.has(key)) {
        conflictKeys.add(key);
        conflictCount += 1;
      }
      if (assignment.starter === CHORD_MUTE_STARTER_ID && !muteButtonChordStarterActive) {
        conflictKeys.add(key);
        conflictCount += 1;
      }
    }
    return { conflictKeys, conflictCount };
  }, [
    chordAssignments,
    muteButtonChordStarterActive,
    snapshot?.settings.sleepKeybindEnabled,
    snapshot?.settings.speakerVolumeShortcutEnabled,
    snapshot?.settings.profileShortcutEnabled
  ]);
  const chordFunctionsSignature = useMemo(() => (
    chordFunctions.map((func) => `${func.id}:${func.name}:${chordFunctionSummary(func)}`).join('|')
  ), [chordFunctions]);
  const chordFunctionOptions = useMemo<Array<[string, string]>>(() => (
    chordFunctions.length > 0
      ? chordFunctions.map((func) => [func.name, func.id])
      : [['No Functions', '']]
  ), [chordFunctions]);
  const defaultChordFunctionId = selectedChordFunction?.id ?? chordFunctions[0]?.id ?? '';
  const chordStarterOptions = useMemo<Array<[string, ChordStarterId]>>(() => (
    CHORD_STARTER_OPTIONS.filter(([, starter]) => {
      if (starter === CHORD_MUTE_STARTER_ID) {
        return muteButtonChordStarterActive;
      }
      return starter === 'ps' || showDualSenseEdgeRemapButtons;
    })
  ), [muteButtonChordStarterActive, showDualSenseEdgeRemapButtons]);
  const chordAssignableButtonIds = useMemo<readonly ChordAssignableButtonId[]>(() => (
    (showDualSenseEdgeRemapButtons
      ? CHORD_BUTTON_MENU_IDS
      : REMAP_STANDARD_TARGET_BUTTON_IDS) as readonly ChordAssignableButtonId[]
  ), [showDualSenseEdgeRemapButtons]);
  function chordStarterOptionsFor(currentStarter?: ChordStarterId): Array<[string, ChordStarterId]> {
    return currentStarter === CHORD_MUTE_STARTER_ID
      && !chordStarterOptions.some(([, starter]) => starter === CHORD_MUTE_STARTER_ID)
      ? [...chordStarterOptions, [CHORD_STARTERS.mute.label, CHORD_MUTE_STARTER_ID]]
      : chordStarterOptions;
  }
  function muteChordStarterIsInactive(starter: ChordStarterId): boolean {
    return starter === CHORD_MUTE_STARTER_ID && !muteButtonChordStarterActive;
  }
  function chordButtonOptionsFor(
    starter: ChordStarterId,
    includeUnassigned = false
  ): Array<[string, ChordButtonSelectValue]> {
    const ids = chordAssignableButtonIds;
    const options = ids
      .filter((id) => isChordBindingAllowed(starter, id))
      .map((id): [string, ChordButtonSelectValue] => [chordButtonLabel(id), id]);
    return includeUnassigned
      ? [['Choose Button', CHORD_UNASSIGNED_BUTTON], ...options]
      : options;
  }
  function firstAllowedChordButton(starter: ChordStarterId): ChordAssignableButtonId | null {
    return chordAssignableButtonIds.find((id) => isChordBindingAllowed(starter, id)) ?? null;
  }
  const canAddChordDraft = Boolean(defaultChordFunctionId)
    && chordAssignments.length + chordAssignmentDraftRows.length < MAX_CHORD_ASSIGNMENTS;
  const chordAssignmentsSubtitle = muteButtonChordStarterActive
    ? (showDualSenseEdgeRemapButtons ? 'Pair PS, LFN, RFN, or Mute with a button.' : 'Pair PS or Mute with a button.')
    : (showDualSenseEdgeRemapButtons ? 'Pair PS, LFN, or RFN with a button.' : 'Pair PS with a button.');

  useEffect(() => {
    const list = chordAssignmentListRef.current;
    if (!list || activeControlTab !== 'chords') {
      return;
    }
    const frame = window.requestAnimationFrame(updateChordAssignmentScrollbar);
    const observer = new ResizeObserver(updateChordAssignmentScrollbar);
    observer.observe(list);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [
    activeControlTab,
    chordAssignments.length,
    chordAssignmentDraftRows.length
  ]);

  useEffect(() => {
    if (snapshot?.status?.controllerConnected && liveControllerType && liveControllerType !== 'unknown') {
      setLastRemapControllerType(liveControllerType);
      window.localStorage.setItem(LAST_REMAP_CONTROLLER_TYPE_STORAGE_KEY, liveControllerType);
    }
  }, [liveControllerType, snapshot?.status?.controllerConnected]);

  useEffect(() => {
    if (chordFunctions.length === 0) {
      setSelectedChordFunctionId('');
      setChordFunctionDraft(EMPTY_CHORD_FUNCTION_DRAFT);
      setChordAssignmentDraftRows([]);
      return;
    }
    const nextSelected = chordFunctions.find((func) => func.id === selectedChordFunctionId) ?? chordFunctions[0]!;
    if (nextSelected.id !== selectedChordFunctionId) {
      setSelectedChordFunctionId(nextSelected.id);
    }
    setChordFunctionDraft(chordFunctionToDraft(nextSelected));
  }, [chordFunctionsSignature]);

  useEffect(() => {
    setChordAssignmentDraftRows((rows) => rows
      .map((row) => {
        const rowStarterOptions = chordStarterOptionsFor(row.starter);
        const starter = rowStarterOptions.some(([, option]) => option === row.starter) ? row.starter : 'ps';
        const functionId = chordFunctions.some((func) => func.id === row.functionId)
          ? row.functionId
          : defaultChordFunctionId;
        const button = row.button
          && chordAssignableButtonIds.includes(row.button)
          && isChordBindingAllowed(starter, row.button)
          ? row.button
          : null;
        return functionId ? { ...row, starter, button, functionId } : null;
      })
      .filter((row): row is ChordAssignmentDraftRow => row !== null));
  }, [chordAssignableButtonIds, chordFunctionsSignature, chordStarterOptions, defaultChordFunctionId]);

  function applySnapshot(next: BridgeSnapshot) {
    setSnapshot(next);
    setRemapDraft(next.settings.buttonRemappingDraft);
    if (!hapticsEditingRef.current) {
      setHapticsValue(displayHapticsValue(next));
    }
    if (!classicRumbleEditingRef.current) {
      setClassicRumbleValue(displayClassicRumbleValue(next));
    }
    if (!speakerVolumeEditingRef.current) {
      setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
    }
    if (!micVolumeEditingRef.current) {
      setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
    }
    if (!audioBufferLengthEditingRef.current) {
      setAudioBufferLengthValue(clampAudioBufferLength(next.settings.hapticsBufferLength));
    }
    const nextLightbarColor = lightbarColorFromSnapshot(next);
    setLightbarColor(nextLightbarColor);
    if (!isLightbarPresetColor(nextLightbarColor)) {
      setCustomLightbarColor(nextLightbarColor);
      setCustomColorDraft(nextLightbarColor);
      window.localStorage.setItem('ds5bridge.customLightbarColor', nextLightbarColor);
    }
    if (!lightbarBrightnessEditingRef.current) {
      setLightbarBrightnessValue(displayLightbarBrightnessValue(next));
    }
    if (!triggerEffectEditingRef.current) {
      setTriggerEffectIntensityValue(displayTriggerEffectIntensityValue(next));
    }
  }

  function finishWindowDrag() {
    windowDraggingRef.current = false;
    setWindowDragging(false);
    if (windowDragReleaseTimerRef.current !== null) {
      window.clearTimeout(windowDragReleaseTimerRef.current);
      windowDragReleaseTimerRef.current = null;
    }
    const deferredSnapshot = deferredSnapshotRef.current;
    deferredSnapshotRef.current = null;
    if (deferredSnapshot) {
      applySnapshot(deferredSnapshot);
    }
  }

  function beginWindowDrag() {
    windowDraggingRef.current = true;
    setWindowDragging(true);
    if (windowDragReleaseTimerRef.current !== null) {
      window.clearTimeout(windowDragReleaseTimerRef.current);
    }
    windowDragReleaseTimerRef.current = window.setTimeout(finishWindowDrag, 1600);
    window.addEventListener('mouseup', finishWindowDrag, { once: true });
    window.addEventListener('blur', finishWindowDrag, { once: true });
  }

  const audioReactiveHapticsSource = snapshot?.settings.audioReactiveHapticsSource ?? 'system-audio';
  const audioReactiveHapticsSourceKey = audioHapticsSourceKey(audioReactiveHapticsSource);

  useEffect(() => {
    let cancelled = false;
    let receivedLiveSnapshot = false;
    window.bridge.getStatus().then((next) => {
      if (!cancelled && !receivedLiveSnapshot) {
        applySnapshot(next);
      }
    });
    const unsubscribe = window.bridge.onSnapshot((next) => {
      receivedLiveSnapshot = true;
      if (windowDraggingRef.current) {
        deferredSnapshotRef.current = next;
        return;
      }
      applySnapshot(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
      if (customSwatchPrimeTimerRef.current !== null) {
        window.clearTimeout(customSwatchPrimeTimerRef.current);
      }
      if (overviewSleepConfirmTimerRef.current !== null) {
        window.clearTimeout(overviewSleepConfirmTimerRef.current);
      }
      if (settingsFocusTimerRef.current !== null) {
        window.clearTimeout(settingsFocusTimerRef.current);
      }
      if (notificationFocusTimerRef.current !== null) {
        window.clearTimeout(notificationFocusTimerRef.current);
      }
      if (windowDragReleaseTimerRef.current !== null) {
        window.clearTimeout(windowDragReleaseTimerRef.current);
      }
      if (startupReadyTimerRef.current !== null) {
        window.clearTimeout(startupReadyTimerRef.current);
      }
      if (triggerProfileTransferStatusTimeout.current !== null) {
        clearTimeout(triggerProfileTransferStatusTimeout.current);
      }
      window.removeEventListener('mouseup', finishWindowDrag);
      window.removeEventListener('blur', finishWindowDrag);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    window.bridge.listTriggerProfiles().then((profiles) => {
      if (cancelled) return;
      setTriggerProfiles(profiles);
      if (profiles.length > 0) {
        loadTriggerProfileDraft(profiles[0]);
      }
    });
    window.bridge.getTriggerProfileEngineStatus().then((status) => {
      if (cancelled) return;
      setTriggerProfilesEnabled(status.enabled);
      setTriggerProfileEngineStatus(status);
    });
    const unsubscribe = window.bridge.onTriggerProfileEngineStatus((status) => {
      setTriggerProfilesEnabled(status.enabled);
      setTriggerProfileEngineStatus(status);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    window.bridge.getGameSettingsStatus().then((status) => {
      if (!cancelled) setGameSettingsStatus(status);
    });
    window.bridge.getGameArtwork().then((urls) => {
      if (!cancelled) setGameArtwork(urls);
    });
    const unsubscribe = window.bridge.onGameSettingsStatus(setGameSettingsStatus);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Track the profile strip's width so the chip row adapts to the window size,
  // collapsing into the overflow dropdown when the strip gets too narrow.
  // The strip only exists once the startup screen is gone, so this effect must
  // key on that transition — with [] deps it would run against null refs and
  // never observe anything.
  const mainUiMounted = Boolean(snapshot) && !startupVisible;
  useEffect(() => {
    if (!mainUiMounted) return;
    const strip = triggerStripRef.current;
    const actions = triggerStripActionsRef.current;
    if (!strip || !actions || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === strip) setTriggerStripWidth(width);
        else if (entry.target === actions) setTriggerStripActionsWidth(width);
      }
    });
    observer.observe(strip);
    observer.observe(actions);
    return () => observer.disconnect();
  }, [mainUiMounted]);

  // The editor always shows the profile that is actually driving the triggers, however it became
  // active: a matched game, a pin, or the default fallback. Following only process matches left
  // the editor on a profile the controller was not using -- e.g. auto mode falls back to Default
  // while the strip still highlights the last profile opened.
  useEffect(() => {
    const status = triggerProfileEngineStatus;
    if (!status?.activeProfileId) return;
    if (lastAutoMatchedProfileRef.current === status.activeProfileId) return;
    const profile = triggerProfiles.find((entry) => entry.id === status.activeProfileId);
    if (!profile) return;
    lastAutoMatchedProfileRef.current = status.activeProfileId;
    loadTriggerProfileDraft(profile);
  }, [triggerProfileEngineStatus, triggerProfiles]);

  // Live-preview edited trigger draft effects on the controller (debounced);
  // armed only after an actual trigger edit so selecting a profile never writes.
  useEffect(() => {
    if (!triggerProfilePreviewArmedRef.current) return;
    if (activeControlTab !== 'trigger-profiles' || !triggerProfileDraft) return;
    const triggers = editingStateTriggers(triggerProfileDraft, triggerProfileEditingState);
    const handle = setTimeout(() => {
      void window.bridge.previewTriggerProfileDraft({ l2: triggers.l2, r2: triggers.r2 });
    }, 150);
    return () => clearTimeout(handle);
  }, [triggerProfileDraft, triggerProfileEditingState, activeControlTab]);

  // Clear any live draft preview when leaving the Trigger Profiles tab.
  useEffect(() => {
    if (activeControlTab === 'trigger-profiles') return;
    if (!triggerProfilePreviewArmedRef.current) return;
    triggerProfilePreviewArmedRef.current = false;
    void window.bridge.previewTriggerProfileDraft(null);
  }, [activeControlTab]);

  // Clear any live draft preview on unmount.
  useEffect(() => () => {
    if (triggerProfilePreviewArmedRef.current) {
      void window.bridge.previewTriggerProfileDraft(null);
    }
  }, []);

  useEffect(() => {
    const controllerAudioReady = connected && controllerConnected;
    if (!audioHapticsOpen || !controllerAudioReady) {
      setAudioHapticsSessions([]);
      setAudioHapticsSessionsLoading(false);
      return undefined;
    }

    let cancelled = false;
    let refreshInFlight = false;
    async function refreshSessions() {
      if (refreshInFlight) {
        return;
      }
      refreshInFlight = true;
      setAudioHapticsSessionsLoading(true);
      try {
        const sessions = await window.bridge.listAudioHapticsSessions();
        if (!cancelled) {
          setAudioHapticsSessions(sessions);
        }
      } catch {
        if (!cancelled) {
          setAudioHapticsSessions([]);
        }
      } finally {
        refreshInFlight = false;
        if (!cancelled) {
          setAudioHapticsSessionsLoading(false);
        }
      }
    }

    void refreshSessions();
    const interval = window.setInterval(refreshSessions, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [audioHapticsOpen, audioReactiveHapticsSourceKey, connected, controllerConnected]);

  useEffect(() => {
    if (!showBridgeSettings && !showNotificationsMenu && !triggerProfileLibraryOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (showNotificationsMenu && !notificationsRef.current?.contains(event.target as Node)) {
        setShowNotificationsMenu(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBridgeSettings(false);
        setShowNotificationsMenu(false);
        setTriggerProfileLibraryOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showBridgeSettings, showNotificationsMenu, triggerProfileLibraryOpen]);

  useEffect(() => {
    setSpeakerOutputAvailable(true);
  }, []);

  useEffect(() => {
    if (activeControlTab !== 'remapping') {
      return undefined;
    }

    const leftSide = remappingLeftSideRef.current;
    const rightSide = remappingRightSideRef.current;
    const layout = remappingLayoutRef.current;
    const art = remappingArtRef.current;
    if (!leftSide || !rightSide || !layout || !art) {
      return undefined;
    }
    const leftSideElement = leftSide;
    const rightSideElement = rightSide;
    const layoutElement = layout;
    const artElement = art;

    function updateRemapCalloutPositions() {
      const artRect = artElement.getBoundingClientRect();
      const leftRect = leftSideElement.getBoundingClientRect();
      const rightRect = rightSideElement.getBoundingClientRect();
      const layoutRect = layoutElement.getBoundingClientRect();
      const layoutScaleX = layoutRect.width / layoutElement.offsetWidth || 1;
      const layoutScaleY = layoutRect.height / layoutElement.offsetHeight || 1;
      const toLocalX = (clientX: number) => (clientX - layoutRect.left) / layoutScaleX;
      const toLocalY = (clientY: number) => (clientY - layoutRect.top) / layoutScaleY;
      const artLeft = toLocalX(artRect.left);
      const artTop = toLocalY(artRect.top);
      const artWidth = artRect.width / layoutScaleX;
      const artHeight = artRect.height / layoutScaleY;
      const leftTop = toLocalY(leftRect.top);
      const rightTop = toLocalY(rightRect.top);
      const viewBoxAspect = remappingLayoutAsset.viewBoxWidth / remappingLayoutAsset.viewBoxHeight;
      const renderedSvgHeight = Math.min(artHeight, artWidth / viewBoxAspect);
      const renderedSvgWidth = renderedSvgHeight * viewBoxAspect;
      const renderedSvgTop = artTop + (artHeight - renderedSvgHeight) / 2;
      const renderedSvgLeft = artLeft + (artWidth - renderedSvgWidth) / 2;
      const nextLayout = {} as Record<StandardRemapButtonId, RemapCalloutLayout>;
      const mapSvgPoint = ([x, y]: [number, number]) => (
        `${renderedSvgLeft + (x / remappingLayoutAsset.viewBoxWidth) * renderedSvgWidth},${renderedSvgTop + (y / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight}`
      );
      const mapSvgX = (x: number) => renderedSvgLeft + (x / remappingLayoutAsset.viewBoxWidth) * renderedSvgWidth;
      const mapSvgY = (y: number) => renderedSvgTop + (y / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight;
      const remapPillEdgeX = (side: HTMLElement, buttonId: StandardRemapButtonId, edge: 'left' | 'right') => {
        const pill = side.querySelector<HTMLElement>(`[data-remap-button-id="${buttonId}"]`);
        if (!pill) {
          return edge === 'right' ? toLocalX(side.getBoundingClientRect().right) : toLocalX(side.getBoundingClientRect().left);
        }
        const pillRect = pill.getBoundingClientRect();
        return toLocalX(edge === 'right' ? pillRect.right : pillRect.left);
      };

      for (const buttonId of REMAP_LEFT_BUTTON_IDS) {
        const top = renderedSvgTop + (remappingLayoutAsset.calloutY[buttonId] / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight - leftTop;
        const pillRightX = remapPillEdgeX(leftSideElement, buttonId, 'right');
        nextLayout[buttonId] = {
          top,
          points: [
            `${pillRightX},${leftTop + top}`,
            ...remappingLayoutAsset.calloutPoints[buttonId].map(mapSvgPoint)
          ].join(' ')
        };
      }
      for (const buttonId of REMAP_RIGHT_BUTTON_IDS) {
        const top = renderedSvgTop + (remappingLayoutAsset.calloutY[buttonId] / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight - rightTop;
        const pillLeftX = remapPillEdgeX(rightSideElement, buttonId, 'left');
        nextLayout[buttonId] = {
          top,
          points: [
            `${pillLeftX},${rightTop + top}`,
            ...remappingLayoutAsset.calloutPoints[buttonId].map(mapSvgPoint)
          ].join(' ')
        };
      }

      setRemapCalloutLayout((current) => {
        if (current && REMAP_STANDARD_BUTTON_IDS.every((buttonId) => (
          Math.abs(current[buttonId].top - nextLayout[buttonId].top) < 0.5
          && current[buttonId].points === nextLayout[buttonId].points
        ))) {
          return current;
        }
        return nextLayout;
      });

      if (showDualSenseEdgeRemapButtons) {
        const nextEdgeLayout = {} as Record<DualSenseEdgeRemapButtonId, EdgeRemapControlLayout>;
        for (const buttonId of REMAP_EDGE_BUTTON_IDS) {
          const point = REMAP_EDGE_CONTROL_POINTS[buttonId];
          nextEdgeLayout[buttonId] = {
            left: mapSvgX(point.x),
            top: mapSvgY(point.y),
            anchor: point.anchor,
            linePoints: REMAP_EDGE_LINE_POINTS[buttonId].map(mapSvgPoint).join(' ')
          };
        }
        setEdgeRemapControlLayout((current) => {
          if (current && REMAP_EDGE_BUTTON_IDS.every((buttonId) => (
            Math.abs(current[buttonId].left - nextEdgeLayout[buttonId].left) < 0.5
            && Math.abs(current[buttonId].top - nextEdgeLayout[buttonId].top) < 0.5
            && current[buttonId].anchor === nextEdgeLayout[buttonId].anchor
            && current[buttonId].linePoints === nextEdgeLayout[buttonId].linePoints
          ))) {
            return current;
          }
          return nextEdgeLayout;
        });
      } else {
        setEdgeRemapControlLayout(null);
      }
    }

    updateRemapCalloutPositions();
    const resizeObserver = new ResizeObserver(updateRemapCalloutPositions);
    resizeObserver.observe(leftSideElement);
    resizeObserver.observe(rightSideElement);
    resizeObserver.observe(layoutElement);
    resizeObserver.observe(artElement);
    window.addEventListener('resize', updateRemapCalloutPositions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateRemapCalloutPositions);
    };
  }, [activeControlTab, remappingLayoutAsset, showDualSenseEdgeRemapButtons]);

  useEffect(() => {
    if (!connected) {
      setSpeakerTestError(null);
    }
  }, [connected]);

  useEffect(() => {
    if (!showCustomColorPicker) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!customColorPickerRef.current?.contains(event.target as Node)) {
        setShowCustomColorPicker(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCustomColorPicker(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showCustomColorPicker]);

  useEffect(() => {
    if (!gameDetectPopoverOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!gameDetectPopoverRef.current?.contains(event.target as Node)) {
        setGameDetectPopoverOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setGameDetectPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [gameDetectPopoverOpen]);

  useEffect(() => {
    if (!gameProcessDetectOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!gameProcessDetectRef.current?.contains(event.target as Node)) {
        setGameProcessDetectOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setGameProcessDetectOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [gameProcessDetectOpen]);

  async function detectRunningGame(): Promise<void> {
    setGameDetectLoading(true);
    try {
      const candidates = await window.bridge.listCandidateGameProcesses();
      setGameDetectCandidates(candidates);
      setGameDetectPopoverOpen(true);
    } finally {
      setGameDetectLoading(false);
    }
  }

  function pickDetectedGameProcess(candidateName: string): void {
    setTriggerProfileProcessNamesInput((current) => mergeDetectedProcessName(current, candidateName));
  }

  function openGameProcessEditor(profile: TriggerProfile): void {
    setGameProcessEditor({ id: profile.id, name: gameProfileTitle(profile) });
    setGameProcessEditorInput(profile.match.processNames.join(', '));
    setGameProcessDetectOpen(false);
  }

  // Same "Detect running game" flow as the trigger editor, but targets the game process editor.
  async function detectRunningGameForEditor(): Promise<void> {
    setGameDetectLoading(true);
    try {
      const candidates = await window.bridge.listCandidateGameProcesses();
      setGameDetectCandidates(candidates);
      setGameProcessDetectOpen(true);
    } finally {
      setGameDetectLoading(false);
    }
  }

  function pickDetectedGameProcessForEditor(candidateName: string): void {
    setGameProcessEditorInput((current) => mergeDetectedProcessName(current, candidateName));
    setGameProcessDetectOpen(false);
  }

  async function browseGameExecutableForEditor(): Promise<void> {
    const picked = await window.bridge.pickGameExecutable();
    if (picked) setGameProcessEditorInput((current) => mergeDetectedProcessName(current, picked.processName));
  }

  async function saveGameProcessNames(): Promise<void> {
    if (!gameProcessEditor) return;
    const target = triggerProfiles.find((profile) => profile.id === gameProcessEditor.id);
    if (!target) {
      setGameProcessEditor(null);
      return;
    }
    const processNames = parseProcessNamesInput(gameProcessEditorInput);
    setGameProcessEditorSaving(true);
    try {
      const profile: TriggerProfile = {
        ...target,
        match: { ...target.match, processNames },
        updatedAtMs: Date.now()
      };
      const saved = await window.bridge.saveTriggerProfile(profile);
      await refreshTriggerProfiles(saved.id);
      setGameProcessEditor(null);
    } finally {
      setGameProcessEditorSaving(false);
    }
  }

  const batteryPercent = Math.max(0, Math.min(100, snapshot?.status?.batteryPercent ?? 0));
  const batteryPercentLabel = batteryLabel(snapshot);
  const batteryLevelTone = batteryTone(snapshot?.status?.batteryPercent);
  const batteryCharging = isChargingPowerState(snapshot?.status?.rawPowerState);
  const batterySegmentCount = connected
    ? batteryPercent >= 67
      ? 3
      : batteryPercent >= 34
        ? 2
        : batteryPercent > 0
          ? 1
          : 0
    : 0;
  const batteryChargingSegment = connected && batteryCharging && batteryPercent < 100
    ? Math.min(2, batterySegmentCount)
    : -1;
  const batteryCritical = connected && !batteryCharging && batteryPercent > 0 && batteryPercent <= 20;
  const statusTone = personaTransitionActive
    ? 'warn'
    : connected
      ? 'good'
      : snapshot?.state === 'error' || snapshot?.state === 'incompatible'
        ? 'bad'
        : 'idle';
  const lastAck = snapshot?.diagnostics.lastAck;
  const speakerVolumeSupported = Boolean(snapshot?.status?.firmwareFlags.speakerVolumeControl);
  const lightbarSupported = Boolean(snapshot?.status?.firmwareFlags.lightbarControl);
  const lightbarOverrideSupported = Boolean(snapshot?.status?.firmwareFlags.lightbarOverrideControl);
  const muteButtonActionsSupported = Boolean(snapshot?.status?.firmwareFlags.muteButtonActions);
  const adaptiveTriggersSupported = Boolean(snapshot?.status?.firmwareFlags.adaptiveTriggersControl);
  const usbSuspendDisconnectSupported = Boolean(snapshot?.status?.firmwareFlags.usbSuspendDisconnectControl);
  const sleepControllerSupported = Boolean(snapshot?.status?.firmwareFlags.sleepControllerControl);
  const pollingRateControlSupported = Boolean(snapshot?.status?.firmwareFlags.pollingRateControl);
  const hostPersonaControlSupported = Boolean(snapshot?.status?.firmwareFlags.hostPersonaControl);
  const audioBufferLengthControlSupported = Boolean(snapshot?.status?.firmwareFlags.hapticsBufferLengthControl);
  const audioReactiveHapticsSupported = Boolean(snapshot?.status?.firmwareFlags.audioReactiveHapticsControl);
  const supportedHostPersonaModes: HostPersonaMode[] = snapshot?.status?.supportedHostPersonaModes ?? ['dualsense'];
  const hostPersonaOptions = HOST_PERSONA_OPTIONS.filter(([, mode]) => (
    supportedHostPersonaModes.includes(mode) || snapshot?.settings.hostPersonaMode === mode
  ));
  const overviewHostPersonaMode = personaTransition?.to ?? snapshot?.settings.hostPersonaMode ?? 'dualsense';
  const hapticsEnabled = Boolean(snapshot?.settings.hapticsEnabled);
  const audioReactiveHapticsEnabled = Boolean(snapshot?.settings.audioReactiveHapticsEnabled);
  const audioHapticsSessionByKey = useMemo(() => {
    const sessions = new Map<string, AudioHapticsSession>();
    for (const session of audioHapticsSessions) {
      sessions.set(audioHapticsSessionKey(session), session);
    }
    return sessions;
  }, [audioHapticsSessions]);
  const selectedAudioHapticsSourceDisplayName = audioHapticsSessionByKey.get(audioReactiveHapticsSourceKey)?.displayName
    ?? audioHapticsSourceDisplayName(audioReactiveHapticsSource);
  const audioHapticsSourceOptions = useMemo<Array<[string, string]>>(() => {
    const options: Array<[string, string]> = [['System', 'system-audio']];
    for (const session of audioHapticsSessions) {
      options.push([session.displayName, audioHapticsSessionKey(session)]);
    }
    if (
      audioReactiveHapticsSourceKey !== 'system-audio'
      && !audioHapticsSessionByKey.has(audioReactiveHapticsSourceKey)
    ) {
      options.push([`${audioHapticsSourceDisplayName(audioReactiveHapticsSource)} unavailable`, audioReactiveHapticsSourceKey]);
    }
    return options;
  }, [
    audioHapticsSessionByKey,
    audioHapticsSessions,
    audioReactiveHapticsSource,
    audioReactiveHapticsSourceKey
  ]);
  const classicRumbleEnabled = Boolean(snapshot?.settings.classicRumbleEnabled);
  const classicRumbleV1Enabled = Boolean(snapshot?.settings.classicRumbleV1Enabled);
  const activeHapticsFeatureEnabled = showClassicRumbleControl ? classicRumbleEnabled : hapticsEnabled;
  const speakerEnabled = Boolean(snapshot?.settings.speakerEnabled);
  const speakerGainLevel = Math.max(1, Math.min(7, Math.round(
    snapshot?.settings.speakerGainLevel ?? snapshot?.status?.speakerGainLevel ?? 4
  )));
  const adaptiveTriggersEnabled = Boolean(snapshot?.settings.adaptiveTriggersEnabled);
  const lightbarEnabled = Boolean(snapshot?.settings.lightbarEnabled);
  const sleepKeybindEnabled = Boolean(snapshot?.settings.sleepKeybindEnabled);
  const controllerToastEnabled = Boolean(snapshot?.settings.notifyControllerConnection);
  const lowBatteryToastEnabled = Boolean(snapshot?.settings.notifyLowBattery);
  const chargeCompleteToastEnabled = Boolean(snapshot?.settings.notifyChargeComplete);
  const notificationsEnabled = controllerToastEnabled || lowBatteryToastEnabled || chargeCompleteToastEnabled;
  const gameStreamActive = Boolean(snapshot?.status?.hostOutputRecent);
  const adaptiveTriggerOutputActive = Boolean(snapshot?.status?.adaptiveTriggerOutputRecent);
  const audioStatus = snapshot?.diagnostics.audioStatus;
  const headsetOutputDetected = Boolean(audioStatus?.headsetPlugged);
  const controllerPowerSavingActive = controllerPowerSavingActiveFromSnapshot(snapshot);
  const feedbackBoostEnabled = Boolean(snapshot?.settings.feedbackBoostEnabled);
  const hapticsSliderMax = feedbackSliderMaxFromSnapshot(snapshot);
  const hapticsSliderTicks = feedbackSliderTicks(hapticsSliderMax);
  const percentSliderMax = controllerPowerSavingActive ? CONTROLLER_POWER_SAVING_CAP_PERCENT : 100;
  const OutputIcon = headsetOutputDetected ? Headphones : Volume2;

  const outputControlLabel = headsetOutputDetected ? 'Headphones' : 'Speaker';
  const outputControlLower = headsetOutputDetected ? 'headphones' : 'speaker';
  const outputPresetLower = headsetOutputDetected ? 'headphones' : 'speaker';
  const duplexMicEnabled = Boolean(snapshot?.settings.duplexMicEnabled);
  // vdsd has one Microphone switch: pass-through on and unmuted. Off keeps the
  // controller mic closed, mutes its Linux input and lights the mute LED.
  const microphoneOn = duplexMicEnabled && !snapshot?.settings.micMuted;
  const audioEnabled = speakerEnabled || duplexMicEnabled;
  const audioPathLabel = personaTransitionActive
    ? 'Switching Mode'
    : !connected
    ? 'Unavailable'
    : 'Bridge Local';
  const audioPathTooltip = personaTransitionActive
    ? 'Waiting for the controller to re-enumerate.'
    : audioPathLabel;
  const audioPathTone = connected && !personaTransitionActive ? 'good' : 'idle';
  // vdsd can tune the buffer itself from its Bluetooth timing (Linux only).
  const audioBufferAuto = VDS_AVAILABLE && Boolean(snapshot?.settings.hapticsBufferAuto);
  const audioBufferLengthControlDisabled = !connected
    || !audioBufferLengthControlSupported
    || pendingAction !== null
    || audioBufferLengthCommitPending;
  const audioReactiveHapticsRouteSupported = audioReactiveHapticsSupported;
  const audioReactiveHapticsBlocked = !connected
    || !audioReactiveHapticsSupported
    || !audioReactiveHapticsRouteSupported
    || !hapticsEnabled;
  const audioReactiveHapticsControlDisabled = audioReactiveHapticsBlocked
    || pendingAction !== null
    || audioReactiveHapticsCommitPending;
  const audioReactiveHapticsConfigDisabled = audioReactiveHapticsControlDisabled || !audioReactiveHapticsEnabled;
  const audioReactiveHapticsStatusLabel = !controllerControlsAvailable
    ? CONTROLLER_NOT_CONNECTED
    : !audioReactiveHapticsSupported
      ? 'Update Firmware'
      : !hapticsEnabled
        ? 'HD Haptics Off'
        : audioReactiveHapticsEnabled
          ? 'Ready'
          : 'Off';
  const audioReactiveHapticsStatusTone = !controllerControlsAvailable
    ? 'warn'
    : audioReactiveHapticsEnabled
    && hapticsEnabled
    && audioReactiveHapticsRouteSupported
    ? 'good'
    : connected && (
        !audioReactiveHapticsRouteSupported
        || !hapticsEnabled
      )
      ? 'warn'
      : 'idle';
  const audioReactiveHapticsOverrideMode = snapshot?.settings.audioReactiveHapticsMode === 'replace';
  const audioReactiveHapticsModeBadgeLabel = audioReactiveHapticsEnabled
    ? audioReactiveHapticsOverrideMode ? 'Override' : 'Mixed'
    : null;
  const audioReactiveHapticsModeTooltip = audioReactiveHapticsOverrideMode
    ? 'Audio haptics are replacing native haptic output.'
    : 'Audio haptics are mixed with native haptic output.';
  const duplexMicLabel = audioStatus?.duplexActive
    ? 'Duplex Active'
    : duplexMicEnabled
      ? 'Mic Standby'
      : 'Off';
  const speakerOutputMissing = false;
  const testHapticsUnavailable = !controllerControlsAvailable
    || !hapticsEnabled
    || pendingAction !== null
    || speakerVolumeCommitPending
    || lightbarCommitPending
    || testLocked
    || Boolean(snapshot?.status?.testHapticsBusy)
    || Boolean(snapshot?.status?.testHapticsCooldown);
  const testRumbleUnavailable = !controllerControlsAvailable
    || !classicRumbleEnabled
    || pendingAction !== null
    || speakerVolumeCommitPending
    || lightbarCommitPending
    || testLocked
    || Boolean(snapshot?.status?.testHapticsBusy);
  const hapticsStatusReady = connected
    && hapticsEnabled
    && !testLocked
    && !snapshot?.status?.testHapticsBusy
    && !snapshot?.status?.testHapticsCooldown;
  const rumbleStatusReady = connected
    && classicRumbleEnabled
    && !testLocked
    && !snapshot?.status?.testHapticsBusy;
  const hapticsStatusLabel = !controllerControlsAvailable
    ? CONTROLLER_NOT_CONNECTED
    : testLocked || snapshot?.status?.testHapticsBusy
    ? 'Testing'
      : snapshot?.status?.testHapticsCooldown
        ? 'Cooling Down'
      : hapticsStatusReady
        ? 'Ready'
        : 'Unavailable';
  const rumbleStatusLabel = !controllerControlsAvailable
    ? CONTROLLER_NOT_CONNECTED
    : testLocked
    ? 'Testing'
    : rumbleStatusReady
      ? 'Ready'
      : 'Unavailable';
  const hapticsStatusTone = !controllerControlsAvailable
    ? 'warn'
    : testLocked || snapshot?.status?.testHapticsBusy || hapticsStatusReady
    ? 'good'
    : connected && snapshot?.status?.testHapticsCooldown
      ? 'warn'
      : 'idle';
  const rumbleStatusTone = !controllerControlsAvailable
    ? 'warn'
    : testLocked || rumbleStatusReady
    ? 'good'
    : 'idle';
  const activeFeedbackTestUnavailable = showClassicRumbleControl ? testRumbleUnavailable : testHapticsUnavailable;
  const activeFeedbackStatusLabel = showClassicRumbleControl ? rumbleStatusLabel : hapticsStatusLabel;
  const activeFeedbackStatusTone = showClassicRumbleControl ? rumbleStatusTone : hapticsStatusTone;
  const testSpeakerUnavailable = !controllerControlsAvailable
    || !speakerVolumeSupported
    || !speakerEnabled
    || pendingAction !== null
    || speakerVolumeCommitPending
    || lightbarCommitPending
    || speakerTestLocked
    || gameStreamActive
    || Boolean(snapshot?.status?.testHapticsBusy);
  const testMicUnavailable = !controllerControlsAvailable
    || !duplexMicEnabled
    || pendingAction !== null
    || micVolumeCommitPending
    || lightbarCommitPending
    || micTestLocked
    || gameStreamActive;
  const speakerStatusReady = connected
    && speakerVolumeSupported
    && speakerEnabled
    && !speakerTestLocked
    && !speakerOutputMissing
    && !gameStreamActive
    && !snapshot?.status?.testHapticsBusy;
  const micStatusReady = connected
    && duplexMicEnabled
    && !micTestLocked
    && !gameStreamActive;
  const speakerStatusLabel = !controllerControlsAvailable
    ? CONTROLLER_NOT_CONNECTED
    : speakerTestLocked
    ? 'Playing'
    : connected && speakerTestError
      ? speakerTestError
    : connected && speakerOutputMissing
        ? BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE
        : speakerStatusReady
          ? 'Ready'
          : connected && gameStreamActive
            ? 'Game Audio Active'
            : 'Unavailable';
  const speakerStatusTone = !controllerControlsAvailable
    ? 'warn'
    : speakerTestLocked || speakerStatusReady
    ? 'good'
    : connected && (speakerTestError || speakerOutputMissing)
        ? 'bad'
      : connected && gameStreamActive
        ? 'warn'
        : 'idle';
  const micTestStatusLabel = !controllerControlsAvailable
    ? CONTROLLER_NOT_CONNECTED
    : micTestLocked
    ? 'Listening'
    : connected && micTestError
      ? micTestError
      : micStatusReady
        ? 'Ready'
        : 'Unavailable';
  const micTestStatusTone = !controllerControlsAvailable
    ? 'warn'
    : micTestLocked || micStatusReady
    ? 'good'
    : connected && micTestError
      ? 'bad'
      : 'idle';
  const activeAudioTestUnavailable = showMicrophoneControl ? testMicUnavailable : testSpeakerUnavailable;
  const activeAudioTestLocked = showMicrophoneControl ? micTestLocked : speakerTestLocked;
  const activeAudioTestStatusLabel = showMicrophoneControl ? micTestStatusLabel : speakerStatusLabel;
  const activeAudioTestStatusTone = showMicrophoneControl ? micTestStatusTone : speakerStatusTone;
  const sidebarDeviceTitle = personaTransitionActive
    ? 'Switching Mode'
    : connected && controllerConnected
    ? controllerName(snapshot.status?.controllerType)
    : 'Controller';
  const sidebarDeviceStatus = personaTransitionActive
    ? 'Please wait'
    : connected && controllerConnected
    ? 'Connected'
    : connected
      ? 'Controller not connected'
      : 'Bridge not detected';
  const sidebarDeviceTone = personaTransitionActive
    ? 'warn'
    : connected && controllerConnected
      ? 'good'
      : connected
        ? 'warn'
        : snapshot?.state === 'error' || snapshot?.state === 'incompatible'
          ? 'bad'
          : 'idle';
  const sidebarBatteryLabel = personaTransitionActive
    ? 'Reconnecting'
    : connected && controllerConnected
    ? `Battery ${batteryPercentLabel}`
    : 'Battery unavailable';
  const pollingRateLabel = POLLING_RATE_OPTIONS.find(([, mode]) => mode === snapshot?.settings.pollingRateMode)?.[0]
    .replace(' / Real-time', '')
    ?? '--';
  const firmwareUpdateAvailable = Boolean(snapshot?.diagnostics.firmwareUpdateAvailable);
  const overviewHealthLabel = healthLabel(snapshot);
  const overviewHealthTone = personaTransitionActive
    ? 'warn'
    : snapshot?.diagnostics.lastError
    ? 'bad'
    : firmwareUpdateAvailable
    ? 'warn'
    : connected && controllerConnected
      ? 'good'
      : connected
        ? 'warn'
        : 'idle';
  const systemHealthTone = personaTransitionActive
    ? 'warn'
    : snapshot?.diagnostics.lastError
      ? 'bad'
      : firmwareUpdateAvailable || !controllerControlsAvailable
        ? 'warn'
        : 'good';
  const overviewConnectionStatus = personaTransitionActive
    ? 'Switching'
    : connected && controllerConnected
    ? 'Stable'
    : connected
      ? 'Waiting'
      : 'Offline';
  const overviewAudioPathState = !connected
    ? '--'
    : 'Bridge Local';
  const overviewAudioPathDetail = personaTransitionActive
    ? 'Switching Mode'
    : !connected
    ? '--'
    : audioStatus?.controllerStateReady
      ? 'Controller Ready'
      : 'Waiting';
  const overviewAudioOutputLabel = connected ? (headsetOutputDetected ? 'Headphones' : 'Speaker') : '--';
  const overviewSpeakerVolumeValue = `${speakerVolumeValue}%`;
  const overviewFirmwareLabel = snapshot?.status?.firmwareVersion ?? '--';
  const overviewSignalValue = connected ? snapshot?.status?.signalStrengthDbm : null;
  const overviewSignalQuality = overviewSignalValue === null || overviewSignalValue === undefined
    ? null
    : overviewSignalValue >= -15
      ? 'Excellent'
      : overviewSignalValue >= -22
        ? 'Good'
        : overviewSignalValue >= -27
          ? 'Audio Risk'
          : 'Poor';
  const overviewSignalTone = overviewSignalQuality === 'Excellent' || overviewSignalQuality === 'Good'
    ? 'good'
    : overviewSignalQuality === 'Audio Risk'
      ? 'warn'
      : overviewSignalQuality === 'Poor'
        ? 'bad'
        : 'idle';
  const overviewSignalTitle = overviewSignalValue !== null && overviewSignalValue !== undefined
    ? `${overviewSignalValue} dBm`
    : undefined;
  const overviewSignalLabel = overviewSignalQuality && overviewSignalTitle
    ? `${overviewSignalQuality} · ${overviewSignalTitle}`
    : '--';
  const sidebarSignalBars = overviewSignalQuality ? SIGNAL_BAR_COUNTS[overviewSignalQuality] : 0;
  const sidebarSignalLabel = personaTransitionActive
    ? 'Signal --'
    : overviewSignalQuality && overviewSignalTitle
      ? `Signal ${overviewSignalLabel}`
      : 'Signal unavailable';
  const overviewShortcutItems = [
    snapshot?.settings.sleepKeybindEnabled ? { id: 'sleep', label: 'Turn Off Shortcut' } : null,
    snapshot?.settings.speakerVolumeShortcutEnabled ? { id: 'volume', label: 'Volume Shortcut' } : null,
    snapshot?.settings.profileShortcutEnabled ? { id: 'profile', label: 'Profile Shortcut' } : null
  ].filter((item): item is { id: 'sleep' | 'volume' | 'profile'; label: string } => Boolean(item));
  const overviewNotificationItems = [
    controllerToastEnabled ? { id: 'controller-status', label: 'Controller Status' } : null,
    lowBatteryToastEnabled ? { id: 'low-battery', label: 'Low Battery' } : null,
    chargeCompleteToastEnabled ? { id: 'charge-complete', label: 'Fully Charged' } : null
  ].filter((item): item is { id: NotificationFocusTarget; label: string } => Boolean(item));
  const overviewPowerSavingLabel = snapshot?.settings.controllerPowerSavingEnabled
    ? controllerPowerSavingActive
      ? 'Active'
      : 'Enabled'
    : 'Off';
  const lightbarStateActive = controllerControlsAvailable && lightbarSupported && lightbarEnabled;
  const lightbarStateTone = !controllerControlsAvailable ? 'warn' : lightbarStateActive ? 'good' : 'idle';
  const lightbarStateLabel = !controllerControlsAvailable
    ? CONTROLLER_NOT_CONNECTED
    : lightbarStateActive
    ? 'Active'
    : connected && lightbarSupported
      ? 'Off'
      : 'Unavailable';

  useEffect(() => {
    if (!connected || speakerOutputAvailable !== false || speakerTestLocked) {
      return undefined;
    }

    const refresh = () => {
      void findBridgeAudioOutputId(2).then((sinkId) => {
        if (!sinkId) {
          return;
        }
        setSpeakerOutputAvailable(true);
        setSpeakerTestError(null);
      });
    };

    const handle = window.setInterval(refresh, TEST_SPEAKER_ENDPOINT_REFRESH_MS);
    return () => window.clearInterval(handle);
  }, [connected, speakerOutputAvailable, speakerTestLocked]);

  useEffect(() => () => {
    stopMicLiveListen();
  }, []);

  useEffect(() => {
    if ((!connected || !showMicrophoneControl) && micTestLocked) {
      stopMicLiveListen();
    }
  }, [connected, showMicrophoneControl, micTestLocked]);

  const normalizedLightbarColor = normalizeHexColor(lightbarColor);
  const customSwatchColor = customLightbarColor ?? LIGHTBAR_DEFAULT_CUSTOM_COLOR;
  const customSwatchSelected = Boolean(customLightbarColor && normalizedLightbarColor === customLightbarColor);
  const customColorPickerDisabled = !connected || !lightbarSupported || !lightbarEnabled;
  const pageVisible = usePageVisible();
  const diagnosticsVisible = activeControlTab === 'system' && showDiagnostics && pageVisible;
  const [vdsDiagnostics, setVdsDiagnostics] = useState<VdsStatus | null>(null);
  const [vdsVersion, setVdsVersion] = useState<string | null>(null);
  const bridgeState = snapshot?.state;
  useEffect(() => {
    // Re-read on each (re)connect: an update may have restarted a newer vdsd.
    if (!VDS_AVAILABLE || bridgeState !== 'connected') return undefined;
    let cancelled = false;
    void window.vds.getVersion().then((version) => {
      if (!cancelled) setVdsVersion(version);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [bridgeState]);
  const [vdsDaemonLog, setVdsDaemonLog] = useState<VdsDaemonLog | null>(null);
  const [vdsAudioStats, setVdsAudioStats] = useState<VdsAudioStats | null>(null);
  const [vdsTracePending, setVdsTracePending] = useState(false);
  const vdsDaemonLogRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    // Keep the newest daemon log line in view, like a terminal.
    const textarea = vdsDaemonLogRef.current;
    if (textarea) textarea.scrollTop = textarea.scrollHeight;
  }, [vdsDaemonLog]);
  async function setVdsTrace(scope: VdsTraceScope, enabled: boolean) {
    setVdsTracePending(true);
    try {
      setVdsDaemonLog(await window.vds.setDaemonTrace(scope, enabled));
    } finally {
      setVdsTracePending(false);
    }
  }
  useEffect(() => {
    if (!diagnosticsVisible || !VDS_AVAILABLE) return undefined;
    let cancelled = false;
    const poll = () => {
      void window.vds.getStatus().then((status) => {
        if (!cancelled) setVdsDiagnostics(status);
      }).catch(() => undefined);
      void window.vds.getDaemonLog(200).then((log) => {
        if (!cancelled) setVdsDaemonLog(log);
      }).catch(() => undefined);
      void window.vds.getAudioStats().then((stats) => {
        if (!cancelled) setVdsAudioStats(stats);
      }).catch(() => undefined);
    };
    poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [diagnosticsVisible]);
  const ackText = useMemo(() => {
    if (!diagnosticsVisible) return '';
    if (!lastAck) return 'No commands yet';
    return `${ackResultName(lastAck.resultCode)} - seq ${lastAck.commandSequence}`;
  }, [diagnosticsVisible, lastAck]);
  const audioDebugText = useMemo(() => {
    if (!diagnosticsVisible) {
      return '';
    }
    if (!snapshot) {
      return 'state=starting';
    }
    if (!snapshot.status) {
      return `state=${snapshot.state}\nmessage=${snapshot.message}`;
    }

    const debug = snapshot.status.audioDebug;
    const stats = snapshot.diagnostics.audioDebugStats;
    const audio = snapshot.diagnostics.audioStatus;
    const lines = [
      `state=${snapshot.state}`,
      `firmware=${snapshot.status.firmwareVersion}`,
      `triggerEffectIntensity=${snapshot.settings.triggerEffectIntensityPercent}%`,
      `classicRumble=${snapshot.settings.classicRumbleEnabled ? snapshot.settings.classicRumbleGainPercent : 0}%`,
      `appSpeakerSlider=${snapshot.settings.speakerVolumePercent}%`,
      `firmwareSpeakerGate=${snapshot.status.speakerVolumePercent}%`,
      `audioRecent=${snapshot.status.audioRecent ? 'true' : 'false'}`,
      `hostOutputRecent=${snapshot.status.hostOutputRecent ? 'true' : 'false'}`,
      `usbHostSpeakerVolume=${debug.usbHostSpeakerVolumePercent}%`,
      `usbHostSpeakerMute=${debug.usbHostSpeakerMute ? 'true' : 'false'}`,
      `usbHostMicVolume=${debug.usbHostMicVolumePercent}%`,
      `usbHostMicMute=${debug.usbHostMicMute ? 'true' : 'false'}`,
      `audioRepairCount=${debug.lastHostOutputCount}`,
      `lastAudioRepairReportId=0x${hexByte(debug.lastHostOutputReportId)}`,
      `lastAudioRepairLength=${debug.lastHostOutputLength}`
    ];
    if (audio) {
      lines.push(
        'audioPath=bridge-local',
        `controllerStateReady=${audio.controllerStateReady ? 'true' : 'false'}`,
        `headsetPlugged=${audio.headsetPlugged ? 'true' : 'false'}`,
        `headsetAudioRoute=${audio.headsetAudioRoute ? 'true' : 'false'}`,
        `duplexRequested=${audio.duplexRequested ? 'true' : 'false'}`,
        `duplexActive=${audio.duplexActive ? 'true' : 'false'}`,
        `micPacketsReceived=${audio.micPacketsReceived}`,
        `micPacketsDropped=${audio.micPacketsDropped}`,
        `micDecodeSuccess=${audio.micDecodeSuccess}`,
        `micDecodeFail=${audio.micDecodeFail}`,
        `micUsbWriteSuccess=${audio.micUsbWriteSuccess}`,
        `micUsbWriteShort=${audio.micUsbWriteShort}`,
        `micUsbConcealCount=${audio.micUsbConcealCount}`,
        `micPlcCount=${audio.micPlcCount}`,
        `micLastDecodedSamples=${audio.micLastDecodedSamples}`,
        `micLastWrittenBytes=${audio.micLastWrittenBytes}`,
        `micPeakPermille=${audio.micPeakPermille}`,
        `micUsbStreaming=${audio.micUsbStreaming ? 'true' : 'false'}`
      );
    }
    if (stats) {
      lines.push(
        `usbAudioGapMaxUs=${stats.usbAudioGapMaxUs}`,
        `usbAudioGapOver1500Count=${stats.usbAudioGapOver1500Count}`,
        `opusEncodeMaxUs=${stats.opusEncodeMaxUs}`,
        `opusEncodeOverBudgetCount=${stats.opusEncodeOverBudgetCount}`,
        `audio0x36EnqueueToSendMaxUs=${stats.audio0x36EnqueueToSendMaxUs}`,
        `audio0x36SendGapMaxUs=${stats.audio0x36SendGapMaxUs}`,
        `audio0x36LateCountOver12000Us=${stats.audio0x36LateCountOver12000Us}`,
        `audio0x36DropOldestCount=${stats.audio0x36DropOldestCount}`,
        `audioGenerationDropCount=${stats.audioGenerationDropCount}`,
        `nonAudioReportsBetweenAudioMax=${stats.nonAudioReportsBetweenAudioMax}`,
        `btAudioQueueDepthMax=${stats.btAudioQueueDepthMax}`,
        `audio0x36EnqueuedCount=${stats.audio0x36EnqueuedCount}`,
        `audio0x36SentCount=${stats.audio0x36SentCount}`,
        `criticalStarvingAudioCount=${stats.criticalStarvingAudioCount}`
      );
    }
    return lines.join('\n');
  }, [diagnosticsVisible, snapshot]);
  const audioEventLogText = useMemo(() => {
    if (!diagnosticsVisible) {
      return '';
    }
    const lines = snapshot?.diagnostics.audioDebugLogLines ?? [];
    return lines.length > 0 ? lines.join('\n') : 'No audio debug events captured yet.';
  }, [diagnosticsVisible, snapshot?.diagnostics.audioDebugLogLines]);
  const triggerTraceText = useMemo(() => {
    if (!diagnosticsVisible) {
      return '';
    }
    const lines = snapshot?.diagnostics.triggerTraceLines ?? [];
    return lines.length > 0 ? lines.join('\n') : 'No trigger trace events captured yet.';
  }, [diagnosticsVisible, snapshot?.diagnostics.triggerTraceLines]);
  const feedbackTraceText = useMemo(() => {
    if (!diagnosticsVisible) {
      return '';
    }
    const lines = snapshot?.diagnostics.feedbackTraceLines ?? [];
    return lines.length > 0 ? lines.join('\n') : 'No non-zero feedback trace events captured yet.';
  }, [diagnosticsVisible, snapshot?.diagnostics.feedbackTraceLines]);

  const [largerAudioBlocks, setLargerAudioBlocksState] = useState<boolean | null>(null);
  const [largerAudioBlocksPending, setLargerAudioBlocksPending] = useState(false);
  const [largerAudioBlocksError, setLargerAudioBlocksError] = useState('');
  useEffect(() => {
    if (!VDS_LINUX) return;
    void window.vds.getLargerAudioBlocks().then(setLargerAudioBlocksState).catch(() => undefined);
  }, []);
  async function toggleLargerAudioBlocks() {
    if (largerAudioBlocks === null || largerAudioBlocksPending) return;
    setLargerAudioBlocksPending(true);
    setLargerAudioBlocksError('');
    try {
      setLargerAudioBlocksState(await window.vds.setLargerAudioBlocks(!largerAudioBlocks));
    } catch (error) {
      setLargerAudioBlocksError(`Couldn't restart PipeWire: ${error instanceof Error ? error.message : String(error)}`);
      setLargerAudioBlocksState(await window.vds.getLargerAudioBlocks().catch(() => largerAudioBlocks));
    } finally {
      setLargerAudioBlocksPending(false);
    }
  }

  async function runBackupAction(kind: 'backup' | 'restore') {
    if (backupBusy) return;
    setBackupBusy(true);
    setBackupStatus('');
    try {
      if (kind === 'backup') {
        const result = await window.appInfo.backupSettings();
        setBackupStatus(result === 'saved' ? 'Backup saved' : '');
      } else {
        const result = await window.appInfo.restoreSettings();
        setBackupStatus(result === 'restarting' ? 'Restarting…' : '');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(error);
      setBackupStatus(message);
    } finally {
      setBackupBusy(false);
    }
  }

  async function runAction(label: string, action: () => Promise<BridgeSnapshot>) {
    if (!snapshot || pendingAction) {
      return;
    }
    setPendingAction(label);
    try {
      const next = await action();
      setSnapshot(next);
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
    } finally {
      setPendingAction(null);
    }
  }

  async function runQuietAction(action: () => Promise<BridgeSnapshot>) {
    if (!snapshot) {
      return;
    }
    try {
      const next = await action();
      setSnapshot(next);
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
    }
  }

  async function commitHapticsValue(value = hapticsValue) {
    const snappedValue = snapHapticsValue(value, hapticsSliderMax);
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !snapshot.settings.hapticsEnabled
      || (controllerPowerSavingActive && snapshot.settings.hapticsGainPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT && snappedValue === CONTROLLER_POWER_SAVING_CAP_PERCENT)
      || snappedValue === snapshot.settings.hapticsGainPercent
      || hapticsCommitPending
    ) {
      hapticsEditingRef.current = false;
      return;
    }

    setHapticsCommitPending(true);
    hapticsEditingRef.current = true;
    try {
      const next = await window.bridge.setHapticsGain(snappedValue);
      setSnapshot(next);
      setHapticsValue(displayHapticsValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setHapticsValue(displayHapticsValue(next));
    } finally {
      setHapticsCommitPending(false);
      hapticsEditingRef.current = false;
    }
  }

  async function commitClassicRumbleValue(value = classicRumbleValue) {
    const snappedValue = snapHapticsValue(value, hapticsSliderMax);
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !snapshot.settings.classicRumbleEnabled
      || (controllerPowerSavingActive && snapshot.settings.classicRumbleGainPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT && snappedValue === CONTROLLER_POWER_SAVING_CAP_PERCENT)
      || snappedValue === snapshot.settings.classicRumbleGainPercent
      || classicRumbleCommitPending
    ) {
      classicRumbleEditingRef.current = false;
      return;
    }

    setClassicRumbleCommitPending(true);
    classicRumbleEditingRef.current = true;
    try {
      const next = await window.bridge.setClassicRumbleGain(snappedValue);
      setSnapshot(next);
      setClassicRumbleValue(displayClassicRumbleValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setClassicRumbleValue(displayClassicRumbleValue(next));
    } finally {
      setClassicRumbleCommitPending(false);
      classicRumbleEditingRef.current = false;
    }
  }

  async function commitSpeakerVolume(value = speakerVolumeValue) {
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !speakerVolumeSupported
      || !snapshot.settings.speakerEnabled
      || value === snapshot.settings.speakerVolumePercent
      || speakerVolumeCommitPending
    ) {
      speakerVolumeEditingRef.current = false;
      return;
    }

    setSpeakerVolumeCommitPending(true);
    speakerVolumeEditingRef.current = true;
    try {
      const next = await window.bridge.setSpeakerVolume(value);
      setSnapshot(next);
      setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
      await delay(TEST_SPEAKER_VOLUME_SETTLE_MS);
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
    } finally {
      setSpeakerVolumeCommitPending(false);
      speakerVolumeEditingRef.current = false;
    }
  }

  async function commitLightbar(nextColor = lightbarColor, brightness = lightbarBrightnessValue) {
    const color = normalizeHexColor(nextColor);
    const snappedBrightness = snapLightbarBrightness(brightness);
    const shouldPreserveSavedBrightness = Boolean(
      snapshot
      && controllerPowerSavingActive
      && snapshot.settings.lightbarBrightnessPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT
      && snappedBrightness === CONTROLLER_POWER_SAVING_CAP_PERCENT
    );
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !lightbarSupported
      || !snapshot.settings.lightbarEnabled
      || lightbarCommitPending
      || (
        controllerPowerSavingActive
        && snapshot.settings.lightbarBrightnessPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT
        && snappedBrightness === CONTROLLER_POWER_SAVING_CAP_PERCENT
        && color === normalizeHexColor(snapshot.settings.lightbarColor)
      )
      || (
        color === normalizeHexColor(snapshot.settings.lightbarColor)
        && snappedBrightness === snapshot.settings.lightbarBrightnessPercent
      )
    ) {
      lightbarBrightnessEditingRef.current = false;
      return;
    }

    setLightbarCommitPending(true);
    try {
      const persistedBrightness = shouldPreserveSavedBrightness
        ? snapshot.settings.lightbarBrightnessPercent
        : snappedBrightness;
      const next = await window.bridge.setLightbarColor(color, persistedBrightness);
      setSnapshot(next);
      setLightbarBrightnessValue(displayLightbarBrightnessValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setLightbarBrightnessValue(displayLightbarBrightnessValue(next));
    } finally {
      setLightbarCommitPending(false);
      lightbarBrightnessEditingRef.current = false;
    }
  }

  async function commitTriggerEffectIntensity(value = triggerEffectIntensityValue) {
    const snappedValue = snapTriggerEffectIntensity(value);
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !adaptiveTriggersSupported
      || !snapshot.settings.adaptiveTriggersEnabled
      || (controllerPowerSavingActive && snapshot.settings.triggerEffectIntensityPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT && snappedValue === CONTROLLER_POWER_SAVING_CAP_PERCENT)
      || snappedValue === snapshot.settings.triggerEffectIntensityPercent
    ) {
      triggerEffectEditingRef.current = false;
      return;
    }

    try {
      const next = await window.bridge.setTriggerEffectIntensity(snappedValue);
      setSnapshot(next);
      setTriggerEffectIntensityValue(displayTriggerEffectIntensityValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setTriggerEffectIntensityValue(displayTriggerEffectIntensityValue(next));
    } finally {
      triggerEffectEditingRef.current = false;
    }
  }

  function selectLightbarColor(nextColor: string) {
    const color = normalizeHexColor(nextColor);
    setLightbarColor(color);
    void commitLightbar(color, lightbarBrightnessValue);
  }

  function saveCustomLightbarColor(nextColor: string) {
    const color = normalizeHexColor(nextColor);
    setCustomLightbarColor(color);
    setCustomColorDraft(color);
    setLightbarColor(color);
    setShowCustomColorPicker(false);
    setCustomSwatchPrimed(false);
    window.localStorage.setItem('ds5bridge.customLightbarColor', color);
    void commitLightbar(color, lightbarBrightnessValue);
  }

  function previewCustomLightbarColor(nextColor: string) {
    const color = normalizeHexColor(nextColor);
    setCustomColorDraft(color);
    setLightbarColor(color);
    void commitLightbar(color, lightbarBrightnessValue);
  }

  function selectCustomLightbarColor() {
    if (!customLightbarColor) {
      setCustomSwatchPrimed(true);
      if (customSwatchPrimeTimerRef.current !== null) {
        window.clearTimeout(customSwatchPrimeTimerRef.current);
      }
      customSwatchPrimeTimerRef.current = window.setTimeout(() => {
        setCustomSwatchPrimed(false);
        customSwatchPrimeTimerRef.current = null;
      }, 1600);
      return;
    }
    selectLightbarColor(customLightbarColor);
  }

  function openCustomLightbarPicker() {
    const color = customLightbarColor ?? LIGHTBAR_DEFAULT_CUSTOM_COLOR;
    setCustomColorDraft(color);
    setCustomSwatchPrimed(false);
    setShowCustomColorPicker(true);
  }

  function setLightbarPreset(value: number) {
    const brightness = snapLightbarBrightness(capControllerPowerSavingValue(value, snapshot));
    setLightbarBrightnessValue(brightness);
    void commitLightbar(lightbarColor, brightness);
  }

  function setHapticsPreset(value: number) {
    const snappedValue = snapHapticsValue(capControllerPowerSavingValue(value, snapshot), hapticsSliderMax);
    hapticsEditingRef.current = true;
    setHapticsValue(snappedValue);
    void commitHapticsValue(snappedValue);
  }

  function setClassicRumblePreset(value: number) {
    const snappedValue = snapHapticsValue(capControllerPowerSavingValue(value, snapshot), hapticsSliderMax);
    classicRumbleEditingRef.current = true;
    setClassicRumbleValue(snappedValue);
    void commitClassicRumbleValue(snappedValue);
  }

  function setSpeakerPreset(value: number) {
    const snappedValue = snapSpeakerVolume(value);
    speakerVolumeEditingRef.current = true;
    setSpeakerVolumeValue(snappedValue);
    void commitSpeakerVolume(snappedValue);
  }

  function setSpeakerGainLevel(level: number) {
    if (!snapshot) {
      return;
    }
    const value = Math.max(1, Math.min(7, Math.round(level)));
    if (value === snapshot.settings.speakerGainLevel) {
      return;
    }
    void runQuietAction(() => window.bridge.setSpeakerGainLevel(value));
  }

  async function commitMicVolume(value = micVolumeValue) {
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || value === snapshot.settings.micVolumePercent
      || micVolumeCommitPending
    ) {
      micVolumeEditingRef.current = false;
      return;
    }

    setMicVolumeCommitPending(true);
    micVolumeEditingRef.current = true;
    try {
      const next = await window.bridge.setMicVolume(value);
      setSnapshot(next);
      setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
    } finally {
      setMicVolumeCommitPending(false);
      micVolumeEditingRef.current = false;
    }
  }

  function setMicPreset(value: number) {
    const snappedValue = snapMicVolume(value);
    micVolumeEditingRef.current = true;
    setMicVolumeValue(snappedValue);
    void commitMicVolume(snappedValue);
  }

  async function commitAudioBufferLength(value = audioBufferLengthValue) {
    const snappedValue = clampAudioBufferLength(value);
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !audioBufferLengthControlSupported
      || snappedValue === snapshot.settings.hapticsBufferLength
      || audioBufferLengthCommitPending
    ) {
      audioBufferLengthEditingRef.current = false;
      setAudioBufferLengthValue(snappedValue);
      return;
    }

    setAudioBufferLengthCommitPending(true);
    audioBufferLengthEditingRef.current = true;
    try {
      const next = await window.bridge.setHapticsBufferLength(snappedValue);
      setSnapshot(next);
      setAudioBufferLengthValue(clampAudioBufferLength(next.settings.hapticsBufferLength));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setAudioBufferLengthValue(clampAudioBufferLength(next.settings.hapticsBufferLength));
    } finally {
      setAudioBufferLengthCommitPending(false);
      audioBufferLengthEditingRef.current = false;
    }
  }

  async function commitAudioReactiveHapticsConfig(config: Partial<AudioReactiveHapticsConfig>): Promise<BridgeSnapshot | null> {
    if (
      !snapshot
      || snapshot.state !== 'connected'
      || !audioReactiveHapticsSupported
      || !hapticsEnabled
      || audioReactiveHapticsCommitPending
    ) {
      return null;
    }

    setAudioReactiveHapticsCommitPending(true);
    try {
      const next = await window.bridge.setAudioReactiveHapticsConfig(config);
      applySnapshot(next);
      return next;
    } catch {
      const next = await window.bridge.getStatus();
      applySnapshot(next);
      return next;
    } finally {
      setAudioReactiveHapticsCommitPending(false);
    }
  }

  function toggleAudioReactiveHapticsEnabled() {
    if (!snapshot) return;
    void commitAudioReactiveHapticsConfig({
      enabled: !snapshot.settings.audioReactiveHapticsEnabled
    });
  }

  function toggleAudioHapticsFeature() {
    if (!snapshot) return;
    const nextEnabled = !audioReactiveHapticsEnabled;
    // The header switch owns both the feature state and the panel visibility:
    // on -> enable + reveal the panel, off -> disable + collapse it.
    setAudioHapticsOpen(nextEnabled);
    void commitAudioReactiveHapticsConfig({ enabled: nextEnabled });
  }

  function setAudioReactiveHapticsMode(mode: AudioReactiveHapticsMode) {
    if (!snapshot || mode === snapshot.settings.audioReactiveHapticsMode) return;
    void commitAudioReactiveHapticsConfig({ mode });
  }

  function setAudioReactiveHapticsSourceValue(value: string) {
    if (!snapshot || value === audioReactiveHapticsSourceKey) return;
    if (value === 'system-audio') {
      void commitAudioReactiveHapticsConfig({ source: 'system-audio' });
      return;
    }
    const session = audioHapticsSessionByKey.get(value);
    if (!session) {
      return;
    }
    void commitAudioReactiveHapticsConfig({ source: audioHapticsSourceFromSession(session) });
  }

  function setAudioReactiveHapticsBassFocus(bassFocus: AudioReactiveHapticsBassFocus) {
    if (!snapshot || bassFocus === snapshot.settings.audioReactiveHapticsBassFocus) return;
    void commitAudioReactiveHapticsConfig({ bassFocus });
  }

  function setAudioReactiveHapticsResponse(response: AudioReactiveHapticsResponse) {
    if (!snapshot || response === snapshot.settings.audioReactiveHapticsResponse) return;
    void commitAudioReactiveHapticsConfig({ response });
  }

  function setAudioReactiveHapticsAttack(attack: AudioReactiveHapticsAttack) {
    if (!snapshot || attack === snapshot.settings.audioReactiveHapticsAttack) return;
    void commitAudioReactiveHapticsConfig({ attack });
  }

  function setAudioReactiveHapticsRelease(release: AudioReactiveHapticsRelease) {
    if (!snapshot || release === snapshot.settings.audioReactiveHapticsRelease) return;
    void commitAudioReactiveHapticsConfig({ release });
  }

  function setTriggerIntensityPreset(value: number) {
    const snappedValue = snapTriggerEffectIntensity(capControllerPowerSavingValue(value, snapshot));
    setTriggerEffectIntensityValue(snappedValue);
    void commitTriggerEffectIntensity(snappedValue);
  }

  function lightbarColorName(color: string) {
    const normalized = normalizeHexColor(color);
    return LIGHTBAR_COLOR_NAMES[normalized] ?? 'Custom';
  }

  function isPreservingPowerSavingCap(savedValue: number, visibleValue: number): boolean {
    return controllerPowerSavingActive
      && savedValue > CONTROLLER_POWER_SAVING_CAP_PERCENT
      && visibleValue === CONTROLLER_POWER_SAVING_CAP_PERCENT;
  }

  function runFeedbackTest() {
    setTestLocked(true);
    void runAction(showClassicRumbleControl ? 'test-rumble' : 'test', async () => {
      if (snapshot && showClassicRumbleControl) {
        if (
          classicRumbleValue !== snapshot.settings.classicRumbleGainPercent
          && !isPreservingPowerSavingCap(snapshot.settings.classicRumbleGainPercent, classicRumbleValue)
        ) {
          await window.bridge.setClassicRumbleGain(classicRumbleValue);
        }
        return window.bridge.testClassicRumble();
      }
      if (
        snapshot
        && hapticsValue !== snapshot.settings.hapticsGainPercent
        && !isPreservingPowerSavingCap(snapshot.settings.hapticsGainPercent, hapticsValue)
      ) {
        await window.bridge.setHapticsGain(hapticsValue);
      }
      return window.bridge.testHaptics();
    }).finally(() => {
      window.setTimeout(() => setTestLocked(false), TEST_HAPTICS_LOCK_MS);
    });
  }

  function runTestSpeaker() {
    setSpeakerTestLocked(true);
    setPendingAction('speaker');
    setSpeakerTestError(null);
    void (async () => {
      try {
        let volumeChanged = false;
        if (snapshot && speakerVolumeSupported && speakerVolumeValue !== snapshot.settings.speakerVolumePercent) {
          speakerVolumeEditingRef.current = true;
          const next = await window.bridge.setSpeakerVolume(speakerVolumeValue);
          setSnapshot(next);
          setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
          speakerVolumeEditingRef.current = false;
          volumeChanged = true;
        }
        if (volumeChanged) {
          await delay(TEST_SPEAKER_VOLUME_SETTLE_MS);
        }
        const next = await window.bridge.testSpeaker();
        setSnapshot(next);
        setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
        setSpeakerOutputAvailable(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE;
        setSpeakerTestError(message);
        setSpeakerOutputAvailable(true);
        const next = await window.bridge.getStatus();
        setSnapshot(next);
        setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
        speakerVolumeEditingRef.current = false;
      } finally {
        speakerVolumeEditingRef.current = false;
        setPendingAction(null);
        window.setTimeout(() => setSpeakerTestLocked(false), TEST_SPEAKER_LOCK_MS);
      }
    })();
  }

  function runTestMic() {
    setMicTestLocked(true);
    setPendingAction('mic-test');
    setMicTestError(null);
    void (async () => {
      try {
        if (snapshot && micVolumeValue !== snapshot.settings.micVolumePercent) {
          micVolumeEditingRef.current = true;
          const next = await window.bridge.setMicVolume(micVolumeValue);
          setSnapshot(next);
          setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
          micVolumeEditingRef.current = false;
        }
        await playMicLiveListen(TEST_MIC_LISTEN_MS);
      } catch (error) {
        const message = error instanceof Error ? error.message : BRIDGE_MIC_ENDPOINT_UNAVAILABLE;
        setMicTestError(message);
        const next = await window.bridge.getStatus();
        setSnapshot(next);
        setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
      } finally {
        micVolumeEditingRef.current = false;
        setPendingAction(null);
        setMicTestLocked(false);
      }
    })();
  }

  function resetAdaptiveTriggers() {
    void runAction('triggers-reset', () => window.bridge.resetAdaptiveTriggers());
  }

  function selectControllerProfile(profileId: string) {
    void runAction('controller-profile', () => window.bridge.selectControllerProfile(profileId));
  }

  function renameControllerProfile() {
    // Game-owned profiles take their name from the game; rename the game instead.
    if (!selectedControllerProfile || selectedControllerProfileIsDefault || selectedControllerProfileIsGameOwned) {
      return;
    }
    setControllerProfileNameDraft(selectedControllerProfile.name);
    setControllerProfileDialogMode('rename');
  }

  function saveControllerProfile() {
    setControllerProfileNameDraft(`Custom Profile ${snapshot?.settings.controllerProfiles.length ?? 1}`);
    setControllerProfileDialogMode('save');
  }

  function deleteControllerProfile() {
    if (!selectedControllerProfile || !canDeleteControllerProfile) {
      return;
    }
    setControllerProfileDialogMode('delete');
  }

  function closeControllerProfileDialog() {
    setControllerProfileDialogMode(null);
    setControllerProfileNameDraft('');
  }

  function submitControllerProfileDialog() {
    if (!selectedControllerProfile && controllerProfileDialogMode !== 'save') {
      return;
    }
    if (controllerProfileDialogMode === 'save') {
      const nextName = controllerProfileNameDraft.trim();
      if (!nextName) {
        return;
      }
      closeControllerProfileDialog();
      void runAction('controller-save-profile', () => window.bridge.saveControllerProfile(nextName));
      return;
    }
    if (controllerProfileDialogMode === 'rename' && selectedControllerProfile && !selectedControllerProfileIsDefault) {
      const nextName = controllerProfileNameDraft.trim();
      if (!nextName || nextName === selectedControllerProfile.name) {
        closeControllerProfileDialog();
        return;
      }
      closeControllerProfileDialog();
      void runAction('controller-rename-profile', () => (
        window.bridge.renameControllerProfile(selectedControllerProfile.id, nextName)
      ));
      return;
    }
    if (controllerProfileDialogMode === 'delete' && selectedControllerProfile && canDeleteControllerProfile) {
      closeControllerProfileDialog();
      void runAction('controller-delete-profile', () => (
        window.bridge.deleteControllerProfile(selectedControllerProfile.id)
      ));
    }
  }

  function selectButtonRemappingProfile(profileId: string) {
    void runAction('remap-profile', () => window.bridge.selectButtonRemappingProfile(profileId));
  }

  function setButtonRemap(buttonId: RemapButtonId, targetId: RemapButtonId) {
    setRemapDraft((draft) => ({ ...draft, [buttonId]: targetId }));
    void runAction(`remap-${buttonId}`, () => window.bridge.setButtonRemap(buttonId, targetId));
  }

  function restoreButtonRemappingDefaults() {
    void runAction('remap-restore', () => window.bridge.restoreButtonRemappingDefaults());
  }

  function renameButtonRemappingProfile() {
    if (!selectedRemapProfile || selectedRemapProfileIsDefault || selectedRemapProfileIsGameOwned) {
      return;
    }
    setRemapProfileNameDraft(selectedRemapProfile.name);
    setRemapProfileDialogMode('rename');
  }

  function saveButtonRemappingProfile() {
    setRemapProfileNameDraft(`Custom Profile ${snapshot?.settings.buttonRemappingProfiles.length ?? 1}`);
    setRemapProfileDialogMode('save');
  }

  function deleteButtonRemappingProfile() {
    // Game-owned mappings are deleted with their game profile, not from here.
    if (!selectedRemapProfile || selectedRemapProfileIsDefault || selectedRemapProfileIsGameOwned) {
      return;
    }
    setRemapProfileDialogMode('delete');
  }

  function closeRemapProfileDialog() {
    setRemapProfileDialogMode(null);
    setRemapProfileNameDraft('');
  }

  function submitRemapProfileDialog() {
    if (!selectedRemapProfile && remapProfileDialogMode !== 'save') {
      return;
    }
    if (remapProfileDialogMode === 'save') {
      const nextName = remapProfileNameDraft.trim();
      if (!nextName) {
        return;
      }
      closeRemapProfileDialog();
      void runAction('remap-save-profile', () => window.bridge.saveButtonRemappingProfile(nextName));
      return;
    }
    if (remapProfileDialogMode === 'rename' && selectedRemapProfile && !selectedRemapProfileIsDefault) {
      const nextName = remapProfileNameDraft.trim();
      if (!nextName || nextName === selectedRemapProfile.name) {
        closeRemapProfileDialog();
        return;
      }
      closeRemapProfileDialog();
      void runAction('remap-rename-profile', () => (
        window.bridge.renameButtonRemappingProfile(selectedRemapProfile.id, nextName)
      ));
      return;
    }
    if (remapProfileDialogMode === 'delete' && selectedRemapProfile && !selectedRemapProfileIsDefault) {
      closeRemapProfileDialog();
      void runAction('remap-delete-profile', () => window.bridge.deleteButtonRemappingProfile(selectedRemapProfile.id));
    }
  }

  function commitChordConfiguration(
    nextFunctions: ChordFunction[],
    nextAssignments: ChordAssignment[],
    _action = 'chords-save'
  ) {
    void runQuietAction(() => window.bridge.setChordConfiguration(nextFunctions, nextAssignments));
  }

  function createChordFunction() {
    const id = `function-${Date.now().toString(36)}`;
    const nextDraft: ChordFunctionDraft = {
      ...EMPTY_CHORD_FUNCTION_DRAFT,
      id,
      name: `Function ${chordFunctions.length + 1}`
    };
    const nextFunction = chordFunctionFromDraft(nextDraft);
    setSelectedChordFunctionId(id);
    setChordFunctionDraft(chordFunctionToDraft(nextFunction));
    commitChordConfiguration([...chordFunctions, nextFunction], chordAssignments, 'chords-create-function');
  }

  function commitChordFunctionDraft(nextDraft = chordFunctionDraft) {
    const nextFunction = chordFunctionFromDraft(nextDraft);
    const exists = chordFunctions.some((func) => func.id === nextFunction.id);
    const nextFunctions = exists
      ? chordFunctions.map((func) => (func.id === nextFunction.id ? nextFunction : func))
      : [...chordFunctions, nextFunction];
    setSelectedChordFunctionId(nextFunction.id);
    commitChordConfiguration(nextFunctions, chordAssignments, `chords-function-${nextFunction.id}`);
  }

  function setChordFunctionKeyboardKey(keyboardKey: string) {
    const nextDraft = { ...chordFunctionDraft, keyboardKey };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function toggleChordFunctionKeyboardModifier(modifier: ChordKeyboardModifier) {
    const enabled = chordFunctionDraft.keyboardModifiers.includes(modifier);
    if (!enabled && chordFunctionDraft.keyboardModifiers.length >= MAX_KEYBOARD_FUNCTION_KEYS - 1) {
      return;
    }
    const keyboardModifiers = enabled
      ? chordFunctionDraft.keyboardModifiers.filter((candidate) => candidate !== modifier)
      : CHORD_KEYBOARD_MODIFIER_OPTIONS
        .map(([, candidate]) => candidate)
        .filter((candidate) => (
          candidate === modifier || chordFunctionDraft.keyboardModifiers.includes(candidate)
        ));
    const nextDraft = { ...chordFunctionDraft, keyboardModifiers };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function setChordFunctionControllerAction(action: ChordControllerSettingAction) {
    const nextDraft = { ...chordFunctionDraft, controllerAction: action };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function setChordFunctionControllerStepPercent(stepPercent: number) {
    const nextDraft = {
      ...chordFunctionDraft,
      controllerStepPercent: normalizeChordControllerSettingStepPercent(stepPercent)
    };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function renderChordFunctionSummary(func: ChordFunction) {
    const notchTarget = func.type === 'controller-setting'
      ? chordNotchTargetForAction(func.action)
      : null;
    const detailLabel = func.type === 'keyboard'
      ? 'Keys'
      : notchTarget
        ? 'Adjustment'
        : 'Action';
    const detailValue = func.type === 'controller-setting' && notchTarget
      ? chordControllerSettingAdjustmentText(func.action)
      : chordFunctionSummary(func);

    return (
      <div className="chords-function-summary chords-function-summary-grouped">
        <div className="chords-function-summary-header">
          <span>Summary</span>
          {func.type === 'controller-setting' && notchTarget ? (
            <div className="chords-function-summary-options">
              <label className="chords-step-selector">
                <span>Step</span>
                <input
                  type="number"
                  min={CHORD_CONTROLLER_SETTING_STEP_MIN}
                  max={CHORD_CONTROLLER_SETTING_STEP_MAX}
                  step={1}
                  value={chordFunctionDraft.id === func.id ? chordFunctionDraft.controllerStepPercent : func.stepPercent}
                  disabled={pendingAction !== null}
                  aria-label={`${notchTarget.target.label} step percent`}
                  onChange={(event) => {
                    const nextValue = normalizeChordControllerSettingStepPercent(event.target.value);
                    setChordFunctionDraft((draft) => ({ ...draft, controllerStepPercent: nextValue }));
                  }}
                  onBlur={(event) => {
                    setChordFunctionControllerStepPercent(Number(event.currentTarget.value));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                />
                <small>%</small>
              </label>
              <div className="dual-selector chords-notch-direction-selector" role="group" aria-label={`${notchTarget.target.label} direction`}>
                <button
                  type="button"
                  className={notchTarget.direction === 'down' ? 'active' : ''}
                  title={`Decrease ${notchTarget.target.label}`}
                  aria-label={`Decrease ${notchTarget.target.label}`}
                  disabled={pendingAction !== null}
                  onClick={() => setChordFunctionControllerAction(notchTarget.target.downAction)}
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  className={notchTarget.direction === 'up' ? 'active' : ''}
                  title={`Increase ${notchTarget.target.label}`}
                  aria-label={`Increase ${notchTarget.target.label}`}
                  disabled={pendingAction !== null}
                  onClick={() => setChordFunctionControllerAction(notchTarget.target.upAction)}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="chords-function-summary-detail">
          <div className="chords-function-summary-detail-row">
            <span>Type</span>
            <strong>{chordFunctionTypeLabel(func.type)}</strong>
          </div>
          <div className="chords-function-summary-detail-row">
            <span>{detailLabel}</span>
            <strong>
              {detailValue}
              {func.type === 'controller-setting' && notchTarget ? (
                <em> — {func.stepPercent}% step</em>
              ) : null}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  function openChordFunctionDialog(mode: ChordFunctionDialogMode) {
    if (!selectedChordFunction) {
      return;
    }
    setChordFunctionNameDraft(selectedChordFunction.name);
    setChordFunctionDialog({ mode, functionId: selectedChordFunction.id });
  }

  function closeChordFunctionDialog() {
    setChordFunctionDialog(null);
    setChordFunctionNameDraft('');
  }

  function deleteChordFunction(functionId: string) {
    const nextFunctions = chordFunctions.filter((func) => func.id !== functionId);
    const nextAssignments = chordAssignments.filter((assignment) => assignment.functionId !== functionId);
    const nextSelected = nextFunctions[0] ?? null;
    setSelectedChordFunctionId(nextSelected?.id ?? '');
    setChordFunctionDraft(chordFunctionToDraft(nextSelected));
    setChordAssignmentDraftRows((rows) => rows.filter((row) => row.functionId !== functionId));
    commitChordConfiguration(nextFunctions, nextAssignments, `chords-delete-function-${functionId}`);
  }

  function submitChordFunctionDialog() {
    if (!chordFunctionDialog) {
      return;
    }
    const current = chordFunctions.find((func) => func.id === chordFunctionDialog.functionId);
    if (!current) {
      closeChordFunctionDialog();
      return;
    }
    if (chordFunctionDialog.mode === 'delete') {
      deleteChordFunction(current.id);
      closeChordFunctionDialog();
      return;
    }
    const nextName = chordFunctionNameDraft.trim().slice(0, MAX_CHORD_FUNCTION_NAME_LENGTH);
    if (!nextName || nextName === current.name) {
      closeChordFunctionDialog();
      return;
    }
    const nextFunction = { ...current, name: nextName };
    const nextFunctions = chordFunctions.map((func) => (func.id === current.id ? nextFunction : func));
    setSelectedChordFunctionId(current.id);
    setChordFunctionDraft(chordFunctionToDraft(nextFunction));
    commitChordConfiguration(nextFunctions, chordAssignments, `chords-rename-function-${current.id}`);
    closeChordFunctionDialog();
  }

  function commitChordAssignment(nextAssignment: ChordAssignment, replaceAssignmentId?: string) {
    const replacingExisting = replaceAssignmentId
      ? chordAssignments.some((assignment) => assignment.id === replaceAssignmentId)
      : false;
    if (!replacingExisting && chordAssignments.length >= MAX_CHORD_ASSIGNMENTS) {
      return;
    }
    const nextAssignments = replacingExisting
      ? chordAssignments.map((assignment) => (
        assignment.id === replaceAssignmentId ? nextAssignment : assignment
      ))
      : [...chordAssignments, nextAssignment];
    commitChordConfiguration(chordFunctions, nextAssignments, `chords-assignment-${nextAssignment.id}`);
  }

  function addChordAssignmentDraft() {
    if (!canAddChordDraft) {
      return;
    }
    setChordAssignmentDraftRows((rows) => [
      ...rows,
      {
        id: `draft-${Date.now().toString(36)}-${rows.length}`,
        starter: chordStarterOptions[0]?.[1] ?? 'ps',
        button: null,
        functionId: defaultChordFunctionId
      }
    ]);
  }

  function commitChordAssignmentDraft(row: ChordAssignmentDraftRow, button: ChordAssignableButtonId) {
    if (!row.functionId || !isChordBindingAllowed(row.starter, button)) {
      return;
    }
    const nextAssignment: ChordAssignment = {
      id: createChordAssignmentId(row.starter, button),
      kind: 'chord',
      starter: row.starter,
      button,
      functionId: row.functionId
    };
    setChordAssignmentDraftRows((rows) => rows.filter((draft) => draft.id !== row.id));
    commitChordAssignment(nextAssignment);
  }

  function updateChordAssignmentDraftStarter(rowId: string, starter: ChordStarterId) {
    setChordAssignmentDraftRows((rows) => rows.map((row) => (
      row.id === rowId
        ? {
          ...row,
          starter,
          button: row.button && isChordBindingAllowed(starter, row.button) ? row.button : null
        }
        : row
    )));
  }

  function updateChordAssignmentDraftButton(rowId: string, button: ChordButtonSelectValue) {
    if (button === CHORD_UNASSIGNED_BUTTON) {
      return;
    }
    const row = chordAssignmentDraftRows.find((draft) => draft.id === rowId);
    if (row) {
      commitChordAssignmentDraft(row, button);
    }
  }

  function updateChordAssignmentDraftFunction(rowId: string, functionId: string) {
    setChordAssignmentDraftRows((rows) => rows.map((row) => (
      row.id === rowId ? { ...row, functionId } : row
    )));
  }

  function deleteChordAssignmentDraft(rowId: string) {
    setChordAssignmentDraftRows((rows) => rows.filter((row) => row.id !== rowId));
  }

  function updateChordAssignmentStarter(assignmentId: string, starter: ChordStarterId) {
    const current = chordAssignments.find((assignment) => assignment.id === assignmentId);
    if (!current) {
      return;
    }
    const button = isChordBindingAllowed(starter, current.button)
      ? current.button
      : firstAllowedChordButton(starter);
    if (!button) {
      return;
    }
    commitChordAssignment({
      ...current,
      starter,
      button
    }, assignmentId);
  }

  function updateChordAssignmentButton(assignmentId: string, button: ChordButtonSelectValue) {
    if (button === CHORD_UNASSIGNED_BUTTON) {
      return;
    }
    const current = chordAssignments.find((assignment) => assignment.id === assignmentId);
    if (!current || !isChordBindingAllowed(current.starter, button)) {
      return;
    }
    commitChordAssignment({
      ...current,
      button
    }, assignmentId);
  }

  function setChordAssignmentFunction(assignmentId: string, functionId: string) {
    const current = chordAssignments.find((assignment) => assignment.id === assignmentId);
    if (!current) {
      return;
    }
    commitChordAssignment({
      ...current,
      functionId
    }, assignmentId);
  }

  function deleteChordAssignment(assignmentId: string) {
    const nextAssignments = chordAssignments.filter((assignment) => assignment.id !== assignmentId);
    commitChordConfiguration(chordFunctions, nextAssignments, `chords-delete-assignment-${assignmentId}`);
  }

  function updateChordAssignmentScrollbar() {
    const list = chordAssignmentListRef.current;
    if (!list) {
      return;
    }
    const maxScroll = list.scrollHeight - list.clientHeight;
    if (maxScroll <= 1) {
      setChordAssignmentScrollbar((current) => (
        current.visible ? { visible: false, top: 0, height: 0 } : current
      ));
      return;
    }
    const trackHeight = list.clientHeight;
    const height = Math.max(30, Math.round((list.clientHeight / list.scrollHeight) * trackHeight));
    const top = Math.round((list.scrollTop / maxScroll) * (trackHeight - height));
    setChordAssignmentScrollbar((current) => (
      current.visible && current.top === top && current.height === height
        ? current
        : { visible: true, top, height }
    ));
  }

  function startChordAssignmentScrollbarDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const list = chordAssignmentListRef.current;
    if (!list || !chordAssignmentScrollbar.visible || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startScrollTop = list.scrollTop;
    const maxScroll = list.scrollHeight - list.clientHeight;
    const thumbTravel = list.clientHeight - chordAssignmentScrollbar.height;
    const move = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      list.scrollTop = startScrollTop + ((moveEvent.clientY - startY) / thumbTravel) * maxScroll;
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  function reorderChordAssignment(sourceId: string, targetId: string, placement: 'before' | 'after') {
    if (sourceId === targetId) {
      return;
    }
    const sourceIndex = chordAssignments.findIndex((assignment) => assignment.id === sourceId);
    if (sourceIndex === -1 || !chordAssignments.some((assignment) => assignment.id === targetId)) {
      return;
    }
    const nextAssignments = [...chordAssignments];
    const [moved] = nextAssignments.splice(sourceIndex, 1);
    if (!moved) {
      return;
    }
    const targetIndex = nextAssignments.findIndex((assignment) => assignment.id === targetId);
    if (targetIndex === -1) {
      return;
    }
    nextAssignments.splice(placement === 'after' ? targetIndex + 1 : targetIndex, 0, moved);
    commitChordConfiguration(chordFunctions, nextAssignments, `chords-reorder-assignment-${sourceId}`);
  }

  function setChordAssignmentDragDropHint(nextHint: ChordAssignmentDropHint | null) {
    const session = chordAssignmentDragRef.current;
    if (session) {
      session.dropHint = nextHint;
    }
    setChordAssignmentDropHint((current) => (
      current?.targetId === nextHint?.targetId && current?.placement === nextHint?.placement
        ? current
        : nextHint
    ));
  }

  function createChordAssignmentDragOverlay(sourceRow: HTMLDivElement): HTMLElement {
    const overlay = sourceRow.cloneNode(true) as HTMLElement;
    const rect = sourceRow.getBoundingClientRect();
    overlay.classList.add('chords-assignment-drag-overlay');
    overlay.classList.remove('dragging', 'drop-before', 'drop-after');
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
    (sourceRow.closest<HTMLElement>('.shell') ?? document.body).appendChild(overlay);
    return overlay;
  }

  function moveChordAssignmentDragOverlay(session: ChordAssignmentDragSession, clientX: number, clientY: number) {
    if (!session.overlay) {
      return;
    }
    session.overlay.style.transform = `translate3d(${clientX - session.offsetX}px, ${clientY - session.offsetY}px, 0) scale(1.01)`;
  }

  function updateChordAssignmentDropTarget(sourceId: string, _clientX: number, clientY: number) {
    const list = chordAssignmentListRef.current;
    if (!list) {
      setChordAssignmentDragDropHint(null);
      return;
    }
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>('.chords-assignment-row[data-assignment-id]:not(.draft)')
    ).filter((row) => row.dataset.assignmentId !== sourceId);
    if (rows.length === 0) {
      setChordAssignmentDragDropHint(null);
      return;
    }
    let nearest: { targetId: string; placement: 'before' | 'after'; distance: number } | null = null;
    for (const row of rows) {
      const targetId = row.dataset.assignmentId;
      if (!targetId) {
        continue;
      }
      const rect = row.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const placement = clientY > centerY ? 'after' : 'before';
      const edgeY = placement === 'after' ? rect.bottom : rect.top;
      const distance = Math.abs(clientY - edgeY);
      if (!nearest || distance < nearest.distance) {
        nearest = { targetId, placement, distance };
      }
    }
    setChordAssignmentDragDropHint(nearest && {
      targetId: nearest.targetId,
      placement: nearest.placement
    });
  }

  function finishChordAssignmentPointerDrag(cancelled = false) {
    const session = chordAssignmentDragRef.current;
    if (!session) {
      return;
    }
    session.cleanup();
    session.overlay?.remove();
    document.body.classList.remove('chords-assignment-pointer-dragging');
    chordAssignmentDragRef.current = null;
    setDraggedChordAssignmentId(null);
    setChordAssignmentDropHint(null);
    if (!cancelled && session.active && session.dropHint) {
      reorderChordAssignment(session.id, session.dropHint.targetId, session.dropHint.placement);
    }
    if (session.active) {
      window.addEventListener('click', (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      }, { capture: true, once: true });
    }
  }

  function startChordAssignmentPointerDrag(event: ReactPointerEvent<HTMLDivElement>, assignmentId: string) {
    if (pendingAction !== null || event.button !== 0 || chordAssignmentDragRef.current) {
      return;
    }
    const sourceRow = event.currentTarget;
    const rect = sourceRow.getBoundingClientRect();
    const session: ChordAssignmentDragSession = {
      active: false,
      id: assignmentId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      overlay: null,
      startX: event.clientX,
      startY: event.clientY,
      cleanup: () => undefined,
      dropHint: null
    };
    const activate = (clientX: number, clientY: number) => {
      if (session.active) {
        return;
      }
      session.active = true;
      session.overlay = createChordAssignmentDragOverlay(sourceRow);
      document.body.classList.add('chords-assignment-pointer-dragging');
      setDraggedChordAssignmentId(assignmentId);
      moveChordAssignmentDragOverlay(session, clientX, clientY);
    };
    const move = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - session.startX;
      const deltaY = moveEvent.clientY - session.startY;
      if (!session.active && Math.hypot(deltaX, deltaY) < 5) {
        return;
      }
      activate(moveEvent.clientX, moveEvent.clientY);
      moveEvent.preventDefault();
      moveChordAssignmentDragOverlay(session, moveEvent.clientX, moveEvent.clientY);
      updateChordAssignmentDropTarget(assignmentId, moveEvent.clientX, moveEvent.clientY);
    };
    const end = () => finishChordAssignmentPointerDrag(false);
    const cancel = () => finishChordAssignmentPointerDrag(true);
    const keyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') {
        finishChordAssignmentPointerDrag(true);
      }
    };
    session.cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', keyDown);
    };
    chordAssignmentDragRef.current = session;
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', keyDown);
  }

  function toggleHapticsEnabled() {
    if (!snapshot) return;
    void runAction('haptics-enabled', () => window.bridge.setHapticsEnabled(!snapshot.settings.hapticsEnabled));
  }

  function toggleClassicRumbleEnabled() {
    if (!snapshot) return;
    void runAction('classic-rumble-enabled', () => (
      window.bridge.setClassicRumbleEnabled(!snapshot.settings.classicRumbleEnabled)
    ));
  }

  function toggleClassicRumbleV1Enabled() {
    if (!snapshot || classicRumbleV1CommitPending) return;

    setClassicRumbleV1CommitPending(true);
    void (async () => {
      try {
        const next = await window.bridge.setClassicRumbleV1Enabled(!snapshot.settings.classicRumbleV1Enabled);
        setSnapshot(next);
      } catch {
        const next = await window.bridge.getStatus();
        setSnapshot(next);
      } finally {
        setClassicRumbleV1CommitPending(false);
      }
    })();
  }

  function toggleFeedbackBoostEnabled() {
    if (!snapshot || feedbackBoostCommitPending) return;

    setFeedbackBoostCommitPending(true);
    void (async () => {
      try {
        const next = await window.bridge.setFeedbackBoostEnabled(!snapshot.settings.feedbackBoostEnabled);
        setSnapshot(next);
        setHapticsValue(displayHapticsValue(next));
        setClassicRumbleValue(displayClassicRumbleValue(next));
      } catch {
        const next = await window.bridge.getStatus();
        setSnapshot(next);
        setHapticsValue(displayHapticsValue(next));
        setClassicRumbleValue(displayClassicRumbleValue(next));
      } finally {
        setFeedbackBoostCommitPending(false);
      }
    })();
  }

  function toggleSpeakerEnabled() {
    if (!snapshot) return;
    void runAction('speaker-enabled', () => window.bridge.setSpeakerEnabled(!snapshot.settings.speakerEnabled));
  }

  function openDeviceCleanupConfirm() {
    setDeviceCleanupMessage(null);
    setDeviceCleanupError(null);
    setDeviceCleanupConfirmVisible(true);
  }

  function closeDeviceCleanupConfirm() {
    if (pendingAction === 'device-cleanup') {
      return;
    }
    setDeviceCleanupConfirmVisible(false);
  }

  async function runWindowsDeviceCleanup() {
    if (!snapshot || pendingAction) {
      return;
    }
    setDeviceCleanupMessage(null);
    if (controllerConnected) {
      setDeviceCleanupError('Disconnect the controller from the bridge before running emergency repair.');
      return;
    }

    setPendingAction('device-cleanup');
    setDeviceCleanupError(null);
    try {
      const result = await window.bridge.repairWindowsDeviceCache();
      setDeviceCleanupMessage(result.message);
    } catch (error) {
      setDeviceCleanupError(error instanceof Error ? error.message : 'Emergency device repair could not run.');
    } finally {
      try {
        applySnapshot(await window.bridge.getStatus());
      } catch {
        // Keep the existing snapshot if status refresh fails after the repair process.
      }
      setPendingAction(null);
    }
  }


  function toggleAudioEnabled() {
    if (!snapshot) return;
    const enabled = !(snapshot.settings.speakerEnabled || snapshot.settings.duplexMicEnabled);
    void runAction('audio-enabled', async () => {
      let next = snapshot;
      if (next.settings.speakerEnabled !== enabled) {
        next = await window.bridge.setSpeakerEnabled(enabled);
      }
      if (!enabled && next.settings.duplexMicEnabled) {
        next = await window.bridge.setDuplexMicEnabled(false);
      }
      return next;
    });
  }

  function toggleDuplexMicEnabled() {
    if (!snapshot) return;
    const next = VDS_AVAILABLE ? !microphoneOn : !snapshot.settings.duplexMicEnabled;
    void runAction('duplex-mic-enabled', () => window.bridge.setDuplexMicEnabled(next));
  }

  function toggleMicMute() {
    if (!snapshot) return;
    void runAction('mic-mute', () => window.bridge.setMicMute(!snapshot.settings.micMuted));
  }

  function toggleAdaptiveTriggersEnabled() {
    if (!snapshot) return;
    void runAction('triggers-enabled', () => (
      window.bridge.setAdaptiveTriggersEnabled(!snapshot.settings.adaptiveTriggersEnabled)
    ));
  }

  function clearTriggerProfileDraftPreview() {
    if (!triggerProfilePreviewArmedRef.current) return;
    triggerProfilePreviewArmedRef.current = false;
    void window.bridge.previewTriggerProfileDraft(null);
  }

  function loadTriggerProfileDraft(profile: TriggerProfile) {
    clearTriggerProfileDraftPreview();
    setSelectedTriggerProfileId(profile.id);
    setTriggerProfileDraft(profile);
    setTriggerProfileEditingState(0);
    setTriggerProfileProcessNamesInput(profile.match.processNames.join(', '));
    setTriggerProfileModifiersOpen({ l2: false, r2: false });
  }

  async function refreshTriggerProfiles(preferredId?: string, excludeId?: string) {
    const backendProfiles = await window.bridge.listTriggerProfiles();
    const profiles = mergeTriggerProfiles(triggerProfiles, backendProfiles, excludeId ? [excludeId] : []);
    setTriggerProfiles(profiles);
    const preferred = preferredId ? profiles.find((profile) => profile.id === preferredId) : undefined;
    const next = preferred ?? profiles.find((profile) => profile.id === selectedTriggerProfileId) ?? profiles[0];
    if (next) {
      loadTriggerProfileDraft(next);
    } else {
      clearTriggerProfileDraftPreview();
      setSelectedTriggerProfileId(null);
      setTriggerProfileDraft(null);
      setTriggerProfileProcessNamesInput('');
    }
    return profiles;
  }

  // Picking a profile by hand is a request to use it, so it pins the profile and auto matching
  // turns off. Without the pin the engine keeps driving whatever a running game matched -- and a
  // profile with no processNames, like Showcase, could never become active at all.
  function selectTriggerProfile(id: string) {
    const profile = triggerProfiles.find((entry) => entry.id === id);
    if (!profile) return;
    loadTriggerProfileDraft(profile);
    void pinSelectedTriggerProfile(profile.id);
  }

  function createTriggerProfile() {
    const base = createDefaultProfile();
    const name = 'New Profile';
    const id = makeProvisionalTriggerProfileId();
    const profile: TriggerProfile = {
      ...base,
      id,
      name,
      updatedAtMs: Date.now()
    };
    setTriggerProfiles((profiles) => [...profiles, profile]);
    loadTriggerProfileDraft(profile);
  }

  function duplicateTriggerProfile() {
    if (!triggerProfileDraft) return;
    const id = makeProvisionalTriggerProfileId();
    const profile: TriggerProfile = {
      ...triggerProfileDraft,
      id,
      name: `${triggerProfileDraft.name} Copy`,
      updatedAtMs: Date.now()
    };
    setTriggerProfiles((profiles) => [...profiles, profile]);
    loadTriggerProfileDraft(profile);
  }

  function openTriggerProfileDeleteConfirm(profile: TriggerProfile) {
    setTriggerProfileDeleteConfirm({ id: profile.id, name: profile.name });
  }

  async function confirmDeleteTriggerProfile() {
    if (!triggerProfileDeleteConfirm) return;
    const deletedId = triggerProfileDeleteConfirm.id;
    const target = triggerProfiles.find((profile) => profile.id === deletedId);
    // A game's trigger profile is only one facet of its Game Profile (settings,
    // artwork, detection ride on the same entry). Deleting the triggers strips
    // the effects and library linkage but keeps the game itself.
    if (target?.meta?.game) {
      await window.bridge.saveTriggerProfile({
        ...target,
        triggers: {
          l2: { base: null, modifiers: [] },
          r2: { base: null, modifiers: [] }
        },
        meta: { game: target.meta.game },
        updatedAtMs: Date.now()
      });
      setTriggerProfileDeleteConfirm(null);
      await refreshTriggerProfiles(deletedId);
      showTriggerProfileTransferStatus(
        'good',
        `Removed "${triggerProfileDeleteConfirm.name}"'s trigger effects — the game profile is kept`
      );
      return;
    }
    await window.bridge.deleteTriggerProfile(deletedId);
    setTriggerProfileDeleteConfirm(null);
    await refreshTriggerProfiles(undefined, deletedId);
  }

  // Re-downloads the library profile and overwrites this one in place, discarding local edits.
  async function confirmResetTriggerProfile() {
    if (!triggerProfileResetConfirm) return;
    const { id, name } = triggerProfileResetConfirm;
    setTriggerProfileResetting(true);
    try {
      const result = await window.bridge.resetLibraryProfile(id);
      if (!result.ok) {
        showTriggerProfileTransferStatus('warn', `Couldn't reset "${name}" — ${result.error}`);
        return;
      }
      setTriggerProfileResetConfirm(null);
      const profiles = await refreshTriggerProfiles(id);
      const match = profiles.find((profile) => profile.id === id);
      if (match) loadTriggerProfileDraft(match);
      showTriggerProfileTransferStatus('good', `Reset "${name}" to its library defaults`);
    } catch (err) {
      showTriggerProfileTransferStatus(
        'warn',
        `Couldn't reset "${name}" — ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setTriggerProfileResetting(false);
    }
  }

  async function saveTriggerProfileDraft() {
    if (!triggerProfileDraft) return;
    const processNames = parseProcessNamesInput(triggerProfileProcessNamesInput);
    const previousId = triggerProfileDraft.id;
    const isProvisional = isProvisionalTriggerProfileId(previousId);
    const id = isProvisional
      ? uniqueTriggerProfileId(
          triggerProfileDraft.name,
          triggerProfiles.filter((profile) => profile.id !== previousId).map((profile) => profile.id)
        )
      : previousId;
    const profile: TriggerProfile = sanitizeDraftStates({
      ...triggerProfileDraft,
      id,
      match: { ...triggerProfileDraft.match, processNames },
      updatedAtMs: Date.now()
    });
    const saved = await window.bridge.saveTriggerProfile(profile);
    await refreshTriggerProfiles(saved.id, isProvisional ? previousId : undefined);
  }

  function showTriggerProfileTransferStatus(
    tone: string,
    message: string,
    failures?: Array<{ file: string; error: string }>
  ) {
    if (triggerProfileTransferStatusTimeout.current) {
      clearTimeout(triggerProfileTransferStatusTimeout.current);
    }
    setTriggerProfileTransferStatus({ tone, message, failures });
    triggerProfileTransferStatusTimeout.current = setTimeout(() => {
      setTriggerProfileTransferStatus(null);
      triggerProfileTransferStatusTimeout.current = null;
    }, failures && failures.length > 0 ? 12000 : 5000);
  }

  async function exportTriggerProfileDraft() {
    if (!triggerProfileDraft) return;
    if (isProvisionalTriggerProfileId(triggerProfileDraft.id)) {
      showTriggerProfileTransferStatus('warn', 'Save the profile before exporting');
      return;
    }
    const result = await window.bridge.exportTriggerProfile(triggerProfileDraft.id);
    if (result.saved) {
      showTriggerProfileTransferStatus('good', `Exported "${triggerProfileDraft.name}"`);
    }
  }

  async function importTriggerProfilesFromDisk() {
    const results = await window.bridge.importTriggerProfiles();
    if (results.length === 0) return;
    const imported = results.filter((entry) => entry.ok);
    const failures = results
      .filter((entry) => !entry.ok)
      .map((entry) => ({
        file: entry.file.split(/[\\/]/).pop() ?? entry.file,
        error: entry.error ?? 'Unknown error'
      }));
    const profiles = await refreshTriggerProfiles();
    const firstImportedName = imported[0]?.name;
    if (firstImportedName) {
      const match = profiles.find((profile) => profile.name === firstImportedName);
      if (match) loadTriggerProfileDraft(match);
    }
    if (imported.length === 0) {
      showTriggerProfileTransferStatus(
        'bad',
        `Import failed for ${failures.length} file${failures.length === 1 ? '' : 's'}`,
        failures
      );
    } else {
      const base = `Imported ${imported.length} profile${imported.length === 1 ? '' : 's'}`;
      showTriggerProfileTransferStatus(
        failures.length > 0 ? 'warn' : 'good',
        failures.length > 0 ? `${base} (${failures.length} failed)` : base,
        failures.length > 0 ? failures : undefined
      );
    }
  }

  async function openTriggerProfileLibrary() {
    setTriggerProfileLibraryOpen(true);
    setTriggerProfileLibraryInstallErrors({});
    setTriggerProfileLibraryQuery('');
    setTriggerProfileLibraryLoading(true);
    try {
      const catalog = await window.bridge.getProfileLibraryCatalog();
      setTriggerProfileLibraryCatalog(catalog);
    } catch (err) {
      setTriggerProfileLibraryCatalog({
        entries: [],
        nativeGames: [],
        fetchedAtMs: 0,
        fromCache: false,
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setTriggerProfileLibraryLoading(false);
    }
  }

  async function installTriggerProfileFromLibrary(entry: LibraryEntry) {
    setTriggerProfileLibraryInstalling(entry.file);
    setTriggerProfileLibraryInstallErrors((errors) => {
      const next = { ...errors };
      delete next[entry.file];
      return next;
    });
    try {
      const result = await window.bridge.installLibraryProfile(entry);
      if (!result.ok) {
        setTriggerProfileLibraryInstallErrors((errors) => ({ ...errors, [entry.file]: result.error }));
        return;
      }
      const installedName = result.profile.name;
      const profiles = await refreshTriggerProfiles();
      const match = profiles.find((profile) => profile.name === installedName);
      if (match) loadTriggerProfileDraft(match);
      setTriggerProfileLibraryOpen(false);
      showTriggerProfileTransferStatus('good', `Installed "${installedName}" from the library`);
    } catch (err) {
      setTriggerProfileLibraryInstallErrors((errors) => ({
        ...errors,
        [entry.file]: err instanceof Error ? err.message : String(err)
      }));
    } finally {
      setTriggerProfileLibraryInstalling(null);
    }
  }

  async function toggleTriggerProfilesEnabled() {
    const status = await window.bridge.setTriggerProfilesEnabled(!triggerProfilesEnabled);
    setTriggerProfilesEnabled(status.enabled);
    setTriggerProfileEngineStatus(status);
  }

  async function refreshGameArtwork() {
    setGameArtwork(await window.bridge.getGameArtwork());
  }

  // Opening a game lands on its hub and switches into "Game settings" scope, so every
  // tab edits the game's snapshot until the scope is flipped back or the hub is closed.
  // Game scope is the default while a game hub is open. The scope pill derives
  // from gameSettingsStatus, so flip it optimistically — waiting for the IPC
  // round-trip made the pill start on Global and visibly jump to Game Settings.
  function setScopeOptimistically(editingProfileId: string | null) {
    setGameSettingsStatus((previous) => ({
      appliedProfileId: previous?.appliedProfileId ?? null,
      appliedBy: previous?.appliedBy ?? null,
      editingProfileId
    }));
  }

  async function runTriggerTest() {
    const { mode, target, start, end, strength } = triggerTest;
    if (triggerTestTimerRef.current !== null) window.clearTimeout(triggerTestTimerRef.current);
    setTriggerTestRunning(true);
    triggerTestTimerRef.current = window.setTimeout(() => {
      triggerTestTimerRef.current = null;
      setTriggerTestRunning(false);
    }, TRIGGER_PREVIEW_MS);
    await window.bridge.previewAdaptiveTriggerEffect({
      mode,
      target,
      startPercent: start,
      wallPercent: mode === 'weapon' ? Math.max(end, start + 10) : end,
      forcePercent: Math.max(1, strength)
    }).catch(() => undefined);
  }

  async function stopTriggerTest() {
    if (triggerTestTimerRef.current !== null) window.clearTimeout(triggerTestTimerRef.current);
    triggerTestTimerRef.current = null;
    setTriggerTestRunning(false);
    // A zero-force preview clears the running test effect in vdsd.
    await window.bridge.previewAdaptiveTriggerEffect({
      mode: triggerTest.mode,
      target: 'both',
      startPercent: 0,
      wallPercent: 0,
      forcePercent: 0
    }).catch(() => undefined);
  }

  async function runSystemUninstall() {
    if (!uninstallDialog || uninstallDialog.phase !== 'confirm') return;
    const purge = uninstallDialog.purge;
    setUninstallDialog({ phase: 'running', purge, steps: [], statuses: {}, exit: null });
    const stopListening = window.vds.onUninstallProgress((event) => {
      setUninstallDialog((current) => {
        if (!current) return current;
        if (event.event === 'plan') return { ...current, steps: event.steps };
        if (event.event === 'step') {
          return { ...current, statuses: { ...current.statuses, [event.index]: event.status } };
        }
        return current;
      });
    });
    try {
      const exit = await window.vds.uninstallSystem(purge);
      setUninstallDialog((current) => current && { ...current, phase: 'done', exit });
    } finally {
      stopListening();
    }
  }

  async function openGameProfile(id: string, linked = linkedProfileFor(id) !== null) {
    setOpenGameProfileId(id);
    recordNavState('game-profile', id);
    // A game linked to one of the user's profiles never uses its own settings, so
    // opening it must not switch the selection into game scope.
    if (linked) {
      setScopeOptimistically(null);
      setGameSettingsStatus(await window.bridge.exitGameSettingsScope());
      return;
    }
    setScopeOptimistically(id);
    const status = await window.bridge.enterGameSettingsScope(id);
    setGameSettingsStatus(status);
  }

  async function setGameSettingsScope(scope: 'game' | 'global') {
    if (!openGameProfileId) return;
    setScopeOptimistically(scope === 'game' ? openGameProfileId : null);
    const status = scope === 'game'
      ? await window.bridge.enterGameSettingsScope(openGameProfileId)
      : await window.bridge.exitGameSettingsScope();
    setGameSettingsStatus(status);
  }

  async function closeGameProfile() {
    setOpenGameProfileId(null);
    setScopeOptimistically(null);
    recordNavState('game-profile', null);
    selectControlTab('game-profile');
    const status = await window.bridge.exitGameSettingsScope();
    setGameSettingsStatus(status);
  }

  function openGameCreateDialog() {
    setGameCreateName('');
    setGameCreateLinkedProfileId(GAME_PROFILE_LINK_NONE);
    setGameLibraryFilter('');
    setGameCreateProcessesInput('');
    setGameCreateCandidates(null);
    setSelectedInstalledGame(null);
    setInstalledCandidateTicks({});
    setGameCreateOpen(true);
    void loadInstalledGames(false);
  }

  async function loadInstalledGames(refresh: boolean) {
    if (installedGames !== null && !refresh) return;
    setInstalledGamesLoading(true);
    try {
      setInstalledGames(await window.bridge.listInstalledGames(refresh));
    } catch {
      setInstalledGames({ games: [], errors: ['Scan failed'] });
    } finally {
      setInstalledGamesLoading(false);
    }
  }

  function pickInstalledGame(game: InstalledGamesList['games'][number]) {
    if (selectedInstalledGame?.sourceId === game.sourceId) {
      setSelectedInstalledGame(null);
      setInstalledCandidateTicks({});
      setGameCreateName('');
      return;
    }
    setSelectedInstalledGame(game);
    setGameCreateName(game.name);
    // Junk-scored candidates start unticked; everything else is presumed right.
    const ticks: Record<string, boolean> = {};
    for (const candidate of game.processCandidates) {
      ticks[candidate] = !game.junkCandidates.includes(candidate);
    }
    setInstalledCandidateTicks(ticks);
  }

  async function browseGameCreateExecutable() {
    const picked = await window.bridge.pickGameExecutable();
    if (!picked) return;
    setGameCreateProcessesInput((current) => mergeDetectedProcessName(current, picked.processName));
    if (!gameCreateName.trim()) setGameCreateName(picked.title);
  }

  async function detectGameCreateProcesses() {
    setGameCreateDetectLoading(true);
    try {
      setGameCreateCandidates(await window.bridge.listCandidateGameProcesses());
    } finally {
      setGameCreateDetectLoading(false);
    }
  }

  async function submitGameCreate() {
    const name = gameCreateName.trim();
    if (!name || gameCreateBusy) return;
    const tickedCandidates = selectedInstalledGame
      ? selectedInstalledGame.processCandidates.filter((candidate) => installedCandidateTicks[candidate])
      : [];
    const processNames = [...new Set([
      ...tickedCandidates.map((candidate) => candidate.toLowerCase()),
      ...parseProcessNamesInput(gameCreateProcessesInput)
    ])];
    setGameCreateBusy(true);
    try {
      // The OpenDS5-Profiles catalog decides what the new game gets: a published
      // profile installs as-is, a native game keeps the default feel, anything
      // else starts without custom triggers. New blank trigger profiles are
      // never created here.
      const catalog = triggerProfileLibraryCatalog
        ?? await window.bridge.getProfileLibraryCatalog().catch(() => null);
      const match = matchGameInLibrary(catalog, name);

      let saved: TriggerProfile | null = null;
      if (match.kind === 'profile') {
        const installed = await window.bridge.installLibraryProfile(match.entry);
        if (installed.ok) {
          saved = installed.profile;
          if (processNames.length > 0) {
            const mergedProcesses = [...new Set([...saved.match.processNames, ...processNames])];
            saved = await window.bridge.saveTriggerProfile({
              ...saved,
              match: { ...saved.match, processNames: mergedProcesses },
              updatedAtMs: Date.now()
            });
          }
        }
      }
      if (!saved) {
        const id = uniqueTriggerProfileId(name, triggerProfiles.map((profile) => profile.id));
        const base = createDefaultProfile();
        saved = await window.bridge.saveTriggerProfile({
          ...base,
          id,
          name,
          match: { processNames, windowTitles: [] },
          meta: { game: name },
          updatedAtMs: Date.now()
        });
      }
      await refreshTriggerProfiles(saved.id);
      if (gameCreateLinkedProfileId !== GAME_PROFILE_LINK_NONE) {
        await window.bridge.setGameProfileLink(saved.id, gameCreateLinkedProfileId);
      }
      setGameCreateOpen(false);
      // Cover art is decoration: fetch in the background and never block creation
      // on it. A launcher's own artwork (Steam cache, Heroic art_cover) wins over
      // the keyless proxy lookup.
      const savedId = saved.id;
      const launcherArtwork = selectedInstalledGame?.artwork
        ? window.bridge.applyInstalledGameArtwork(savedId, selectedInstalledGame.sourceId)
        : Promise.resolve({ ok: false as const, error: 'no launcher artwork' });
      void launcherArtwork.then(async (applied) => {
        if (!applied.ok) {
          const fallback = await window.bridge.applyGameArtwork(savedId, null);
          if (!fallback.ok) return;
        }
        await refreshGameArtwork();
      });
      // The scanned list is filtered against existing profiles main-side; drop the
      // renderer cache so the next dialog open re-filters (the scan itself stays cached).
      setInstalledGames(null);
      await openGameProfile(savedId, gameCreateLinkedProfileId !== GAME_PROFILE_LINK_NONE);
    } finally {
      setGameCreateBusy(false);
    }
  }

  async function confirmDeleteGameProfile(keepTriggerEffects: boolean) {
    if (!gameDeleteConfirm) return;
    const deletedId = gameDeleteConfirm.id;
    if (openGameProfileId === deletedId) {
      setOpenGameProfileId(null);
    }
    await window.bridge.deleteGameProfile(deletedId, keepTriggerEffects);
    setGameDeleteConfirm(null);
    setGameSettingsStatus(await window.bridge.getGameSettingsStatus());
    await refreshTriggerProfiles(undefined, keepTriggerEffects ? undefined : deletedId);
    await refreshGameArtwork();
  }

  function openGameArtworkDialog(profileId: string, initialQuery: string) {
    setGameArtworkDialogFor(profileId);
    setGameArtworkQuery(initialQuery);
    setGameArtworkResults(null);
    setGameArtworkError(null);
    setSteamGridDbKeyDraft(null);
  }

  async function saveSteamGridDbKeyDraft() {
    if (steamGridDbKeyDraft === null) return;
    await window.bridge.setSteamGridDbApiKey(steamGridDbKeyDraft);
    setSteamGridDbKeyDraft(null);
  }

  async function searchGameArtworkDialog() {
    if (gameArtworkBusy) return;
    setGameArtworkBusy(true);
    setGameArtworkError(null);
    try {
      await saveSteamGridDbKeyDraft();
      const response = await window.bridge.searchGameArtwork(gameArtworkQuery);
      if (response.ok) {
        setGameArtworkResults(response.results);
        if (response.results.length === 0) {
          setGameArtworkError(`No SteamGridDB results for "${gameArtworkQuery.trim()}"`);
        }
      } else {
        setGameArtworkResults(null);
        setGameArtworkError(response.error);
      }
    } finally {
      setGameArtworkBusy(false);
    }
  }

  async function applyGameArtworkChoice(result: GameArtworkSearchResult) {
    if (!gameArtworkDialogFor || gameArtworkBusy) return;
    setGameArtworkBusy(true);
    setGameArtworkError(null);
    try {
      const response = await window.bridge.applyGameArtwork(gameArtworkDialogFor, result);
      if (!response.ok) {
        setGameArtworkError(response.error);
        return;
      }
      await refreshGameArtwork();
      setGameArtworkDialogFor(null);
    } finally {
      setGameArtworkBusy(false);
    }
  }

  async function removeGameArtworkChoice() {
    if (!gameArtworkDialogFor) return;
    setGameArtwork(await window.bridge.removeGameArtwork(gameArtworkDialogFor));
    setGameArtworkDialogFor(null);
  }

  function openGameTriggerEditor(profile: TriggerProfile) {
    // Games with native trigger support drive the triggers themselves; custom
    // settings stay disabled for those.
    if (nativeGameFeatures(nativeFeatureMap, profile)?.triggers) return;
    loadTriggerProfileDraft(profile);
    selectControlTab('trigger-profiles');
  }

  async function pinSelectedTriggerProfile(id: string) {
    const status = await window.bridge.pinTriggerProfile(id === '' ? null : id);
    setTriggerProfileEngineStatus(status);
  }

  async function selectEngineTriggerState(name: string) {
    const status = await window.bridge.selectTriggerProfileState(name);
    setTriggerProfileEngineStatus(status);
  }

  function addTriggerProfileState() {
    if (!triggerProfileDraft) return;
    const existing = triggerProfileDraft.states ?? [];
    if (existing.length >= MAX_STATES_PER_PROFILE) return;
    // A states-less profile first absorbs its current feel as state one, so
    // "Add state" always yields the old feel plus a fresh empty one.
    const seeded: TriggerStateDef[] = existing.length > 0
      ? [...existing]
      : [{ name: 'Default', triggers: triggerProfileDraft.triggers }];
    const name = uniqueStateName(`State ${seeded.length + 1}`, seeded.map((state) => state.name));
    seeded.push({ name, triggers: emptyTriggerSlotPair() });
    setTriggerProfileDraft({
      ...triggerProfileDraft,
      states: seeded,
      switching: triggerProfileDraft.switching ?? { rules: [] },
      triggers: seeded[0].triggers
    });
    setTriggerProfileEditingState(seeded.length - 1);
  }

  function renameTriggerProfileState(index: number, name: string) {
    setTriggerProfileDraft((draft) => {
      if (!draft?.states || !draft.states[index]) return draft;
      const previous = draft.states[index].name;
      const states = draft.states.map((state, at) => (at === index ? { ...state, name } : state));
      // Keep rules and defaultState pointing at the renamed state.
      const switching = draft.switching
        ? {
            ...draft.switching,
            rules: draft.switching.rules.map((rule) => (
              rule.action === 'select' && rule.state === previous ? { ...rule, state: name } : rule
            )),
            ...(draft.switching.stickWheel
              ? {
                  stickWheel: {
                    ...draft.switching.stickWheel,
                    sectors: draft.switching.stickWheel.sectors.map((entry) => (
                      entry === previous ? name : entry
                    ))
                  }
                }
              : {}),
            ...(draft.switching.defaultState === previous ? { defaultState: name } : {})
          }
        : draft.switching;
      return { ...draft, states, ...(switching ? { switching } : {}) };
    });
  }

  function duplicateTriggerProfileState(index: number) {
    if (!triggerProfileDraft?.states) return;
    const states = triggerProfileDraft.states;
    if (!states[index] || states.length >= MAX_STATES_PER_PROFILE) return;
    const source = states[index];
    const name = uniqueStateName(source.name, states.map((state) => state.name));
    const copy: TriggerStateDef = {
      name,
      triggers: {
        l2: { base: source.triggers.l2.base, modifiers: [...source.triggers.l2.modifiers] },
        r2: { base: source.triggers.r2.base, modifiers: [...source.triggers.r2.modifiers] }
      }
    };
    const next = [...states.slice(0, index + 1), copy, ...states.slice(index + 1)];
    setTriggerProfileDraft({ ...triggerProfileDraft, states: next, triggers: next[0].triggers });
    setTriggerProfileEditingState(index + 1);
  }

  function removeTriggerProfileState(index: number) {
    setTriggerProfileDraft((draft) => {
      if (!draft?.states || !draft.states[index]) return draft;
      const removed = draft.states[index].name;
      const states = draft.states.filter((_, at) => at !== index);
      if (states.length <= 1) {
        // One state is no states: collapse back to a plain profile.
        const { states: _states, switching: _switching, ...rest } = draft;
        return { ...rest, triggers: states[0]?.triggers ?? draft.states[index].triggers };
      }
      const switching = draft.switching
        ? {
            ...draft.switching,
            rules: draft.switching.rules.filter((rule) => rule.action !== 'select' || rule.state !== removed),
            ...(draft.switching.stickWheel
              ? {
                  stickWheel: {
                    ...draft.switching.stickWheel,
                    sectors: draft.switching.stickWheel.sectors.map((entry) => (
                      entry === removed ? null : entry
                    ))
                  }
                }
              : {})
          }
        : undefined;
      if (switching && switching.defaultState === removed) delete switching.defaultState;
      return { ...draft, states, ...(switching ? { switching } : {}), triggers: states[0].triggers };
    });
    setTriggerProfileEditingState(0);
  }

  function updateTriggerProfileSwitching(updater: (switching: StateSwitching) => StateSwitching) {
    setTriggerProfileDraft((draft) => {
      if (!draft?.states || draft.states.length === 0) return draft;
      return { ...draft, switching: updater(draft.switching ?? { rules: [] }) };
    });
  }

  // Moves a state to a new position by swapping with the occupant. Position
  // and wheel sector are kept matching in both directions: the two states'
  // wheel-sector entries swap along with their positions.
  function moveTriggerProfileState(from: number, to: number) {
    setTriggerProfileDraft((draft) => {
      if (!draft?.states || from === to || !draft.states[from] || to < 0 || to >= draft.states.length) return draft;
      const states = [...draft.states];
      [states[from], states[to]] = [states[to], states[from]];
      let switching = draft.switching;
      const wheel = switching?.stickWheel;
      if (switching && wheel) {
        const sectors = [...wheel.sectors];
        const movedIndex = sectors.indexOf(states[to].name);
        const target = to < sectors.length ? to : -1;
        if (movedIndex >= 0 && target >= 0 && movedIndex !== target) {
          [sectors[movedIndex], sectors[target]] = [sectors[target], sectors[movedIndex]];
        }
        switching = { ...switching, stickWheel: { ...wheel, sectors } };
      }
      return { ...draft, states, triggers: states[0].triggers, ...(switching ? { switching } : {}) };
    });
    setTriggerProfileEditingState(to);
  }

  // Applies a stickWheel change from the wheel configurator and keeps state
  // positions matching sector numbers: any state that newly landed in sector i
  // swaps its list position to i (clamped to the state count).
  function updateStickWheelSynced(next: StickWheelConfig) {
    let editorFollow: number | null = null;
    setTriggerProfileDraft((draft) => {
      if (!draft?.states || draft.states.length === 0 || !draft.switching) return draft;
      const editingName = draft.states[triggerProfileEditingState]?.name;
      const previousSectors = draft.switching.stickWheel?.sectors ?? [];
      let states = draft.states;
      next.sectors.forEach((name, sector) => {
        if (name === null || previousSectors[sector] === name) return;
        const from = states.findIndex((state) => state.name === name);
        const to = Math.min(sector, states.length - 1);
        if (from >= 0 && from !== to) {
          states = [...states];
          [states[from], states[to]] = [states[to], states[from]];
        }
      });
      if (editingName) {
        const follow = states.findIndex((state) => state.name === editingName);
        if (follow >= 0 && follow !== triggerProfileEditingState) editorFollow = follow;
      }
      return {
        ...draft,
        states,
        triggers: states[0].triggers,
        switching: { ...draft.switching, stickWheel: next }
      };
    });
    if (editorFollow !== null) setTriggerProfileEditingState(editorFollow);
  }

  function updateTriggerProfileSwitchRule(index: number, patch: Partial<StateSwitchRule>) {
    updateTriggerProfileSwitching((switching) => ({
      ...switching,
      rules: switching.rules.map((rule, at) => {
        if (at !== index) return rule;
        const next: StateSwitchRule = { ...rule, ...patch };
        if (next.action === 'cycle') delete next.state;
        if (next.while === '') delete next.while;
        return next;
      })
    }));
  }

  function updateTriggerProfileSlot(
    slot: TriggerProfileSlotKey,
    updater: (config: TriggerProfile['triggers']['l2']) => TriggerProfile['triggers']['l2'],
    options?: { mirrorBase?: boolean }
  ) {
    triggerProfilePreviewArmedRef.current = true;
    setTriggerProfileDraft((draft) => {
      if (!draft) return draft;
      const current = editingStateTriggers(draft, triggerProfileEditingState);
      let triggers = { ...current, [slot]: updater(current[slot]) };
      if (options?.mirrorBase) {
        triggers = mirrorTriggerSlotBase(triggers, slot);
      }
      if (draft.states && draft.states.length > 0) {
        const index = Math.min(triggerProfileEditingState, draft.states.length - 1);
        const states = draft.states.map((state, at) => (at === index ? { ...state, triggers } : state));
        // The profile-level triggers mirror states[0] (back-compat invariant).
        return { ...draft, states, triggers: index === 0 ? triggers : draft.triggers };
      }
      return { ...draft, triggers };
    });
  }

  function toggleTriggerProfilesLinked(sourceSlot: TriggerProfileSlotKey) {
    const nextLinked = !triggerProfilesLinked;
    setTriggerProfilesLinked(nextLinked);
    if (nextLinked) {
      updateTriggerProfileSlot(sourceSlot, (config) => config, { mirrorBase: true });
    }
  }

  function triggerProfileNameById(id: string): string {
    return triggerProfiles.find((profile) => profile.id === id)?.name ?? id;
  }

  function toggleLightbarEnabled() {
    if (!snapshot) return;
    void runAction('lightbar-enabled', () => window.bridge.setLightbarEnabled(!snapshot.settings.lightbarEnabled));
  }

  function focusBridgeSettings(target: SettingsFocusTarget) {
    setShowNotificationsMenu(false);
    setShowBridgeSettings(true);
    setNotificationFocusTarget(null);
    setSettingsFocusTarget(target);
    if (settingsFocusTimerRef.current !== null) {
      window.clearTimeout(settingsFocusTimerRef.current);
    }
    settingsFocusTimerRef.current = window.setTimeout(() => {
      setSettingsFocusTarget(null);
      settingsFocusTimerRef.current = null;
    }, 2200);
  }

  function focusNotificationSettings(target: NotificationFocusTarget) {
    setShowBridgeSettings(false);
    setShowNotificationsMenu(true);
    setSettingsFocusTarget(null);
    setNotificationFocusTarget(target);
    if (notificationFocusTimerRef.current !== null) {
      window.clearTimeout(notificationFocusTimerRef.current);
    }
    notificationFocusTimerRef.current = window.setTimeout(() => {
      setNotificationFocusTarget(null);
      notificationFocusTimerRef.current = null;
    }, 2200);
  }

  function setMuteButtonAction(
    mode: MuteButtonMode,
    usage?: number,
    modifiers?: number,
    behavior?: MuteKeyboardBehavior,
    chordStarterEnabled?: boolean
  ) {
    if (!snapshot) {
      return;
    }
    const keyUsage = usage ?? snapshot.settings.muteKeyboardUsage;
    const keyModifiers = modifiers ?? snapshot.settings.muteKeyboardModifiers;
    const keyBehavior = behavior ?? snapshot.settings.muteKeyboardBehavior;
    const keyChordStarterEnabled = chordStarterEnabled ?? snapshot.settings.muteKeyboardChordStarterEnabled;
    void runAction('mute-button', () => (
      window.bridge.setMuteButtonAction(mode, keyUsage, keyModifiers, keyBehavior, keyChordStarterEnabled)
    ));
  }

  function setMuteModifier(bit: number, enabled: boolean) {
    if (!snapshot) {
      return;
    }
    const nextModifiers = enabled
      ? snapshot.settings.muteKeyboardModifiers | bit
      : snapshot.settings.muteKeyboardModifiers & ~bit;
    setMuteButtonAction(
      snapshot.settings.muteButtonMode,
      snapshot.settings.muteKeyboardUsage,
      nextModifiers,
      snapshot.settings.muteKeyboardBehavior,
      snapshot.settings.muteKeyboardChordStarterEnabled
    );
  }

  function clearOverviewSleepConfirmation() {
    overviewSleepConfirmArmedRef.current = false;
    setOverviewSleepConfirmVisible(false);
    if (overviewSleepConfirmTimerRef.current !== null) {
      window.clearTimeout(overviewSleepConfirmTimerRef.current);
      overviewSleepConfirmTimerRef.current = null;
    }
  }

  function armOverviewSleepConfirmation() {
    overviewSleepConfirmArmedRef.current = true;
    setOverviewSleepConfirmVisible(true);
    if (overviewSleepConfirmTimerRef.current !== null) {
      window.clearTimeout(overviewSleepConfirmTimerRef.current);
    }
    overviewSleepConfirmTimerRef.current = window.setTimeout(() => {
      overviewSleepConfirmArmedRef.current = false;
      setOverviewSleepConfirmVisible(false);
      overviewSleepConfirmTimerRef.current = null;
    }, SLEEP_CONFIRM_MS);
  }

  function handleOverviewSleepController() {
    if (!snapshot || !connected || !sleepControllerSupported || !controllerConnected || pendingAction !== null) {
      return;
    }
    if (!overviewSleepConfirmArmedRef.current) {
      armOverviewSleepConfirmation();
      return;
    }
    clearOverviewSleepConfirmation();
    void runAction('overview-sleep-controller', () => window.bridge.sleepController());
  }

  function toggleControllerNotifications() {
    if (!snapshot) return;
    void runAction('notify-controller', () => (
      window.bridge.setNotifyControllerConnection(!snapshot.settings.notifyControllerConnection)
    ));
  }

  function toggleLowBatteryNotifications() {
    if (!snapshot) return;
    void runAction('notify-battery', () => (
      window.bridge.setNotifyLowBattery(!snapshot.settings.notifyLowBattery)
    ));
  }

  function toggleChargeCompleteNotifications() {
    if (!snapshot) return;
    void runAction('notify-charged', () => (
      window.bridge.setNotifyChargeComplete(!snapshot.settings.notifyChargeComplete)
    ));
  }

  function setPollingRateMode(mode: PollingRateMode) {
    void runAction('polling-rate', () => window.bridge.setPollingRateMode(mode));
  }

  function setHostPersonaMode(mode: HostPersonaMode) {
    void runAction('host-persona', () => window.bridge.setHostPersonaMode(mode));
  }

  function testNotifications() {
    void runAction('notify-test', () => window.bridge.testNotification());
  }

  function selectControlTab(tab: ControlTab) {
    if (tab === activeControlTab) {
      return;
    }
    setShowCustomColorPicker(false);
    setShowBridgeSettings(false);
    setShowNotificationsMenu(false);
    setActiveControlTab(tab);
    recordNavState(tab, openGameProfileId);
  }

  // Mouse back/forward buttons walk a small in-app history over
  // (control tab, open game hub) — the two axes of navigation the app has.
  function recordNavState(tab: ControlTab, gameId: string | null) {
    if (navApplyingRef.current) return;
    const history = navHistoryRef.current;
    const current = history[navIndexRef.current];
    if (current && current.tab === tab && current.gameId === gameId) return;
    history.splice(navIndexRef.current + 1);
    history.push({ tab, gameId });
    if (history.length > 50) history.shift();
    navIndexRef.current = history.length - 1;
  }

  applyNavStateRef.current = (state: { tab: ControlTab; gameId: string | null }) => {
    navApplyingRef.current = true;
    try {
      if (state.gameId !== openGameProfileId) {
        setOpenGameProfileId(state.gameId);
        setScopeOptimistically(state.gameId);
        if (state.gameId === null) {
          void window.bridge.exitGameSettingsScope().then(setGameSettingsStatus);
        } else {
          void window.bridge.enterGameSettingsScope(state.gameId).then(setGameSettingsStatus);
        }
      }
      selectControlTab(state.tab);
    } finally {
      navApplyingRef.current = false;
    }
  };

  const activeTheme = snapshot?.settings.uiThemePreset ?? startupTheme;

  return {
    ackText, activeAudioTestLocked, activeAudioTestStatusLabel, activeAudioTestStatusTone,
    activeAudioTestUnavailable, activeControlTab, activeFeedbackStatusLabel,
    activeFeedbackStatusTone, activeFeedbackTestUnavailable, activeGameProfile,
    activeHapticsFeatureEnabled, activeTheme, adaptiveTriggerOutputActive, adaptiveTriggersEnabled,
    adaptiveTriggersSupported, addChordAssignmentDraft, addTriggerProfileState, anyModalOpen,
    applyGameArtworkChoice, applyNavStateRef, applySnapshot, appVersion,
    armOverviewSleepConfirmation, audioBufferAuto, audioBufferLengthCommitPending,
    audioBufferLengthControlDisabled, audioBufferLengthControlSupported, audioBufferLengthEditingRef,
    audioBufferLengthValue, audioDebugText, audioEnabled, audioEventLogText, audioHapticsOpen,
    audioHapticsSessionByKey, audioHapticsSessions, audioHapticsSessionsLoading,
    audioHapticsSourceOptions, audioPathLabel, audioPathTone, audioPathTooltip,
    audioReactiveHapticsBlocked, audioReactiveHapticsCommitPending,
    audioReactiveHapticsConfigDisabled, audioReactiveHapticsControlDisabled,
    audioReactiveHapticsEnabled, audioReactiveHapticsModeBadgeLabel, audioReactiveHapticsModeTooltip,
    audioReactiveHapticsOverrideMode, audioReactiveHapticsRouteSupported, audioReactiveHapticsSource,
    audioReactiveHapticsSourceKey, audioReactiveHapticsStatusLabel, audioReactiveHapticsStatusTone,
    audioReactiveHapticsSupported, audioStatus, backupBusy, backupStatus, batteryCharging,
    batteryChargingSegment, batteryCritical, batteryLevelTone, batteryPercent, batteryPercentLabel,
    batterySegmentCount, beginWindowDrag, bridgeState, browseGameCreateExecutable,
    browseGameExecutableForEditor, canAddChordDraft, canDeleteControllerProfile,
    chargeCompleteToastEnabled, checkForUpdatesNow, chordAssignableButtonIds,
    chordAssignmentConflictState, chordAssignmentDraftRows, chordAssignmentDragRef,
    chordAssignmentDropHint, chordAssignmentListRef, chordAssignments, chordAssignmentScrollbar,
    chordAssignmentsSubtitle, chordButtonOptionsFor, chordFunctionDialog,
    chordFunctionDialogFunction, chordFunctionDraft, chordFunctionNameDraft, chordFunctionOptions,
    chordFunctions, chordFunctionsSignature, chordStarterOptions, chordStarterOptionsFor,
    classicRumbleCommitPending, classicRumbleEditingRef, classicRumbleEnabled,
    classicRumbleV1CommitPending, classicRumbleV1Enabled, classicRumbleValue,
    clearOverviewSleepConfirmation, clearTriggerProfileDraftPreview, closeChordFunctionDialog,
    closeControllerProfileDialog, closeDeviceCleanupConfirm, closeGameProfile,
    closeRemapProfileDialog, commitAudioBufferLength, commitAudioReactiveHapticsConfig,
    commitChordAssignment, commitChordAssignmentDraft, commitChordConfiguration,
    commitChordFunctionDraft, commitClassicRumbleValue, commitHapticsValue, commitLightbar,
    commitMicVolume, commitSpeakerVolume, commitTriggerEffectIntensity, confirmDeleteGameProfile,
    confirmDeleteTriggerProfile, confirmResetTriggerProfile, connected, controllerConnected,
    controllerControlsAvailable, controllerPowerSavingActive, controllerProfileDialogMode,
    controllerProfileNameDraft, controllerProfileOptions, controllerToastEnabled,
    createChordAssignmentDragOverlay, createChordFunction, createTriggerProfile, customColorDraft,
    customColorPickerDisabled, customColorPickerRef, customLightbarColor, customSwatchColor,
    customSwatchPrimed, customSwatchPrimeTimerRef, customSwatchSelected, defaultChordFunctionId,
    deferredSnapshotRef, deleteButtonRemappingProfile, deleteChordAssignment,
    deleteChordAssignmentDraft, deleteChordFunction, deleteControllerProfile,
    detectGameCreateProcesses, detectRunningGame, detectRunningGameForEditor,
    deviceCleanupConfirmVisible, deviceCleanupError, deviceCleanupMessage, diagnosticsVisible,
    draggedChordAssignmentId, duplexMicEnabled, duplexMicLabel, duplicateTriggerProfile,
    duplicateTriggerProfileState, edgeRemapControlLayout, exportTriggerProfileDraft,
    feedbackBoostCommitPending, feedbackBoostEnabled, feedbackTraceText,
    finishChordAssignmentPointerDrag, finishWindowDrag, firmwareUpdateAvailable,
    firstAllowedChordButton, focusBridgeSettings, focusNotificationSettings, gameArtwork,
    gameArtworkBusy, gameArtworkDialogFor, gameArtworkError, gameArtworkQuery, gameArtworkResults,
    gameCreateBusy, gameCreateCandidates, gameCreateDetectLoading, gameCreateLinkedProfileId,
    gameCreateName, gameCreateOpen, gameCreateProcessesInput, gameDeleteConfirm,
    gameDetectCandidates, gameDetectLoading, gameDetectPopoverOpen, gameDetectPopoverRef,
    gameHasSettings, gameLibraryFilter, gameProcessDetectOpen, gameProcessDetectRef,
    gameProcessEditor, gameProcessEditorInput, gameProcessEditorSaving, gameProfileLinkOptions,
    gameProfiles, gameSettingsScope, gameSettingsStatus, gameStreamActive,
    handleOverviewSleepController, hapticsCommitPending, hapticsEditingRef, hapticsEnabled,
    hapticsSliderMax, hapticsSliderTicks, hapticsStatusLabel, hapticsStatusReady, hapticsStatusTone,
    hapticsValue, headsetOutputDetected, hostPersonaControlSupported, hostPersonaOptions,
    hoveredRemapButton, importTriggerProfilesFromDisk, installedCandidateTicks, installedGames,
    installedGamesLoading, installedLibraryFiles, installTriggerProfileFromLibrary,
    isPreservingPowerSavingCap, largerAudioBlocks, largerAudioBlocksError, largerAudioBlocksPending,
    lastAck, lastAutoMatchedProfileRef, lastRemapControllerType, lightbarBrightnessEditingRef,
    lightbarBrightnessValue, lightbarColor, lightbarColorName, lightbarCommitPending,
    lightbarEnabled, lightbarOverrideSupported, lightbarStateActive, lightbarStateLabel, lightbarStateTone,
    lightbarSupported, linkedProfileFor, liveControllerType, loadInstalledGames,
    loadTriggerProfileDraft, lowBatteryToastEnabled, mainUiMounted, manualUpdateCheck, microphoneOn,
    micStatusReady, micTestError, micTestLocked, micTestStatusLabel, micTestStatusTone,
    micVolumeCommitPending, micVolumeEditingRef, micVolumeValue, moveChordAssignmentDragOverlay,
    moveTriggerProfileState, muteButtonActionsSupported, muteButtonChordStarterActive,
    muteChordStarterIsInactive, nativeFeatureMap, navApplyingRef, navHistoryRef, navIndexRef,
    normalizedLightbarColor, notificationFocusTarget, notificationFocusTimerRef,
    notificationsEnabled, notificationsRef, openChordFunctionDialog, openCustomLightbarPicker,
    openDeviceCleanupConfirm, openGameArtworkDialog, openGameCreateDialog, openGameProcessEditor,
    openGameProfile, openGameProfileEntry, openGameProfileId, openGameTriggerEditor,
    openTriggerProfileDeleteConfirm, openTriggerProfileLibrary, outputControlLabel,
    outputControlLower, OutputIcon, outputPresetLower, overviewAudioOutputLabel,
    overviewAudioPathDetail, overviewAudioPathState, overviewConnectionStatus, overviewFirmwareLabel,
    overviewHealthLabel, overviewHealthTone, overviewHostPersonaMode, overviewNotificationItems,
    overviewPowerSavingLabel, overviewShortcutItems, overviewSignalLabel, overviewSignalQuality,
    overviewSignalTitle, overviewSignalTone, overviewSignalValue, overviewSleepConfirmArmedRef,
    overviewSleepConfirmTimerRef, overviewSleepConfirmVisible, overviewSpeakerVolumeValue,
    pageVisible, pendingAction, percentSliderMax, personaTransition, personaTransitionActive,
    pickDetectedGameProcess, pickDetectedGameProcessForEditor, pickInstalledGame,
    pinSelectedTriggerProfile, pollingRateControlSupported, pollingRateLabel,
    previewCustomLightbarColor, prevSampleButtonsRef, recordNavState, refreshGameArtwork,
    refreshTriggerProfiles, remapCalloutLayout, remapControllerType, remapDraft, remapModifiedCount,
    remappingArtRef, remappingLayoutAsset, remappingLayoutRef, remappingLeftSideRef,
    remappingRightSideRef, remapProfileDialogMode, remapProfileNameDraft, remapProfileOptions,
    removeGameArtworkChoice, removeTriggerProfileState, renameButtonRemappingProfile,
    renameControllerProfile, renameTriggerProfileState, renderChordFunctionSummary,
    reorderChordAssignment, resetAdaptiveTriggers, restoreButtonRemappingDefaults, ruleCapture,
    ruleCaptureRef, rumbleStatusLabel, rumbleStatusReady, rumbleStatusTone, runAction,
    runBackupAction, runFeedbackTest, runQuietAction, runSystemUninstall, runTestMic, runTestSpeaker,
    runTriggerTest, runWindowsDeviceCleanup, saveButtonRemappingProfile, saveControllerProfile,
    saveCustomLightbarColor, saveGameProcessNames, saveSteamGridDbKeyDraft, saveTriggerProfileDraft,
    searchGameArtworkDialog, selectButtonRemappingProfile, selectControllerProfile, selectControlTab,
    selectCustomLightbarColor, selectedAudioHapticsSourceDisplayName, selectedChordFunction,
    selectedChordFunctionId, selectedControllerProfile, selectedControllerProfileId,
    selectedControllerProfileIsDefault, selectedControllerProfileIsGameOwned, selectedInstalledGame,
    selectedRemapProfile, selectedRemapProfileId, selectedRemapProfileIsDefault,
    selectedRemapProfileIsGameOwned, selectedTriggerProfileId, selectEngineTriggerState,
    selectLightbarColor, selectTriggerProfile, setActiveControlTab, setAppVersion,
    setAudioBufferLengthCommitPending, setAudioBufferLengthValue, setAudioHapticsOpen,
    setAudioHapticsSessions, setAudioHapticsSessionsLoading, setAudioReactiveHapticsAttack,
    setAudioReactiveHapticsBassFocus, setAudioReactiveHapticsCommitPending,
    setAudioReactiveHapticsMode, setAudioReactiveHapticsRelease, setAudioReactiveHapticsResponse,
    setAudioReactiveHapticsSourceValue, setBackupBusy, setBackupStatus, setButtonRemap,
    setChordAssignmentDraftRows, setChordAssignmentDragDropHint, setChordAssignmentDropHint,
    setChordAssignmentFunction, setChordAssignmentScrollbar, setChordFunctionControllerAction,
    setChordFunctionControllerStepPercent, setChordFunctionDialog, setChordFunctionDraft,
    setChordFunctionKeyboardKey, setChordFunctionNameDraft, setClassicRumbleCommitPending,
    setClassicRumblePreset, setClassicRumbleV1CommitPending, setClassicRumbleValue,
    setControllerProfileDialogMode, setControllerProfileNameDraft, setCustomColorDraft,
    setCustomLightbarColor, setCustomSwatchPrimed, setDeviceCleanupConfirmVisible,
    setDeviceCleanupError, setDeviceCleanupMessage, setDraggedChordAssignmentId,
    setEdgeRemapControlLayout, setFeedbackBoostCommitPending, setGameArtwork, setGameArtworkBusy,
    setGameArtworkDialogFor, setGameArtworkError, setGameArtworkQuery, setGameArtworkResults,
    setGameCreateBusy, setGameCreateCandidates, setGameCreateDetectLoading,
    setGameCreateLinkedProfileId, setGameCreateName, setGameCreateOpen, setGameCreateProcessesInput,
    setGameDeleteConfirm, setGameDetectCandidates, setGameDetectLoading, setGameDetectPopoverOpen,
    setGameLibraryFilter, setGameProcessDetectOpen, setGameProcessEditor, setGameProcessEditorInput,
    setGameProcessEditorSaving, setGameProfileLink, setGameSettingsScope, setGameSettingsStatus,
    setHapticsCommitPending, setHapticsPreset, setHapticsValue, setHostPersonaMode,
    setHoveredRemapButton, setInstalledCandidateTicks, setInstalledGames, setInstalledGamesLoading,
    setLargerAudioBlocksError, setLargerAudioBlocksPending, setLargerAudioBlocksState,
    setLastRemapControllerType, setLightbarBrightnessValue, setLightbarColor,
    setLightbarCommitPending, setLightbarPreset, setManualUpdateCheck, setMicPreset, setMicTestError,
    setMicTestLocked, setMicVolumeCommitPending, setMicVolumeValue, setMuteButtonAction,
    setMuteModifier, setNotificationFocusTarget, setOpenGameProfileId,
    setOverviewSleepConfirmVisible, setPendingAction, setPollingRateMode, setRemapCalloutLayout,
    setRemapDraft, setRemapProfileDialogMode, setRemapProfileNameDraft, setRuleCapture,
    setScopeOptimistically, setSelectedChordFunctionId, setSelectedInstalledGame,
    setSelectedTriggerProfileId, setSettingsFocusTarget, setSettingsPath, setShowBridgeSettings,
    setShowClassicRumbleControl, setShowCustomColorPicker, setShowDiagnostics,
    setShowMicrophoneControl, setShowNotificationsMenu, setSnapshot, setSpeakerGainLevel,
    setSpeakerOutputAvailable, setSpeakerPreset, setSpeakerTestError, setSpeakerTestLocked,
    setSpeakerVolumeCommitPending, setSpeakerVolumeValue, setStartupTheme,
    setStartupTutorialFeatureActive, setStartupTutorialStep, setStartupVisible,
    setSteamGridDbKeyDraft, setStickSample, setTestLocked, settingsFocusTarget,
    settingsFocusTimerRef, settingsPath, setTriggerEffectIntensityValue, setTriggerIntensityPreset,
    setTriggerProfileDeleteConfirm, setTriggerProfileDraft, setTriggerProfileEditingState,
    setTriggerProfileEngineStatus, setTriggerProfileLibraryCatalog,
    setTriggerProfileLibraryInstallErrors, setTriggerProfileLibraryInstalling,
    setTriggerProfileLibraryLoading, setTriggerProfileLibraryOpen, setTriggerProfileLibraryQuery,
    setTriggerProfileModifiersOpen, setTriggerProfileProcessNamesInput,
    setTriggerProfileResetConfirm, setTriggerProfileResetting, setTriggerProfiles,
    setTriggerProfilesEnabled, setTriggerProfilesLinked, setTriggerProfileTransferStatus,
    setTriggerStripActionsWidth, setTriggerStripWidth, setTriggerTest, setTriggerTestRunning,
    setUninstallDialog, setUpdateState, setVdsAudioStats, setVdsDaemonLog, setVdsDiagnostics,
    setVdsTrace, setVdsTracePending, setVdsVersion, setWindowDragging, showBridgeSettings,
    showClassicRumbleControl, showCustomColorPicker, showDiagnostics, showDualSenseEdgeRemapButtons,
    showMicrophoneControl, showNotificationsMenu, showTriggerProfileTransferStatus,
    sidebarBatteryLabel, sidebarDeviceStatus, sidebarDeviceTitle, sidebarDeviceTone,
    sidebarSignalBars, sidebarSignalLabel, sleepControllerSupported, sleepKeybindEnabled, snapshot,
    speakerEnabled, speakerGainLevel, speakerOutputAvailable, speakerOutputMissing,
    speakerStatusLabel, speakerStatusReady, speakerStatusTone, speakerTestError, speakerTestLocked,
    speakerVolumeCommitPending, speakerVolumeEditingRef, speakerVolumeSupported, speakerVolumeValue,
    startChordAssignmentPointerDrag, startChordAssignmentScrollbarDrag, startupReadyArmedRef,
    startupReadyTimerRef, startupTheme, startupTutorialFeatureActive, startupTutorialOpen,
    startupTutorialStep, startupVisible, statusTone, steamGridDbKeyDraft, stickSample,
    stickWheelActive, stopTriggerTest, submitChordFunctionDialog, submitControllerProfileDialog,
    submitGameCreate, submitRemapProfileDialog, supportedHostPersonaModes, systemHealthTone,
    testHapticsUnavailable, testLocked, testMicUnavailable, testNotifications, testRumbleUnavailable,
    testSpeakerUnavailable, toggleAdaptiveTriggersEnabled, toggleAudioEnabled,
    toggleAudioHapticsFeature, toggleAudioReactiveHapticsEnabled, toggleChargeCompleteNotifications,
    toggleChordFunctionKeyboardModifier, toggleClassicRumbleEnabled, toggleClassicRumbleV1Enabled,
    toggleControllerNotifications, toggleDuplexMicEnabled, toggleFeedbackBoostEnabled,
    toggleHapticsEnabled, toggleLargerAudioBlocks, toggleLightbarEnabled,
    toggleLowBatteryNotifications, toggleMicMute, toggleSpeakerEnabled, toggleTriggerProfilesEnabled,
    toggleTriggerProfilesLinked, triggerEffectEditingRef, triggerEffectIntensityValue,
    triggerProfileDeleteConfirm, triggerProfileDraft, triggerProfileEditingState,
    triggerProfileEngineStatus, triggerProfileLibraryCatalog, triggerProfileLibraryInstallErrors,
    triggerProfileLibraryInstalling, triggerProfileLibraryLoading, triggerProfileLibraryOpen,
    triggerProfileLibraryQuery, triggerProfileLibraryRows, triggerProfileModifiersOpen,
    triggerProfileNameById, triggerProfilePreviewArmedRef, triggerProfileProcessNamesInput,
    triggerProfileResetConfirm, triggerProfileResetting, triggerProfiles, triggerProfilesEnabled,
    triggerProfilesLinked, triggerProfileTransferStatus, triggerProfileTransferStatusTimeout,
    triggerStripActionsRef, triggerStripActionsWidth, triggerStripProfiles, triggerStripRef,
    triggerStripWidth, triggerTest, triggerTestRunning, triggerTestTimerRef, triggerTraceText,
    uninstallDialog, updateChordAssignmentButton, updateChordAssignmentDraftButton,
    updateChordAssignmentDraftFunction, updateChordAssignmentDraftStarter,
    updateChordAssignmentDropTarget, updateChordAssignmentScrollbar, updateChordAssignmentStarter,
    updateState, updateStickWheelSynced, updateTriggerProfileSlot, updateTriggerProfileSwitching,
    updateTriggerProfileSwitchRule, usbSuspendDisconnectSupported, userControllerProfiles,
    vdsAudioStats, vdsDaemonLog, vdsDaemonLogRef, vdsDiagnostics, vdsTracePending, vdsVersion,
    windowDragging, windowDraggingRef, windowDragReleaseTimerRef
  };
}

export type AppState = ReturnType<typeof useAppState>;
