import {
  IconArrowRight as ArrowRight,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconHeadphones as Headphones,
  IconBatteryEco,
  IconBrandDeezer,
  IconBrandXbox,
  IconBulb,
  IconDeviceAudioTape,
  IconQuestionMark,
  IconSparkleHighlight,
  IconPalette as Palette,
  IconPlayerPlay as Play,
  IconAdjustmentsHorizontal as Settings2,
  IconSparkles as Sparkles,
  IconVolume as Volume2
} from '@tabler/icons-react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import playStationLogoUrl from '../../../../assets/brand/playstation-logo.svg';
import dpadDownGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Down.svg';
import dpadLeftGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Left.svg';
import dpadRightGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Right.svg';
import dpadUpGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Up.svg';
import psHomeGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import touchpadPressGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Touch Pad Press.svg';
import triangleGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Triangle.svg';
import type {
  ChordStarterId,
  ControllerProfileSettings,
  HostPersonaMode,
  RemapButtonId
} from '../../shared/protocol';
import type { AudioHapticsSession, UiThemePreset } from '../../shared/types';
import { UI_THEME_PREVIEW_SWATCHES } from '../ui-themes';
import { CHORD_STARTERS, CHORD_UNASSIGNED_BUTTON } from './chords';
import {
  CONTROLLER_POWER_SAVING_CAP_PERCENT,
  enabledLabel,
  filterSelectOptionsByLabel,
  muteButtonSummary,
  optionLabel,
  percentLabel,
  POLLING_RATE_OPTIONS,
  SHORTCUT_MODIFIER_LABEL,
  VDS_AVAILABLE
} from './common';
import { lightbarColorLabel } from './lighting';
import { REMAP_BUTTONS } from './remap';
import type {
  ChordButtonSelectValue,
  CustomSelectMenuStyle,
  CustomSelectProps,
  FeatureTipsPanelProps,
  RemapButtonDefinition,
  SelectValue
} from './types';

export function ShortcutModifierGlyph() {
  return (
    <span className="shortcut-glyph-key">
      {VDS_AVAILABLE
        ? <img src={touchpadPressGlyphUrl} alt="Touchpad press" />
        : <img src={psHomeGlyphUrl} alt="PlayStation Home" />}
    </span>
  );
}

export function TurnOffShortcutGlyphs() {
  return (
    <span className="shortcut-glyph-row" aria-label={`${SHORTCUT_MODIFIER_LABEL} and Triangle`}>
      <ShortcutModifierGlyph />
      <span className="shortcut-plus" aria-hidden="true">+</span>
      <span className="shortcut-glyph-key">
        <img src={triangleGlyphUrl} alt="Triangle" />
      </span>
    </span>
  );
}

export function DpadShortcutGlyphs({ pair }: { pair: 'up-down' | 'left-right' }) {
  const [first, second] = pair === 'up-down'
    ? [{ src: dpadUpGlyphUrl, alt: 'D-pad Up' }, { src: dpadDownGlyphUrl, alt: 'D-pad Down' }]
    : [{ src: dpadLeftGlyphUrl, alt: 'D-pad Left' }, { src: dpadRightGlyphUrl, alt: 'D-pad Right' }];
  return (
    <span className="shortcut-glyph-row" aria-label={`${SHORTCUT_MODIFIER_LABEL} and ${first.alt} or ${second.alt}`}>
      <ShortcutModifierGlyph />
      <span className="shortcut-plus" aria-hidden="true">+</span>
      <span className="shortcut-glyph-pair">
        <span className="shortcut-glyph-key">
          <img src={first.src} alt={first.alt} />
        </span>
        <span className="shortcut-glyph-key">
          <img src={second.src} alt={second.alt} />
        </span>
      </span>
    </span>
  );
}

