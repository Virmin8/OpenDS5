import {
  IconActivity as Activity,
  IconChevronDown as ChevronDown,
  IconBooks,
  IconDeviceGamepad2,
  IconDownload,
  IconTargetArrow,
  IconUpload,
  IconLink as LinkIcon,
  IconLinkOff as LinkOffIcon,
  IconPencil as Pencil,
  IconPlus as Plus,
  IconRefresh as RefreshCcw,
  IconDeviceFloppy as Save,
  IconTrash as Trash2,
  IconX as X
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import l2GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/L2.svg';
import r2GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/R2.svg';
import {
  type InputConditionType,
  MAX_STATE_NAME_LENGTH,
  MAX_STATES_PER_PROFILE
} from '../../shared/trigger-profiles';
import { CONTROLLER_INPUT_AVAILABLE } from '../app/common';
import { CustomSelect } from '../app/components';
import { clampByte } from '../app/lighting';
import {
  defaultTriggerEffectSpec,
  defaultTriggerModifier,
  editingStateTriggers,
  formatEngineStatusLine,
  pickTriggerStripChips,
  STATE_SWITCH_ACTION_OPTIONS,
  STATE_SWITCH_BUTTON_GLYPHS,
  STATE_SWITCH_BUTTON_LABELS,
  STATE_SWITCH_BUTTON_OPTIONS,
  STATE_SWITCH_MENU_OPTIONS,
  TRIGGER_PROFILE_CONDITION_OPTIONS,
  TRIGGER_PROFILE_SLOTS,
  triggerStripMaxChips
} from '../app/triggers';
import type { AppState } from '../app/useAppState';
import { StickWheelEditor } from '../StickWheelEditor';
import { TriggerEffectEditor } from '../TriggerEffectEditor';

export function TriggerProfilesTab({ app }: { app: AppState }) {
  const {
    activeControlTab, addTriggerProfileState, createTriggerProfile, duplicateTriggerProfile,
    duplicateTriggerProfileState, exportTriggerProfileDraft, importTriggerProfilesFromDisk,
    moveTriggerProfileState, openTriggerProfileDeleteConfirm, openTriggerProfileLibrary,
    pinSelectedTriggerProfile, removeTriggerProfileState, renameTriggerProfileState, ruleCapture,
    saveTriggerProfileDraft, selectedTriggerProfileId, selectTriggerProfile, setRuleCapture,
    setTriggerProfileEditingState, setTriggerProfileModifiersOpen, setTriggerProfileResetConfirm,
    stickSample, toggleTriggerProfilesEnabled, toggleTriggerProfilesLinked, triggerProfileDraft,
    triggerProfileEditingState, triggerProfileEngineStatus, triggerProfileModifiersOpen,
    triggerProfileNameById, triggerProfilesEnabled, triggerProfilesLinked,
    triggerProfileTransferStatus, triggerStripActionsRef, triggerStripActionsWidth,
    triggerStripProfiles, triggerStripRef, triggerStripWidth, updateStickWheelSynced,
    updateTriggerProfileSlot, updateTriggerProfileSwitching, updateTriggerProfileSwitchRule
  } = app;

  return (
    <div
      className={`control-page trigger-profiles-page ${activeControlTab === 'trigger-profiles' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-trigger-profiles"
      aria-labelledby="control-tab-trigger-profiles"
      aria-hidden={activeControlTab !== 'trigger-profiles'}
    >
      <div className="feature-heading">
        <div>
          <h2>Game Trigger Profiles</h2>
          <p>Automatically switch adaptive trigger effects per game.</p>
        </div>
        <div
          className="trigger-profiles-heading-status"
          title={
            triggerProfileEngineStatus
              ? formatEngineStatusLine(
                  triggerProfileEngineStatus,
                  triggerProfileNameById(triggerProfileEngineStatus.activeProfileId)
                )
              : 'Waiting for engine status'
          }
        >
          <div className="trigger-profiles-status-group">
            <span className="overview-status-heading">
              <Activity size={14} />
              Engine
            </span>
            <span className="status-badge">
              <span
                className={`dot ${
                  triggerProfileEngineStatus && triggerProfileEngineStatus.enabled && !triggerProfileEngineStatus.suspended
                    ? 'good'
                    : 'warn'
                }`}
              />
              <strong>
                {!triggerProfileEngineStatus
                  ? 'Waiting for status'
                  : triggerProfileEngineStatus.suspended
                    ? 'Suspended'
                    : triggerProfileEngineStatus.enabled
                      ? 'Running'
                      : 'Disabled'}
              </strong>
            </span>
          </div>
        </div>
        <div className="inline-switch">
          <span>Game Trigger Profiles</span>
          <button
            type="button"
            role="switch"
            aria-checked={triggerProfilesEnabled}
            aria-label="Enable game trigger profiles"
            className={`switch ${triggerProfilesEnabled ? 'on' : ''}`}
            onClick={() => void toggleTriggerProfilesEnabled()}
          >
            <span />
          </button>
        </div>
      </div>

      <div className="feature-card-grid trigger-profiles-grid">
        {triggerProfileDraft ? (
          <section className="feature-card trigger-profiles-editor-card">
            <div className="feature-card-title">
              <span className="feature-icon"><Pencil size={20} /></span>
              <div className="title-copy">
                <h3>Editor</h3>
                <p>Shape the selected profile's trigger effects.</p>
                {triggerProfileDraft.meta?.source ? (
                  <p className="trigger-profiles-provenance">
                    {triggerProfileDraft.meta.source === 'library' ? 'From library' : 'Imported'}
                  </p>
                ) : null}
              </div>
              {/* .feature-card-title is a three-column grid, so the header's actions live in
                  one cell -- loose buttons overflow the template onto an implicit row. */}
              <div className="trigger-profiles-editor-header-actions">
                <div className="trigger-profiles-status-group trigger-profiles-editor-match-source">
                  <span className="overview-status-heading">
                    <IconDeviceGamepad2 size={14} />
                    Match Source
                  </span>
                  <span className="status-badge">
                    <strong>
                      {!triggerProfileEngineStatus
                        ? '—'
                        : triggerProfileEngineStatus.matchedBy === 'pin'
                          ? 'Pinned'
                          : triggerProfileEngineStatus.matchedBy === 'process'
                            ? `Process: ${triggerProfileEngineStatus.matchedName ?? 'unknown'}`
                            : 'Default fallback'}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="secondary-action trigger-profiles-transfer-button"
                  onClick={() => void importTriggerProfilesFromDisk()}
                >
                  <IconDownload size={14} />
                  Import
                </button>
                <button
                  type="button"
                  className="secondary-action trigger-profiles-transfer-button"
                  disabled={!triggerProfileDraft}
                  onClick={() => void exportTriggerProfileDraft()}
                >
                  <IconUpload size={14} />
                  Export
                </button>
                <button
                  type="button"
                  className="primary-action trigger-profiles-save-button"
                  onClick={() => void saveTriggerProfileDraft()}
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>

            <div className="trigger-profiles-editor-body">
            <div className="trigger-profiles-states-strip">
              <span className="trigger-profiles-states-label">States</span>
              {(triggerProfileDraft.states ?? []).map((state, index) => (
                <button
                  key={index}
                  type="button"
                  className={`trigger-lab-chip compact ${index === triggerProfileEditingState ? 'active' : ''}`}
                  aria-pressed={index === triggerProfileEditingState}
                  onClick={() => setTriggerProfileEditingState(index)}
                >
                  <span className="trigger-lab-chip-label">{state.name || `State ${index + 1}`}</span>
                </button>
              ))}
              {(triggerProfileDraft.states?.length ?? 0) < MAX_STATES_PER_PROFILE && (
                <button
                  type="button"
                  className="trigger-lab-chip compact trigger-profiles-state-add"
                  onClick={() => addTriggerProfileState()}
                >
                  <Plus size={13} />
                  <span className="trigger-lab-chip-label">
                    {triggerProfileDraft.states?.length ? 'Add state' : 'Add states'}
                  </span>
                </button>
              )}
              {!triggerProfileDraft.states?.length && (
                <span className="trigger-profiles-states-hint">
                  One feel for the whole game — add states for per-weapon or per-vehicle feels.
                </span>
              )}
            </div>
            {triggerProfileDraft.states && triggerProfileDraft.states[triggerProfileEditingState] && (
              <div className="trigger-profiles-state-row">
                <label className="trigger-profiles-state-name-field">
                  <span>State name</span>
                  <input
                    value={triggerProfileDraft.states[triggerProfileEditingState].name}
                    maxLength={MAX_STATE_NAME_LENGTH}
                    onChange={(event) => renameTriggerProfileState(triggerProfileEditingState, event.target.value)}
                  />
                </label>
                <label className="trigger-profiles-state-name-field trigger-profiles-state-position-field">
                  <span>Position</span>
                  <CustomSelect
                    value={String(triggerProfileEditingState)}
                    options={(triggerProfileDraft.states ?? []).map((_, index): [string, string] => [
                      `${index + 1} of ${triggerProfileDraft.states?.length ?? 0}`,
                      String(index)
                    ])}
                    ariaLabel={`Position of ${triggerProfileDraft.states[triggerProfileEditingState].name}`}
                    onChange={(value) => moveTriggerProfileState(triggerProfileEditingState, Number(value))}
                  />
                </label>
                <button
                  type="button"
                  className="secondary-action"
                  disabled={(triggerProfileDraft.states?.length ?? 0) >= MAX_STATES_PER_PROFILE}
                  onClick={() => duplicateTriggerProfileState(triggerProfileEditingState)}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="secondary-action trigger-profiles-state-remove"
                  onClick={() => removeTriggerProfileState(triggerProfileEditingState)}
                >
                  <X size={14} />
                  Remove state
                </button>
              </div>
            )}
            <div className="trigger-profiles-slots">
            {TRIGGER_PROFILE_SLOTS.map(([slot, label]) => {
              const slotConfig = editingStateTriggers(triggerProfileDraft, triggerProfileEditingState)[slot];
              const sideLabel = slot === 'l2' ? 'Left Trigger' : 'Right Trigger';
              const glyphUrl = slot === 'l2' ? l2GlyphUrl : r2GlyphUrl;
              const baseActive = slotConfig.base !== null;
              const modifiersOpen = triggerProfileModifiersOpen[slot];
              const setBaseActive = (active: boolean) => updateTriggerProfileSlot(slot, (config) => ({
                ...config,
                base: active ? (config.base ?? defaultTriggerEffectSpec()) : null
              }), { mirrorBase: triggerProfilesLinked });
              return (
                <section key={slot} className="feature-card trigger-lab-card trigger-lab-trigger-card trigger-profiles-slot-card">
                  <div className="feature-card-title">
                    <button
                      type="button"
                      className={`feature-icon triggers-enable-button trigger-lab-trigger-badge ${baseActive ? 'active' : ''}`}
                      aria-pressed={baseActive}
                      aria-label={`${sideLabel} base effect`}
                      onClick={() => setBaseActive(!baseActive)}
                    >
                      <span
                        className="trigger-lab-trigger-glyph"
                        style={{
                          WebkitMaskImage: `url("${glyphUrl}")`,
                          maskImage: `url("${glyphUrl}")`
                        } as CSSProperties}
                      />
                    </button>
                    <div className="title-copy">
                      <h3>{sideLabel}</h3>
                      <p>Shape the {label} trigger feel</p>
                    </div>
                    <div className="inline-switch trigger-lab-card-active">
                      <span>Active</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={baseActive}
                        aria-label={`${sideLabel} base effect`}
                        className={`switch trigger-lab-active-switch ${baseActive ? 'on' : ''}`}
                        onClick={() => setBaseActive(!baseActive)}
                      >
                        <span />
                      </button>
                    </div>
                  </div>
                  <div className="trigger-lab-editor">
                    <div className="trigger-lab-profile-row trigger-profiles-linked-row">
                      <span className="trigger-profiles-base-label">Base Effect</span>
                      <button
                        type="button"
                        className={`trigger-lab-chip compact ${triggerProfilesLinked ? 'active' : ''}`}
                        aria-pressed={triggerProfilesLinked}
                        onClick={() => toggleTriggerProfilesLinked(slot)}
                      >
                        {triggerProfilesLinked ? <LinkIcon size={13} /> : <LinkOffIcon size={13} />}
                        <span className="trigger-lab-chip-label">{triggerProfilesLinked ? 'Linked' : 'Split'}</span>
                      </button>
                    </div>
                    {slotConfig.base ? (
                      <TriggerEffectEditor
                        label={sideLabel}
                        value={slotConfig.base}
                        onChange={(effect) => updateTriggerProfileSlot(slot, (config) => ({
                          ...config,
                          base: config.base ? effect : config.base
                        }), { mirrorBase: triggerProfilesLinked })}
                      />
                    ) : (
                      <p className="trigger-profiles-slot-off-note">
                        No base effect — game trigger output passes through.
                      </p>
                    )}
                    {CONTROLLER_INPUT_AVAILABLE && (
                    <div className="trigger-profiles-modifiers-section">
                      <button
                        type="button"
                        className="trigger-profiles-modifiers-toggle"
                        aria-expanded={modifiersOpen}
                        onClick={() => setTriggerProfileModifiersOpen((open) => ({ ...open, [slot]: !open[slot] }))}
                      >
                        <ChevronDown size={14} className={`trigger-profiles-modifiers-chevron ${modifiersOpen ? 'open' : ''}`} />
                        Modifiers ({slotConfig.modifiers.length})
                      </button>
                      {modifiersOpen && (
                        <>
                  <div className="trigger-profiles-modifiers">
                    {slotConfig.modifiers.map((modifier, modifierIndex) => (
                      <div key={modifierIndex} className="trigger-profiles-modifier">
                        <div className="trigger-profiles-modifier-condition">
                          <CustomSelect
                            value={modifier.when.condition as InputConditionType}
                            options={TRIGGER_PROFILE_CONDITION_OPTIONS}
                            ariaLabel={`${label} modifier ${modifierIndex + 1} condition`}
                            onChange={(condition) => updateTriggerProfileSlot(slot, (config) => ({
                              ...config,
                              modifiers: config.modifiers.map((entry, index) => (
                                index === modifierIndex
                                  ? { ...entry, when: { ...entry.when, condition } }
                                  : entry
                              ))
                            }))}
                          />
                          {(modifier.when.condition === 'trigger-held-over') && (
                            <>
                              <label className="trigger-profiles-modifier-param">
                                <span>Threshold %</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={modifier.when.threshold ?? 0}
                                  onChange={(event) => {
                                    const raw = Number(event.target.value);
                                    if (Number.isNaN(raw)) return;
                                    const threshold = clampByte(raw);
                                    updateTriggerProfileSlot(slot, (config) => ({
                                      ...config,
                                      modifiers: config.modifiers.map((entry, index) => (
                                        index === modifierIndex
                                          ? { ...entry, when: { ...entry.when, threshold } }
                                          : entry
                                      ))
                                    }));
                                  }}
                                />
                              </label>
                              <label className="trigger-profiles-modifier-param">
                                <span>Hold ms</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={modifier.when.ms ?? 0}
                                  onChange={(event) => {
                                    const raw = Number(event.target.value);
                                    if (Number.isNaN(raw)) return;
                                    const ms = Math.max(0, Math.round(raw));
                                    updateTriggerProfileSlot(slot, (config) => ({
                                      ...config,
                                      modifiers: config.modifiers.map((entry, index) => (
                                        index === modifierIndex
                                          ? { ...entry, when: { ...entry.when, ms } }
                                          : entry
                                      ))
                                    }));
                                  }}
                                />
                              </label>
                            </>
                          )}
                          {modifier.when.condition === 'button-held' && (
                            <label className="trigger-profiles-modifier-param">
                              <span>Button</span>
                              <input
                                value={modifier.when.button ?? ''}
                                onChange={(event) => {
                                  const button = event.target.value;
                                  updateTriggerProfileSlot(slot, (config) => ({
                                    ...config,
                                    modifiers: config.modifiers.map((entry, index) => (
                                      index === modifierIndex
                                        ? { ...entry, when: { ...entry.when, button } }
                                        : entry
                                    ))
                                  }));
                                }}
                              />
                            </label>
                          )}
                          {modifier.when.condition === 'rapid-fire' && (
                            <label className="trigger-profiles-modifier-param">
                              <span>Presses/sec</span>
                              <input
                                type="number"
                                min={1}
                                value={modifier.when.pressesPerSecond ?? 0}
                                onChange={(event) => {
                                  const raw = Number(event.target.value);
                                  if (Number.isNaN(raw)) return;
                                  const pressesPerSecond = Math.max(1, Math.round(raw));
                                  updateTriggerProfileSlot(slot, (config) => ({
                                    ...config,
                                    modifiers: config.modifiers.map((entry, index) => (
                                      index === modifierIndex
                                        ? { ...entry, when: { ...entry.when, pressesPerSecond } }
                                        : entry
                                    ))
                                  }));
                                }}
                              />
                            </label>
                          )}
                          <button
                            type="button"
                            className="icon-compact trigger-profiles-modifier-remove"
                            aria-label={`Remove ${label} modifier ${modifierIndex + 1}`}
                            onClick={() => updateTriggerProfileSlot(slot, (config) => ({
                              ...config,
                              modifiers: config.modifiers.filter((_, index) => index !== modifierIndex)
                            }))}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="trigger-profiles-effect-sliders">
                          <TriggerEffectEditor
                            compact
                            label={`${label} modifier ${modifierIndex + 1}`}
                            value={modifier.effect}
                            onChange={(effect) => updateTriggerProfileSlot(slot, (config) => ({
                              ...config,
                              modifiers: config.modifiers.map((entry, index) => (
                                index === modifierIndex ? { ...entry, effect } : entry
                              ))
                            }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                          <button
                            type="button"
                            className="secondary-action trigger-profiles-modifier-add"
                            onClick={() => updateTriggerProfileSlot(slot, (config) => ({
                              ...config,
                              modifiers: [...config.modifiers, defaultTriggerModifier()]
                            }))}
                          >
                            <Plus size={14} />
                            Add Modifier
                          </button>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                </section>
              );
            })}
            </div>

            {/* Name and process matching live in Game Profiles now: a game is
                added (and matched) there, so the editor only shapes the feel. */}

            {CONTROLLER_INPUT_AVAILABLE && triggerProfileDraft.states && triggerProfileDraft.states.length > 1 && (
              <div className="trigger-profiles-group">
                <h4 className="trigger-profiles-group-title">State Switching</h4>
                <p className="trigger-profiles-switching-hint">
                  Bind the game's own controls: rules fire on button presses and change the
                  active state. Switching is inferred from your inputs — use the state chips
                  or a select rule to re-sync if it drifts.
                </p>
                <div className="trigger-profiles-switch-rules">
                  {(triggerProfileDraft.switching?.rules ?? []).map((rule, ruleIndex) => (
                    <div key={ruleIndex} className="trigger-profiles-sentence-rule">
                      <span className="sentence-word">When I press</span>
                      <button
                        type="button"
                        className={`rule-capture-chip ${ruleCapture === ruleIndex ? 'listening' : ''}`}
                        aria-label={`Switch rule ${ruleIndex + 1} button — click, then press the controller button`}
                        onClick={() => setRuleCapture(ruleCapture === ruleIndex ? null : ruleIndex)}
                      >
                        {ruleCapture === ruleIndex
                          ? 'Press a button…'
                          : (
                            <>
                              {rule.while && (
                                <>
                                  <span className="rule-chip-glyph" title={STATE_SWITCH_BUTTON_LABELS[rule.while] ?? rule.while}>
                                    {STATE_SWITCH_BUTTON_GLYPHS[rule.while] ?? rule.while}
                                  </span>
                                  <span className="rule-chip-plus">+</span>
                                </>
                              )}
                              <span className="rule-chip-glyph accent" title={STATE_SWITCH_BUTTON_LABELS[rule.button] ?? rule.button}>
                                {STATE_SWITCH_BUTTON_GLYPHS[rule.button] ?? rule.button}
                              </span>
                            </>
                          )}
                      </button>
                      <span className="sentence-word">→</span>
                      <CustomSelect
                        value={rule.action}
                        options={STATE_SWITCH_ACTION_OPTIONS}
                        ariaLabel={`Switch rule ${ruleIndex + 1} action`}
                        onChange={(action) => updateTriggerProfileSwitchRule(ruleIndex, {
                          action,
                          ...(action === 'select'
                            ? { state: rule.state ?? triggerProfileDraft.states?.[0]?.name }
                            : {})
                        })}
                      />
                      {rule.action === 'select' && (
                        <CustomSelect
                          value={rule.state ?? ''}
                          options={(triggerProfileDraft.states ?? []).map(
                            (state): [string, string] => [state.name, state.name]
                          )}
                          ariaLabel={`Switch rule ${ruleIndex + 1} target state`}
                          onChange={(state) => updateTriggerProfileSwitchRule(ruleIndex, { state })}
                        />
                      )}
                      <button
                        type="button"
                        className="icon-compact trigger-profiles-modifier-remove"
                        aria-label={`Remove switch rule ${ruleIndex + 1}`}
                        onClick={() => {
                          if (ruleCapture === ruleIndex) setRuleCapture(null);
                          updateTriggerProfileSwitching((switching) => ({
                            ...switching,
                            rules: switching.rules.filter((_, at) => at !== ruleIndex)
                          }));
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={`secondary-action trigger-profiles-modifier-add ${ruleCapture === 'new' ? 'rule-add-listening' : ''}`}
                  disabled={(triggerProfileDraft.switching?.rules.length ?? 0) >= 16}
                  onClick={() => setRuleCapture(ruleCapture === 'new' ? null : 'new')}
                >
                  <Plus size={14} />
                  {ruleCapture === 'new' ? 'Press the button you want to use… (click to cancel)' : 'Add rule'}
                </button>
                <div className="trigger-profiles-switch-settings">
                  <label className="trigger-profiles-modifier-param">
                    <span>Default state</span>
                    <CustomSelect
                      value={triggerProfileDraft.switching?.defaultState ?? triggerProfileDraft.states[0].name}
                      options={triggerProfileDraft.states.map(
                        (state): [string, string] => [state.name, state.name]
                      )}
                      ariaLabel="Default state"
                      onChange={(name) => updateTriggerProfileSwitching((switching) => ({
                        ...switching,
                        defaultState: name
                      }))}
                    />
                  </label>
                  <label className="trigger-profiles-modifier-param">
                    <span>Menu button</span>
                    <CustomSelect
                      value={triggerProfileDraft.switching?.menuButtons?.[0] ?? ''}
                      options={STATE_SWITCH_MENU_OPTIONS}
                      ariaLabel="Menu guard button"
                      onChange={(button) => updateTriggerProfileSwitching((switching) => {
                        const next = { ...switching };
                        if (button === '') delete next.menuButtons;
                        else next.menuButtons = [button];
                        return next;
                      })}
                    />
                  </label>
                  <label className="trigger-profiles-modifier-param">
                    <span>Menu timeout (s)</span>
                    <input
                      type="number"
                      min={0}
                      value={Math.round((triggerProfileDraft.switching?.menuTimeoutMs ?? 0) / 1000)}
                      onChange={(event) => {
                        const raw = Number(event.target.value);
                        if (Number.isNaN(raw)) return;
                        const menuTimeoutMs = Math.max(0, Math.round(raw)) * 1000;
                        updateTriggerProfileSwitching((switching) => {
                          const next = { ...switching };
                          if (menuTimeoutMs === 0) delete next.menuTimeoutMs;
                          else next.menuTimeoutMs = menuTimeoutMs;
                          return next;
                        });
                      }}
                    />
                  </label>
                </div>

                <div className="inline-switch stick-wheel-toggle">
                  <span>Analog wheel</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={triggerProfileDraft.switching?.stickWheel !== undefined}
                    aria-label="Enable analog wheel state selection"
                    className={`switch ${triggerProfileDraft.switching?.stickWheel ? 'on' : ''}`}
                    onClick={() => updateTriggerProfileSwitching((switching) => {
                      const next = { ...switching };
                      if (next.stickWheel) {
                        delete next.stickWheel;
                      } else {
                        next.stickWheel = {
                          button: 'triangle',
                          thresholdPercent: 50,
                          angleOffsetDeg: 0,
                          sectors: (triggerProfileDraft.states ?? [])
                            .slice(0, 12)
                            .map((state) => state.name)
                        };
                      }
                      return next;
                    })}
                  >
                    <span />
                  </button>
                </div>
                {triggerProfileDraft.switching?.stickWheel && (
                  <>
                    <p className="trigger-profiles-switching-hint">
                      Mirrors the game's weapon wheel: hold the wheel button, point the left
                      stick at a slot, release to commit. Tune the threshold and rotation
                      until the live dot lands on the same slot as the game's own wheel.
                    </p>
                    <StickWheelEditor
                      wheel={triggerProfileDraft.switching.stickWheel}
                      stateNames={(triggerProfileDraft.states ?? []).map((state) => state.name)}
                      buttonOptions={STATE_SWITCH_BUTTON_OPTIONS}
                      liveSample={stickSample}
                      onChange={updateStickWheelSynced}
                      onPickState={(stateName) => {
                        const index = (triggerProfileDraft.states ?? []).findIndex(
                          (state) => state.name === stateName
                        );
                        if (index >= 0) setTriggerProfileEditingState(index);
                      }}
                      renderSelect={({ value, options, ariaLabel, onChange }) => (
                        <CustomSelect
                          value={value}
                          options={options}
                          ariaLabel={ariaLabel}
                          onChange={onChange}
                        />
                      )}
                    />
                  </>
                )}
              </div>
            )}

            </div>
          </section>
        ) : (
          <section className="feature-card trigger-profiles-editor-card trigger-profiles-editor-empty">
            <div className="feature-card-title">
              <span className="feature-icon"><Pencil size={20} /></span>
              <div className="title-copy">
                <h3>Editor</h3>
                <p>Shape the selected profile's trigger effects.</p>
              </div>
              <div className="trigger-profiles-status-group trigger-profiles-editor-match-source">
                <span className="overview-status-heading">
                  <IconDeviceGamepad2 size={14} />
                  Match Source
                </span>
                <span className="status-badge">
                  <strong>
                    {!triggerProfileEngineStatus
                      ? '—'
                      : triggerProfileEngineStatus.matchedBy === 'pin'
                        ? 'Pinned'
                        : triggerProfileEngineStatus.matchedBy === 'process'
                          ? `Process: ${triggerProfileEngineStatus.matchedName ?? 'unknown'}`
                          : 'Default fallback'}
                  </strong>
                </span>
              </div>
            </div>
            <div className="trigger-profiles-empty-state">
              <IconTargetArrow size={22} />
              <p>Select a profile in the strip below, or create a new one to start editing.</p>
            </div>
          </section>
        )}
      </div>

      <div className="trigger-profiles-strip" ref={triggerStripRef}>
        {(() => {
          const { chips, overflow } = pickTriggerStripChips(
            triggerStripProfiles,
            selectedTriggerProfileId,
            triggerStripWidth > 0 && triggerStripActionsWidth > 0
              ? triggerStripMaxChips(triggerStripWidth - triggerStripActionsWidth)
              : 2
          );
          const overflowActive = overflow.find(
            (profile) => triggerProfileEngineStatus?.activeProfileId === profile.id
          ) ?? null;
          const overflowSelected = overflow.find(
            (profile) => profile.id === selectedTriggerProfileId
          ) ?? null;
          const dropdownValue = overflowSelected ? overflowSelected.id : '';
          const dropdownOptions: Array<[string, string]> = [
            ['More profiles', ''],
            ...overflow.map((profile): [string, string] => [profile.name, profile.id])
          ];
          return (
            <>
              <ul className="trigger-profiles-strip-list">
                {chips.map((profile) => (
                  <li key={profile.id}>
                    <button
                      type="button"
                      className={`trigger-profiles-chip ${selectedTriggerProfileId === profile.id ? 'active' : ''}`}
                      title={
                        profile.id === 'default'
                          ? 'Fallback when no game matches'
                          : profile.match.processNames.length > 0
                            ? profile.match.processNames.join(', ')
                            : 'No process match set'
                      }
                      onClick={() => selectTriggerProfile(profile.id)}
                    >
                      {triggerProfileEngineStatus?.activeProfileId === profile.id && (
                        <span className="dot good" aria-label="Currently active" />
                      )}
                      <span className="trigger-profiles-chip-name">{profile.name}</span>
                      {triggerProfileEngineStatus?.activeProfileId === profile.id
                        && triggerProfileEngineStatus.matchedBy === 'pin' && (
                        <span className="trigger-profiles-chip-matched">pinned</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {overflow.length > 0 && (
                <div className="trigger-profiles-strip-more">
                  <CustomSelect
                    className="trigger-profiles-more-select"
                    value={dropdownValue}
                    options={dropdownOptions}
                    ariaLabel="Switch to another trigger profile"
                    floatingMenu
                    floatingMenuMinWidth={240}
                    showSelectedCheck={false}
                    searchable
                    searchPlaceholder="Filter profiles"
                    renderValue={() => (
                      <span className="trigger-profiles-more-trigger">
                        {overflowActive && (
                          <span className="dot good" aria-label="An overflow profile is active" />
                        )}
                        <span>More profiles</span>
                        <span className="trigger-profiles-more-count">{overflow.length}</span>
                      </span>
                    )}
                    renderOption={(label, optionValue) => (
                      <span className="trigger-profiles-more-option">
                        {triggerProfileEngineStatus?.activeProfileId === optionValue && optionValue !== '' && (
                          <span className="dot good" aria-label="Currently active" />
                        )}
                        <span className="trigger-profiles-more-option-name">{label}</span>
                        {optionValue === selectedTriggerProfileId && optionValue !== '' && (
                          <span className="trigger-profiles-chip-matched">editing</span>
                        )}
                      </span>
                    )}
                    onChange={(value) => {
                      if (value) selectTriggerProfile(value);
                    }}
                  />
                </div>
              )}
            </>
          );
        })()}
        <div className="trigger-profiles-strip-actions" ref={triggerStripActionsRef}>
          {triggerProfileTransferStatus ? (
            <span className="trigger-profiles-transfer-status">
              <span className={`status-badge ${triggerProfileTransferStatus.tone}`}>
                {triggerProfileTransferStatus.message}
              </span>
              {triggerProfileTransferStatus.failures && triggerProfileTransferStatus.failures.length > 0 ? (
                <span className="trigger-profiles-transfer-errors">
                  {triggerProfileTransferStatus.failures.map((failure, index) => (
                    <span key={`${failure.file}-${index}`} className="trigger-profiles-transfer-error">
                      <strong>{failure.file}</strong> — {failure.error}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
          ) : null}
          <button
            type="button"
            className="trigger-profiles-library-button"
            onClick={() => void openTriggerProfileLibrary()}
          >
            <IconBooks size={14} />
            Library
          </button>
          <button type="button" onClick={createTriggerProfile}>
            <Plus size={14} />
            New
          </button>
          <button type="button" disabled={!triggerProfileDraft} onClick={duplicateTriggerProfile}>
            Duplicate
          </button>
          {triggerProfileDraft?.meta?.libraryFile ? (
            <button
              type="button"
              title="Re-download this profile from the library, discarding your changes"
              onClick={() => triggerProfileDraft && setTriggerProfileResetConfirm({
                id: triggerProfileDraft.id,
                name: triggerProfileDraft.name
              })}
            >
              <RefreshCcw size={14} />
              Reset
            </button>
          ) : null}
          <button
            type="button"
            disabled={!triggerProfileDraft || triggerProfileDraft.id === 'default'}
            onClick={() => triggerProfileDraft && openTriggerProfileDeleteConfirm(triggerProfileDraft)}
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            type="button"
            className={`trigger-profiles-auto-toggle ${triggerProfileEngineStatus?.matchedBy === 'pin' ? '' : 'on'}`}
            aria-pressed={triggerProfileEngineStatus?.matchedBy !== 'pin'}
            title={
              triggerProfileEngineStatus?.matchedBy === 'pin'
                ? `Using ${triggerProfileNameById(triggerProfileEngineStatus.activeProfileId)} — click to resume automatic game matching`
                : 'Auto matching running games — click to pin the Default profile'
            }
            onClick={() => {
              if (triggerProfileEngineStatus?.matchedBy === 'pin') {
                // Back to auto: unpinned, the engine falls back to Default until a game matches.
                void pinSelectedTriggerProfile('');
              } else {
                selectTriggerProfile('default');
              }
            }}
          >
            Auto
          </button>
        </div>
      </div>
    </div>
  );
}
