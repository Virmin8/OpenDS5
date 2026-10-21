import type { TablerIcon } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';
import type {
  BridgeStatusPayload,
  ChordAssignableButtonId,
  ChordControllerSettingAction,
  ChordFunctionType,
  ChordMediaAction,
  ChordStarterId,
  RemapButtonId
} from '../../shared/protocol';
import type { TriggerProfile } from '../../shared/trigger-profiles';
import type { CHORD_UNASSIGNED_BUTTON } from './chords';

export type ControlTab = 'game-profile' | 'overview' | 'haptics' | 'audio' | 'triggers' | 'trigger-profiles' | 'lighting' | 'remapping' | 'chords' | 'system' | 'vds';
export type StartupTutorialStep = 'feature-toggle' | 'done';
export type ControllerType = BridgeStatusPayload['controllerType'];
export type KnownControllerType = Exclude<ControllerType, 'unknown'>;
export type RemapButtonDefinition = {
  id: RemapButtonId;
  label: string;
  glyphUrl?: string;
  textGlyph?: string;
};
export type ChordStarterDefinition = {
  id: ChordStarterId;
  label: string;
  glyphUrl?: string;
  textGlyph?: string;
  Icon?: TablerIcon;
};
export type TargetOnlyRemapButtonId = Extract<RemapButtonId, 'ps'>;
export type SourceRemapButtonId = Exclude<RemapButtonId, TargetOnlyRemapButtonId>;
export type DualSenseEdgeRemapButtonId = Extract<SourceRemapButtonId, 'lb' | 'rb' | 'lfn' | 'rfn'>;
export type StandardRemapButtonId = Exclude<SourceRemapButtonId, DualSenseEdgeRemapButtonId>;
export type RemapProfileDialogMode = 'save' | 'rename' | 'delete';
export type ControllerProfileDialogMode = 'save' | 'rename' | 'delete';
export type ChordFunctionDraft = {
  id: string;
  name: string;
  type: ChordFunctionType;
  keyboardKey: string;
  keyboardModifiers: ChordKeyboardModifier[];
  mediaAction: ChordMediaAction;
  controllerAction: ChordControllerSettingAction;
  controllerStepPercent: number;
};
export type ChordKeyboardModifier = 'Ctrl' | 'Shift' | 'Alt' | 'Win';
export type ChordNotchTargetId = 'speaker' | 'mic' | 'haptics' | 'rumble' | 'triggers' | 'lighting';
export type ChordNotchDirection = 'down' | 'up';
export type ChordNotchAction = Extract<ChordControllerSettingAction, `${ChordNotchTargetId}-${ChordNotchDirection}`>;
export type ChordControllerSettingSelectValue = Exclude<ChordControllerSettingAction, ChordNotchAction> | ChordNotchTargetId;
export type ChordFunctionDialogMode = 'rename' | 'delete';
export type ChordFunctionDialogState = {
  mode: ChordFunctionDialogMode;
  functionId: string;
};
export type ChordButtonSelectValue = ChordAssignableButtonId | typeof CHORD_UNASSIGNED_BUTTON;
export type ChordAssignmentDraftRow = {
  id: string;
  starter: ChordStarterId;
  button: ChordAssignableButtonId | null;
  functionId: string;
};
export type ChordAssignmentDropHint = {
  targetId: string;
  placement: 'before' | 'after';
};
export type ChordAssignmentDragSession = {
  active: boolean;
  id: string;
  offsetX: number;
  offsetY: number;
  overlay: HTMLElement | null;
  startX: number;
  startY: number;
  cleanup: () => void;
  dropHint: ChordAssignmentDropHint | null;
};
export type ChordAssignmentScrollbarState = {
  visible: boolean;
  top: number;
  height: number;
};
export type TriggerProfileSlotKey = 'l2' | 'r2';
export type TriggerProfileDeleteConfirmState = {
  id: string;
  name: string;
};
export type RemapCalloutLayout = {
  top: number;
  points: string;
};
export type EdgeRemapControlLayout = {
  left: number;
  top: number;
  anchor: 'top' | 'bottom';
  linePoints: string;
};
export type LightbarPaletteCell = {
  color: string;
  name: string;
};
export type FeatureTipsPanelProps = {
  tab: 'audio' | 'haptics' | 'triggers' | 'lighting';
  onSettingsFocusRequest?: (target: SettingsFocusTarget) => void;
  audioHapticsOpen?: boolean;
};
export type SettingsFocusTarget = 'controller-power-saving' | 'sleep-shortcut' | 'volume-shortcut' | 'profile-shortcut';
export type NotificationFocusTarget = 'controller-status' | 'low-battery' | 'charge-complete' | 'weak-signal' | 'all';
export type ChordNotchTarget = {
  id: ChordNotchTargetId;
  label: string;
  downAction: ChordNotchAction;
  upAction: ChordNotchAction;
};

export type SelectValue = string | number;
export type SinkSelectableAudio = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
  sinkId?: string;
};

export type CustomSelectProps<T extends SelectValue> = {
  value: T;
  options: Array<[string, T]>;
  disabled?: boolean;
  className?: string;
  floatingMenu?: boolean;
  floatingMenuMinWidth?: number;
  suspendOutsideClose?: boolean;
  showSelectedCheck?: boolean;
  closeOnSelect?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  getOptionClassName?: (label: string, value: T) => string | undefined;
  renderValue?: (label: string, value: T) => ReactNode;
  renderOption?: (label: string, value: T) => ReactNode;
  renderMenuFooter?: (closeMenu: () => void) => ReactNode;
  ariaLabel: string;
  onChange: (value: T) => void;
};

export type CustomSelectMenuStyle = CSSProperties & {
  '--custom-select-menu-max-height'?: string;
};

export type TriggerStripChipSelection = {
  chips: TriggerProfile[];
  overflow: TriggerProfile[];
};