export function StartupScreen({ ready }: { ready: boolean }) {
  return (
    <main className={`startup-screen ${ready ? 'ready' : ''}`} aria-live="polite">
      <section className="startup-card" aria-label="Starting OpenDS5">
        <div className="startup-brand">
          <div>
            <strong>OpenDS5</strong>
            <span>Starting companion</span>
          </div>
        </div>
        <div className="startup-progress" aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}

export function StartupTutorial({
  featureExampleActive,
  onFeatureExampleToggle,
  onFinish
}: {
  featureExampleActive: boolean;
  onFeatureExampleToggle: () => void;
  onFinish: () => void;
}) {
  return (
    <div className="modal-backdrop startup-tutorial-backdrop" role="presentation">
      <section
        className="settings-menu bridge-settings-modal startup-tutorial-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Feature tile tutorial"
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            <IconSparkleHighlight size={16} />
            <span>Feature Tiles</span>
          </div>
        </div>
        <div className="startup-tutorial-copy">
          <h2>Click The Square</h2>
          <p>Feature tiles turn effects on and off. Try it once here, then keep going.</p>
        </div>
        <div className="startup-tutorial-feature-demo">
          <button
            className={`startup-tutorial-feature-icon ${featureExampleActive ? 'active' : ''}`}
            type="button"
            aria-pressed={featureExampleActive}
            aria-label="Toggle example effect"
            onClick={onFeatureExampleToggle}
          >
            <IconSparkleHighlight size={24} />
          </button>
          <span>
            <strong>Example Effect</strong>
            <span>{featureExampleActive ? 'On' : 'Off'}</span>
          </span>
        </div>
        <div className="startup-tutorial-actions">
          <button
            type="button"
            className="primary-action"
            disabled={!featureExampleActive}
            onClick={onFinish}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export function ProfileSaveStatus() {
  return (
    <div className="system-profile-save-status">
      <span className="autosave-check-icon" aria-hidden="true">
        <Check className="autosave-check-outline" size={16} />
        <Check className="autosave-check-fill" size={16} />
      </span>
      <span>Changes Are Automatically Saved</span>
    </div>
  );
}

export function FeatureTipsPanel({
  tab,
  onSettingsFocusRequest,
  audioHapticsOpen = false
}: FeatureTipsPanelProps) {
  const [featureTileSampleActive, setFeatureTileSampleActive] = useState(false);
  const tips: Array<{
    key: string;
    icon: ReactNode;
    title: string;
    text: string;
    tone?: 'success';
  }> = [
    {
      key: 'toggle',
      icon: <IconSparkleHighlight size={16} />,
      title: 'Feature Tiles',
      text: 'Click the square icon tile to enable or disable that feature.'
    },
    {
      key: 'unavailable',
      icon: <Settings2 size={16} />,
      title: 'Unavailable',
      text: 'Dimmed controls need the bridge, controller, or matching feature enabled.'
    }
  ];

  if (tab === 'haptics' && audioHapticsOpen) {
    tips.push({
      key: 'audio-haptics',
      icon: <IconDeviceAudioTape size={16} />,
      title: 'Audio Haptics',
      text: 'Audio Haptics turns system audio into haptic feedback.'
    });
  } else if (tab === 'audio') {
    tips.push({
      key: 'headphones',
      icon: <Headphones size={16} />,
      title: 'Headphones',
      text: 'Headphones use the same bridge-local audio path as the controller speaker.'
    });
  } else {
    tips.push({
      key: 'power-saving',
      icon: <IconBatteryEco size={16} />,
      title: 'Green Icon',
      text: 'Power saving is temporarily capping this setting while headphones are connected.',
      tone: 'success'
    });
  }

  if (tab === 'haptics' && audioHapticsOpen) {
    tips.push({
      key: 'audio-haptics-mode',
      icon: <IconBrandDeezer size={16} />,
      title: 'Mix / Replace',
      text: 'Mix adds audio feedback to native haptics and rumble; Replace uses only the derived audio feel.'
    });
  } else if (tab === 'lighting') {
    tips.push({
      key: 'custom-color',
      icon: <Palette size={16} />,
      title: 'Custom Color',
      text: 'Double-click the final color swatch to choose a custom lightbar color.'
    });
  } else if (tab !== 'triggers') {
    // The triggers tab has no tests any more -- it is enable/disable plus intensity.
    tips.push({
      key: 'tests',
      icon: <Play size={16} />,
      title: 'Tests',
      text: 'Tests may pause while a game or audio stream is actively using the controller.'
    });
  }

  return (
    <section className="feature-help-panel" aria-label={`${tab} tips`}>
      <div className="feature-help-heading">
        <IconQuestionMark size={16} />
        <h3>Tips</h3>
      </div>
      <div className="feature-help-grid">
        {tips.map((tip) => (
          <div
            className="feature-help-item"
            key={tip.key}
          >
            {tip.key === 'toggle' ? (
              <button
                className={`feature-help-icon feature-help-icon-button ${featureTileSampleActive ? 'active' : ''}`}
                type="button"
                aria-pressed={featureTileSampleActive}
                aria-label="Toggle feature tile example"
                onClick={() => setFeatureTileSampleActive((active) => !active)}
              >
                {tip.icon}
              </button>
            ) : tip.key === 'power-saving' ? (
              <button
                className={`feature-help-icon feature-help-icon-button ${tip.tone ?? ''}`}
                type="button"
                aria-label="Open Controller Power Saving settings"
                onClick={() => onSettingsFocusRequest?.('controller-power-saving')}
              >
                {tip.icon}
              </button>
            ) : (
              <span className={`feature-help-icon ${tip.tone ?? ''}`} aria-hidden="true">
                {tip.icon}
              </span>
            )}
            <span className="feature-help-copy">
              <strong>{tip.title}</strong>
              <span>{tip.text}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SystemProfileSummary({
  settings,
  powerSavingActive
}: {
  settings: ControllerProfileSettings;
  powerSavingActive: boolean;
}) {
  const ecoValueClass = (active: boolean) => (active ? ' eco-limited' : '');
  const effectiveEcoPercent = (value: number) => percentLabel(Math.min(value, CONTROLLER_POWER_SAVING_CAP_PERCENT));
  const hapticsEcoLimited = powerSavingActive
    && settings.hapticsEnabled
    && settings.hapticsGainPercent > 0;
  const rumbleEcoLimited = powerSavingActive
    && settings.classicRumbleEnabled
    && settings.classicRumbleGainPercent > 0;
  const triggersEcoLimited = powerSavingActive
    && settings.adaptiveTriggersEnabled
    && settings.triggerEffectIntensityPercent > 0;
  const lightbarEcoLimited = powerSavingActive
    && settings.lightbarEnabled
    && settings.lightbarBrightnessPercent > 0;

  return (
    <div className="system-profile-summary" aria-label="Current profile settings">
      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <Volume2 size={15} />
          <h3>Audio</h3>
        </div>
        <dl>
          <div><dt>Speaker</dt><dd>{settings.speakerEnabled ? percentLabel(settings.speakerVolumePercent) : 'Off'}</dd></div>
          <div><dt>Mic</dt><dd>{settings.micMuted ? 'Muted' : percentLabel(settings.micVolumePercent)}</dd></div>
          <div><dt>Pass-through</dt><dd>{enabledLabel(settings.duplexMicEnabled)}</dd></div>
        </dl>
      </div>

      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <Sparkles size={15} />
          <h3>Feel</h3>
        </div>
        <dl>
          <div><dt>HD Haptics</dt><dd className={ecoValueClass(hapticsEcoLimited)}>{settings.hapticsEnabled ? (hapticsEcoLimited ? effectiveEcoPercent(settings.hapticsGainPercent) : percentLabel(settings.hapticsGainPercent)) : 'Off'}</dd></div>
          <div><dt>Rumble</dt><dd className={ecoValueClass(rumbleEcoLimited)}>{settings.classicRumbleEnabled ? (rumbleEcoLimited ? effectiveEcoPercent(settings.classicRumbleGainPercent) : percentLabel(settings.classicRumbleGainPercent)) : 'Off'}</dd></div>
          <div><dt>Triggers</dt><dd className={ecoValueClass(triggersEcoLimited)}>{settings.adaptiveTriggersEnabled ? (triggersEcoLimited ? effectiveEcoPercent(settings.triggerEffectIntensityPercent) : percentLabel(settings.triggerEffectIntensityPercent)) : 'Off'}</dd></div>
        </dl>
      </div>

      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <IconBulb size={15} />
          <h3>Lighting</h3>
        </div>
        <dl>
          <div><dt>Lightbar</dt><dd className={ecoValueClass(lightbarEcoLimited)}>{settings.lightbarEnabled ? (lightbarEcoLimited ? effectiveEcoPercent(settings.lightbarBrightnessPercent) : percentLabel(settings.lightbarBrightnessPercent)) : 'Off'}</dd></div>
          <div><dt>Color</dt><dd>{lightbarColorLabel(settings.lightbarColor)}</dd></div>
          <div><dt>Override</dt><dd>{enabledLabel(settings.lightbarOverrideEnabled)}</dd></div>
        </dl>
      </div>

      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <Settings2 size={15} />
          <h3>System</h3>
        </div>
        <dl>
          <div><dt>Mute</dt><dd>{muteButtonSummary(settings)}</dd></div>
          {!VDS_AVAILABLE && (
            <div><dt>Polling</dt><dd>{optionLabel(POLLING_RATE_OPTIONS, settings.pollingRateMode)}</dd></div>
          )}
          <div><dt>Power Save</dt><dd>{enabledLabel(settings.controllerPowerSavingEnabled)}</dd></div>
        </dl>
      </div>
    </div>
  );
}

export function CustomSelect<T extends SelectValue>({
  value,
  options,
  disabled = false,
  className = '',
  floatingMenu = false,
  floatingMenuMinWidth,
  suspendOutsideClose = false,
  showSelectedCheck = true,
  closeOnSelect = true,
  searchable = false,
  searchPlaceholder,
  getOptionClassName,
  renderValue,
  renderOption,
  renderMenuFooter,
  ariaLabel,
  onChange
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selected = options.find(([, optionValue]) => optionValue === value);
  const visibleOptions = searchable ? filterSelectOptionsByLabel(options, searchQuery) : options;
  const longList = options.length > 18;
  const defaultMenuMaxHeight = longList ? 360 : 232;
  const [menuMaxHeight, setMenuMaxHeight] = useState(defaultMenuMaxHeight);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');
  const [floatingMenuStyle, setFloatingMenuStyle] = useState<CustomSelectMenuStyle>({});

  function updateMenuMaxHeight() {
    const root = rootRef.current;
    if (!root) {
      setMenuMaxHeight(defaultMenuMaxHeight);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const boundary = floatingMenu
      ? null
      : root.closest('.system-card, .feature-card, .settings-menu, .control-page') as HTMLElement | null;
    const boundaryRect = boundary?.getBoundingClientRect();
    const menuGap = 6;
    const viewportPadding = floatingMenu ? 8 : 0;
    const lowerLimit = Math.min(window.innerHeight - viewportPadding, boundaryRect?.bottom ?? window.innerHeight);
    const upperLimit = Math.max(viewportPadding, boundaryRect?.top ?? 0);
    const spaceBelow = Math.max(1, Math.floor(lowerLimit - rootRect.bottom - menuGap));
    const spaceAbove = Math.max(1, Math.floor(rootRect.top - upperLimit - menuGap));
    const preferredVisibleHeight = Math.min(defaultMenuMaxHeight, 184);
    const nextPlacement = spaceBelow < preferredVisibleHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const availableSpace = nextPlacement === 'top' ? spaceAbove : spaceBelow;
    const nextMaxHeight = longList ? availableSpace : Math.min(defaultMenuMaxHeight, availableSpace);

    setMenuPlacement(nextPlacement);
    setMenuMaxHeight(Math.max(1, nextMaxHeight));

    if (floatingMenu) {
      const minimumWidth = floatingMenuMinWidth ?? rootRect.width;
      const width = Math.min(
        Math.max(rootRect.width, minimumWidth),
        Math.max(1, window.innerWidth - viewportPadding * 2)
      );
      const idealLeft = rootRect.left + (rootRect.width - width) / 2;
      const left = Math.min(
        Math.max(viewportPadding, idealLeft),
        Math.max(viewportPadding, window.innerWidth - viewportPadding - width)
      );
      setFloatingMenuStyle({
        left: `${Math.round(left)}px`,
        width: `${Math.round(width)}px`,
        ...(nextPlacement === 'top'
          ? { bottom: `${Math.round(window.innerHeight - rootRect.top + menuGap)}px` }
          : { top: `${Math.round(rootRect.bottom + menuGap)}px` }),
        '--custom-select-menu-max-height': `${Math.max(1, nextMaxHeight)}px`
      });
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    function closeIfOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !suspendOutsideClose
        && !rootRef.current?.contains(target)
        && !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', closeIfOutside);
    return () => document.removeEventListener('mousedown', closeIfOutside);
  }, [open, suspendOutsideClose]);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuMaxHeight();
    window.addEventListener('resize', updateMenuMaxHeight);
    window.addEventListener('scroll', updateMenuMaxHeight, true);
    return () => {
      window.removeEventListener('resize', updateMenuMaxHeight);
      window.removeEventListener('scroll', updateMenuMaxHeight, true);
    };
  }, [open, defaultMenuMaxHeight, floatingMenu, floatingMenuMinWidth, longList]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }
    if (searchable) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      const menu = menuRef.current;
      const optionsContainer = menu?.querySelector('.custom-select-menu-options') as HTMLElement | null;
      const selectedElement = menu?.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (!optionsContainer || !selectedElement) {
        return;
      }
      const selectedCenter = selectedElement.offsetTop + selectedElement.offsetHeight / 2;
      optionsContainer.scrollTop = Math.max(0, selectedCenter - optionsContainer.clientHeight / 2);
    });
  }, [open]);

  function choose(nextValue: T) {
    if (closeOnSelect) {
      setOpen(false);
    }
    if (nextValue !== value) {
      onChange(nextValue);
    }
  }

  function toggleOpen() {
    if (!open) {
      updateMenuMaxHeight();
    }
    setOpen((nextOpen) => !nextOpen);
  }

  function openMenu() {
    updateMenuMaxHeight();
    setOpen(true);
  }

  const menu = open ? (
    <div ref={menuRef} className="custom-select-menu" role="listbox" aria-label={ariaLabel}>
      {searchable && (
        <div className="custom-select-menu-search">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            placeholder={searchPlaceholder ?? 'Search'}
            aria-label={`${ariaLabel} search`}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setOpen(false);
              }
            }}
          />
        </div>
      )}
      <div className="custom-select-menu-options">
        {searchable && visibleOptions.length === 0 && (
          <div className="custom-select-menu-empty">No matches</div>
        )}
        {visibleOptions.map(([label, optionValue]) => {
          const selectedOption = optionValue === value;
          const optionClassName = getOptionClassName?.(label, optionValue);
          return (
            <button
              key={String(optionValue)}
              type="button"
              role="option"
              aria-selected={selectedOption}
              data-selected={selectedOption ? 'true' : undefined}
              className={[selectedOption ? 'selected' : '', optionClassName].filter(Boolean).join(' ')}
              onClick={() => choose(optionValue)}
            >
              <span>{renderOption?.(label, optionValue) ?? label}</span>
              {showSelectedCheck && selectedOption && <Check size={15} />}
            </button>
          );
        })}
      </div>
      {renderMenuFooter && (
        <div className="custom-select-menu-footer">
          {renderMenuFooter(() => setOpen(false))}
        </div>
      )}
    </div>
  ) : null;

  const portalTarget = floatingMenu
    ? (rootRef.current?.closest('.shell') as HTMLElement | null) ?? document.body
    : null;

  return (
    <div
      ref={rootRef}
      className={`custom-select ${className} ${open ? 'open' : ''} menu-${menuPlacement} ${disabled ? 'disabled' : ''}`}
      style={{ '--custom-select-menu-max-height': `${menuMaxHeight}px` } as CSSProperties}
    >
      <button
        type="button"
        className="custom-select-button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMenu();
          }
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        <span>{selected ? (renderValue?.(selected[0], selected[1]) ?? selected[0]) : String(value)}</span>
        <ChevronDown size={18} />
      </button>
      {floatingMenu && portalTarget && menu
        ? createPortal(
          <div
            className={`custom-select custom-select-floating-layer open menu-${menuPlacement} ${suspendOutsideClose ? 'dialog-suspended' : ''} ${className}`}
            style={floatingMenuStyle}
          >
            {menu}
          </div>,
          portalTarget
        )
        : menu}
    </div>
  );
}

export function ThemeOption({ label, value }: { label: string; value: UiThemePreset }) {
  return (
      <span className="theme-option">
        <span className="theme-option-swatches" aria-hidden="true">
        {UI_THEME_PREVIEW_SWATCHES[value].map((swatch) => (
          <span key={`${value}-${swatch.role}`} title={swatch.role} style={{ background: swatch.color }} />
        ))}
      </span>
      <span className="theme-option-label">{label}</span>
    </span>
  );
}

export function AudioHapticsConfigLabel({
  id,
  label,
  tooltip,
  className = '',
  showQuestionMark = false
}: {
  id: string;
  label: string;
  tooltip: string;
  className?: string;
  showQuestionMark?: boolean;
}) {
  return (
    <span className={`audio-haptics-config-label ${className}`.trim()} tabIndex={0} aria-describedby={id}>
      {label}
      {showQuestionMark ? <IconQuestionMark size={12} stroke={3} aria-hidden="true" /> : null}
      <span id={id} className="settings-shortcut-tooltip shortcut-glyph-tooltip audio-haptics-config-tooltip" role="tooltip">
        {tooltip}
      </span>
    </span>
  );
}

export function UptimeValue({
  active,
  lastPollAt,
  uptimeSeconds
}: {
  active: boolean;
  lastPollAt: number | null;
  uptimeSeconds: number | null;
}) {
  const [displayUptime, setDisplayUptime] = useState<number | null>(uptimeSeconds);

  useEffect(() => {
    if (!active || !lastPollAt || uptimeSeconds === null) {
      setDisplayUptime(uptimeSeconds);
      return;
    }

    const updateUptime = () => {
      const elapsedSeconds = Math.floor((Date.now() - lastPollAt) / 1000);
      setDisplayUptime(uptimeSeconds + Math.max(0, elapsedSeconds));
    };

    updateUptime();
    const handle = window.setInterval(updateUptime, 1000);
    return () => window.clearInterval(handle);
  }, [active, lastPollAt, uptimeSeconds]);

  return <span className="uptime-value">{displayUptime ?? '--'}s</span>;
}

export function RemapGlyphOption({ label, value }: { label: string; value: RemapButtonId }) {
  const button = REMAP_BUTTONS[value];

  return (
    <span className="remap-glyph-option" title={label}>
      {button.glyphUrl ? (
        <img src={button.glyphUrl} alt={label} />
      ) : (
        <span className="remap-text-glyph" aria-hidden="true">{button.textGlyph ?? button.label}</span>
      )}
    </span>
  );
}

export function RemapSourceGlyph({ button }: { button: RemapButtonDefinition }) {
  return button.glyphUrl ? (
    <img src={button.glyphUrl} alt={button.label} title={button.label} />
  ) : (
    <span className="remap-text-glyph remap-text-glyph-source" title={button.label}>
      {button.textGlyph ?? button.label}
    </span>
  );
}

export function ChordStarterGlyph({ starter, label = CHORD_STARTERS[starter].label }: { starter: ChordStarterId; label?: string }) {
  const button = CHORD_STARTERS[starter];
  const Icon = button.Icon;

  return Icon ? (
    <span className="chords-unassigned-glyph chords-starter-icon-glyph" title={label} aria-label={label}>
      <Icon size={18} />
    </span>
  ) : button.glyphUrl ? (
    <img src={button.glyphUrl} alt={label} title={label} />
  ) : (
    <span className="remap-text-glyph remap-text-glyph-source" title={label}>
      {button.textGlyph ?? button.label}
    </span>
  );
}

export function ChordStarterGlyphOption({ label, value }: { label: string; value: ChordStarterId }) {
  return (
    <span className="chords-starter-glyph-option" title={label}>
      <ChordStarterGlyph starter={value} label={label} />
    </span>
  );
}

export function ChordButtonGlyphOption({ label, value }: { label: string; value: ChordButtonSelectValue }) {
  if (value === CHORD_UNASSIGNED_BUTTON) {
    return (
      <span className="chords-unassigned-glyph" title={label} aria-label={label}>
        <IconQuestionMark size={16} />
      </span>
    );
  }

  return <RemapGlyphOption label={label} value={value} />;
}

export function HostPersonaBrandIcon({ mode, size }: { mode: HostPersonaMode; size: number }) {
  if (mode === 'xbox') {
    return <IconBrandXbox size={size} aria-hidden="true" />;
  }
  return (
    <span
      className="host-persona-brand-icon"
      style={{
        '--host-persona-brand-mask': `url("${playStationLogoUrl}")`,
        width: size,
        height: size,
        flex: `0 0 ${size}px`
      } as CSSProperties}
      aria-hidden="true"
    />
  );
}

export function HostPersonaOption({ label, value }: { label: string; value: HostPersonaMode }) {
  const sonyPersona = value === 'dualsense' || value === 'ds4';
  return (
    <span className="host-persona-option">
      {sonyPersona ? (
        <span
          className="host-persona-brand-icon"
          style={{ '--host-persona-brand-mask': `url("${playStationLogoUrl}")` } as CSSProperties}
          aria-hidden="true"
        />
      ) : (
        <IconBrandXbox size={18} aria-hidden="true" />
      )}
      <span className="host-persona-label">{label}</span>
    </span>
  );
}

export function AudioHapticsSourceOption({
  label,
  value,
  session,
  loading
}: {
  label: string;
  value: string;
  session?: AudioHapticsSession;
  loading?: boolean;
}) {
  const system = value === 'system-audio';
  const unavailable = !system && !session;
  let sublabel = 'System mix';
  if (!system) {
    if (!session) {
      sublabel = loading ? 'Scanning' : 'Unavailable';
    } else {
      sublabel = session.state === 'active'
        ? session.endpointName || 'Active'
        : 'Idle';
    }
  }
  return (
    <span className={`audio-haptics-source-option ${unavailable ? 'unavailable' : ''}`}>
      <span className="audio-haptics-source-icon" aria-hidden="true">
        {system ? (
          <IconDeviceAudioTape size={17} />
        ) : session?.iconDataUrl ? (
          <img src={session.iconDataUrl} alt="" />
        ) : (
          <IconBrandDeezer size={17} />
        )}
      </span>
      <span className="audio-haptics-source-copy">
        <strong>{label}</strong>
        <small>{sublabel}</small>
      </span>
    </span>
  );
}
