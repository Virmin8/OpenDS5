import {
  IconBrandDeezer,
  IconDeviceAudioTape,
  IconFlame,
  IconTestPipe,
  IconPlayerPlay as Play,
  IconSparkles as Sparkles,
  IconDeviceMobileVibration as Vibrate
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import type { BridgeSnapshot } from '../../shared/types';
import {
  AUDIO_REACTIVE_HAPTICS_ATTACK_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_BASS_FOCUS_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS,
  AUDIO_REACTIVE_HAPTICS_MODE_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_RELEASE_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_RESPONSE_OPTIONS,
  HAPTICS_PRESETS,
  HAPTICS_STEP,
  snapHapticsValue
} from '../app/audio';
import { sliderTickClass } from '../app/common';
import {
  AudioHapticsConfigLabel,
  AudioHapticsSourceOption,
  CustomSelect,
  FeatureTipsPanel
} from '../app/components';
import type { AppState } from '../app/useAppState';

export function HapticsTab({ app, snapshot }: { app: AppState; snapshot: BridgeSnapshot }) {
  const {
    activeControlTab, activeFeedbackStatusLabel, activeFeedbackStatusTone,
    activeFeedbackTestUnavailable, activeHapticsFeatureEnabled, audioHapticsOpen,
    audioHapticsSessionByKey, audioHapticsSessionsLoading, audioHapticsSourceOptions,
    audioReactiveHapticsConfigDisabled, audioReactiveHapticsControlDisabled,
    audioReactiveHapticsEnabled, audioReactiveHapticsModeBadgeLabel, audioReactiveHapticsModeTooltip,
    audioReactiveHapticsOverrideMode, audioReactiveHapticsSourceKey, audioReactiveHapticsStatusLabel,
    audioReactiveHapticsStatusTone, classicRumbleEditingRef, classicRumbleV1CommitPending,
    classicRumbleV1Enabled, classicRumbleValue, commitClassicRumbleValue, commitHapticsValue,
    connected, controllerControlsAvailable, controllerPowerSavingActive, feedbackBoostCommitPending,
    feedbackBoostEnabled, focusBridgeSettings, hapticsCommitPending, hapticsEditingRef,
    hapticsSliderMax, hapticsSliderTicks, hapticsValue, pendingAction, runFeedbackTest,
    selectedAudioHapticsSourceDisplayName, setAudioReactiveHapticsAttack,
    setAudioReactiveHapticsBassFocus, setAudioReactiveHapticsMode, setAudioReactiveHapticsRelease,
    setAudioReactiveHapticsResponse, setAudioReactiveHapticsSourceValue, setClassicRumblePreset,
    setClassicRumbleValue, setHapticsPreset, setHapticsValue, setShowClassicRumbleControl,
    setTestLocked, showClassicRumbleControl, testLocked, toggleAudioHapticsFeature,
    toggleAudioReactiveHapticsEnabled, toggleClassicRumbleEnabled, toggleClassicRumbleV1Enabled,
    toggleFeedbackBoostEnabled, toggleHapticsEnabled
  } = app;

  return (
    <div
      className={`control-page haptics-page ${activeControlTab === 'haptics' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-haptics"
      aria-labelledby="control-tab-haptics"
      aria-hidden={activeControlTab !== 'haptics'}
    >
        <div className="feature-heading">
          <div>
            <h2>{audioHapticsOpen ? 'Audio Haptics' : showClassicRumbleControl ? 'Rumble' : 'HD Haptics'}</h2>
            <p>{audioHapticsOpen ? 'Turn system audio into haptic feedback.' : 'Adjust controller haptic feedback and run a quick test.'}</p>
          </div>
          <div className="audio-heading-controls">
            <div className="inline-switch audio-haptics-switch-control">
              {audioReactiveHapticsModeBadgeLabel ? (
                <span className={`inline-state-badge audio-haptics-mode-state ${audioReactiveHapticsOverrideMode ? 'warn' : 'retry'}`}>
                  {audioReactiveHapticsModeBadgeLabel}
                </span>
              ) : null}
              <span>Audio Haptics</span>
              <button
                type="button"
                role="switch"
                aria-checked={audioReactiveHapticsEnabled}
                aria-label={audioReactiveHapticsEnabled ? 'Disable Audio Haptics' : 'Enable Audio Haptics'}
                className={`switch audio-haptics-switch ${audioReactiveHapticsEnabled ? 'on' : ''}`}
                disabled={audioReactiveHapticsControlDisabled}
                onClick={toggleAudioHapticsFeature}
              >
                <span />
              </button>
              {audioReactiveHapticsModeBadgeLabel ? (
                <span className="settings-shortcut-tooltip shortcut-glyph-tooltip audio-haptics-mode-tooltip">
                  {audioReactiveHapticsModeTooltip}
                </span>
              ) : null}
            </div>
            <div className="inline-switch">
              <span>Enabled</span>
              <button
                type="button"
                role="switch"
                aria-checked={activeHapticsFeatureEnabled}
                className={`switch ${activeHapticsFeatureEnabled ? 'on' : ''}`}
                disabled={!controllerControlsAvailable || pendingAction !== null}
                onClick={showClassicRumbleControl ? toggleClassicRumbleEnabled : toggleHapticsEnabled}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
        {audioHapticsOpen ? (
          <div className="feature-card-grid audio-haptics-grid">
            <section className="feature-card audio-haptics-card">
              <div className="feature-card-title">
                <button
                  type="button"
                  className={`feature-icon audio-haptics-enable-button icon-compact ${audioReactiveHapticsEnabled ? 'active' : ''}`}
                  aria-pressed={audioReactiveHapticsEnabled}
                  aria-label={audioReactiveHapticsEnabled ? 'Disable audio haptics' : 'Enable audio haptics'}
                  title={audioReactiveHapticsStatusLabel}
                  disabled={audioReactiveHapticsControlDisabled}
                  onClick={toggleAudioReactiveHapticsEnabled}
                >
                  <IconDeviceAudioTape size={20} />
                </button>
                <div className="title-copy">
                  <h3>Audio Haptics</h3>
                  <p>System audio feedback</p>
                </div>
              </div>
              <div className="framed-slider">
                <label className="slider-row">
                  <span>0%</span>
                  <div className="range-control">
                    <input
                      type="range"
                      min="0"
                      max={hapticsSliderMax}
                      step={HAPTICS_STEP}
                      value={hapticsValue}
                      disabled={!connected || !snapshot.settings.hapticsEnabled || hapticsCommitPending}
                      style={{ '--range-fill': `${(hapticsValue / hapticsSliderMax) * 100}%` } as CSSProperties}
                      aria-label="Haptics gain"
                      onPointerDown={() => {
                        hapticsEditingRef.current = true;
                      }}
                      onChange={(event) => setHapticsValue(snapHapticsValue(
                        Number(event.currentTarget.value),
                        hapticsSliderMax
                      ))}
                      onPointerUp={() => void commitHapticsValue()}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                          hapticsEditingRef.current = true;
                        }
                      }}
                      onKeyUp={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                          void commitHapticsValue();
                        }
                      }}
                      onBlur={() => void commitHapticsValue()}
                    />
                    <div className="range-ticks" aria-hidden="true">
                      {hapticsSliderTicks.map((value) => (
                        <span key={value} className={sliderTickClass(value, hapticsSliderMax)} />
                      ))}
                    </div>
                  </div>
                  <strong>{hapticsValue}%</strong>
                </label>
              </div>
              <span className="audio-haptics-slider-spacer" aria-hidden="true" />
              <div className="segmented-row">
                {HAPTICS_PRESETS.map(([label, value]) => {
                  const presetValue = snapHapticsValue(Number(value), hapticsSliderMax);
                  return (
                    <button
                      key={label}
                      type="button"
                      className={hapticsValue === presetValue ? 'active' : ''}
                      disabled={!connected || !snapshot.settings.hapticsEnabled || hapticsCommitPending}
                      onClick={() => setHapticsPreset(presetValue)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="audio-haptics-routing-stack">
                <label className="audio-haptics-source-field">
                  <CustomSelect
                    value={audioReactiveHapticsSourceKey}
                    options={audioHapticsSourceOptions}
                    disabled={audioReactiveHapticsConfigDisabled}
                    className="audio-haptics-source-select"
                    ariaLabel="Audio haptics source"
                    renderValue={(label, value) => (
                      <AudioHapticsSourceOption
                        label={label}
                        value={value}
                        session={audioHapticsSessionByKey.get(value)}
                        loading={audioHapticsSessionsLoading}
                      />
                    )}
                    renderOption={(label, value) => (
                      <AudioHapticsSourceOption
                        label={label}
                        value={value}
                        session={audioHapticsSessionByKey.get(value)}
                        loading={audioHapticsSessionsLoading}
                      />
                    )}
                    onChange={setAudioReactiveHapticsSourceValue}
                  />
                </label>
                <div className="dual-selector audio-haptics-mode-selector" role="tablist" aria-label="Audio haptics mode">
                  {AUDIO_REACTIVE_HAPTICS_MODE_OPTIONS.map(([label, mode]) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={snapshot.settings.audioReactiveHapticsMode === mode}
                      className={snapshot.settings.audioReactiveHapticsMode === mode ? 'active' : ''}
                      disabled={audioReactiveHapticsConfigDisabled}
                      onClick={() => setAudioReactiveHapticsMode(mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="feature-card audio-haptics-card audio-haptics-response-card">
              <div className="feature-card-title">
                <span className="feature-icon"><IconBrandDeezer size={20} /></span>
                <div className="title-copy">
                  <h3>Response</h3>
                  <p>Frequency focus and strength</p>
                </div>
              </div>
              <div className="audio-haptics-config-stack">
                <div className="audio-haptics-config-pair-row">
                  <label>
                    <AudioHapticsConfigLabel
                      id="audio-haptics-bass-focus-tooltip"
                      label="Bass Focus"
                      tooltip={AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS.bassFocus}
                    />
                    <CustomSelect
                      value={snapshot.settings.audioReactiveHapticsBassFocus}
                      options={AUDIO_REACTIVE_HAPTICS_BASS_FOCUS_OPTIONS}
                      disabled={audioReactiveHapticsConfigDisabled}
                      className="audio-haptics-select"
                      ariaLabel="Audio haptics bass focus"
                      onChange={setAudioReactiveHapticsBassFocus}
                    />
                  </label>
                  <label>
                    <AudioHapticsConfigLabel
                      id="audio-haptics-response-tooltip"
                      label="Response"
                      tooltip={AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS.response}
                    />
                    <CustomSelect
                      value={snapshot.settings.audioReactiveHapticsResponse}
                      options={AUDIO_REACTIVE_HAPTICS_RESPONSE_OPTIONS}
                      disabled={audioReactiveHapticsConfigDisabled}
                      className="audio-haptics-select"
                      ariaLabel="Audio haptics response"
                      onChange={setAudioReactiveHapticsResponse}
                    />
                  </label>
                </div>
                <div className="audio-haptics-config-pair-row">
                  <label>
                    <AudioHapticsConfigLabel
                      id="audio-haptics-attack-tooltip"
                      label="Ramp"
                      tooltip={AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS.attack}
                    />
                    <CustomSelect
                      value={snapshot.settings.audioReactiveHapticsAttack}
                      options={AUDIO_REACTIVE_HAPTICS_ATTACK_OPTIONS}
                      disabled={audioReactiveHapticsConfigDisabled}
                      className="audio-haptics-select"
                      ariaLabel="Audio haptics attack"
                      onChange={setAudioReactiveHapticsAttack}
                    />
                  </label>
                  <label>
                    <AudioHapticsConfigLabel
                      id="audio-haptics-release-tooltip"
                      label="Fade"
                      tooltip={AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS.release}
                    />
                    <CustomSelect
                      value={snapshot.settings.audioReactiveHapticsRelease}
                      options={AUDIO_REACTIVE_HAPTICS_RELEASE_OPTIONS}
                      disabled={audioReactiveHapticsConfigDisabled}
                      className="audio-haptics-select"
                      ariaLabel="Audio haptics release"
                      onChange={setAudioReactiveHapticsRelease}
                    />
                  </label>
                </div>
              </div>
              <div className="feature-status test-status audio-haptics-status">
                <span className={`status-badge ${audioReactiveHapticsStatusTone}`} title={audioReactiveHapticsStatusLabel}>
                  <span className={`dot ${audioReactiveHapticsStatusTone}`} />
                  <strong>{audioReactiveHapticsStatusLabel}</strong>
                </span>
                <span className={`status-badge ${audioReactiveHapticsStatusTone}`} title={audioReactiveHapticsSourceKey === 'system-audio' ? 'Using the mixed Windows output.' : 'Using the selected app audio session.'}>
                  <span className={`dot ${audioReactiveHapticsEnabled ? audioReactiveHapticsStatusTone : 'idle'}`} />
                  <strong>{selectedAudioHapticsSourceDisplayName}</strong>
                </span>
              </div>
            </section>
          </div>
        ) : (
        <div className="feature-card-grid">
          <section className="feature-card preset-card">
            <div className="feature-card-title">
              <button
                type="button"
                className={`feature-icon haptics-enable-button ${showClassicRumbleControl ? 'icon-medium' : 'icon-compact'} ${activeHapticsFeatureEnabled ? 'active' : ''} ${controllerPowerSavingActive && activeHapticsFeatureEnabled ? 'power-saving-active' : ''}`}
                aria-pressed={activeHapticsFeatureEnabled}
                aria-label={showClassicRumbleControl ? 'Enable rumble' : 'Enable HD haptics'}
                title={showClassicRumbleControl ? 'Enable rumble' : 'Enable HD haptics'}
                disabled={!controllerControlsAvailable || pendingAction !== null}
                onClick={showClassicRumbleControl ? toggleClassicRumbleEnabled : toggleHapticsEnabled}
              >
                {showClassicRumbleControl ? <Vibrate size={20} /> : <Sparkles size={20} />}
              </button>
              <div className="title-copy">
                <h3>{showClassicRumbleControl ? 'Rumble' : 'Intensity'}</h3>
                <p>{showClassicRumbleControl ? 'Rumble Strength' : 'Haptic Strength'}</p>
              </div>
              <div className="dual-selector haptics-mode-selector" role="tablist" aria-label="Haptics control mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!showClassicRumbleControl}
                  className={!showClassicRumbleControl ? 'active' : ''}
                  onClick={() => setShowClassicRumbleControl(false)}
                >
                  HD Haptics
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={showClassicRumbleControl}
                  className={showClassicRumbleControl ? 'active' : ''}
                  onClick={() => setShowClassicRumbleControl(true)}
                >
                  Rumble
                </button>
              </div>
            </div>
            <div className="framed-slider">
              <label className="slider-row">
                <span>0%</span>
                <div className="range-control">
                  {showClassicRumbleControl ? (
                    <input
                      type="range"
                      min="0"
                      max={hapticsSliderMax}
                      step={HAPTICS_STEP}
                      value={classicRumbleValue}
                      disabled={!connected || !snapshot.settings.classicRumbleEnabled}
                      style={{ '--range-fill': `${(classicRumbleValue / hapticsSliderMax) * 100}%` } as CSSProperties}
                      onPointerDown={() => {
                        classicRumbleEditingRef.current = true;
                      }}
                      onChange={(event) => setClassicRumbleValue(snapHapticsValue(
                        Number(event.currentTarget.value),
                        hapticsSliderMax
                      ))}
                      onPointerUp={() => void commitClassicRumbleValue()}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                          classicRumbleEditingRef.current = true;
                        }
                      }}
                      onKeyUp={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                          void commitClassicRumbleValue();
                        }
                      }}
                      onBlur={() => void commitClassicRumbleValue()}
                    />
                  ) : (
                    <input
                      type="range"
                      min="0"
                      max={hapticsSliderMax}
                      step={HAPTICS_STEP}
                      value={hapticsValue}
                      disabled={!connected || !snapshot.settings.hapticsEnabled}
                      style={{ '--range-fill': `${(hapticsValue / hapticsSliderMax) * 100}%` } as CSSProperties}
                      onPointerDown={() => {
                        hapticsEditingRef.current = true;
                      }}
                      onChange={(event) => setHapticsValue(snapHapticsValue(
                        Number(event.currentTarget.value),
                        hapticsSliderMax
                      ))}
                      onPointerUp={() => void commitHapticsValue()}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                          hapticsEditingRef.current = true;
                        }
                      }}
                      onKeyUp={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                          void commitHapticsValue();
                        }
                      }}
                      onBlur={() => void commitHapticsValue()}
                    />
                  )}
                  <div className="range-ticks" aria-hidden="true">
                    {hapticsSliderTicks.map((value) => (
                      <span key={value} className={sliderTickClass(value, hapticsSliderMax)} />
                    ))}
                  </div>
                </div>
                <strong>{showClassicRumbleControl ? classicRumbleValue : hapticsValue}%</strong>
              </label>
            </div>
            <div className="segmented-row">
              {HAPTICS_PRESETS.map(([label, value]) => {
                const presetValue = snapHapticsValue(Number(value), hapticsSliderMax);
                const currentValue = showClassicRumbleControl ? classicRumbleValue : hapticsValue;
                return (
                  <button
                    key={label}
                    type="button"
                    className={currentValue === presetValue ? 'active' : ''}
                    disabled={
                      !connected
                      || (showClassicRumbleControl ? !snapshot.settings.classicRumbleEnabled : !snapshot.settings.hapticsEnabled)
                    }
                    onClick={() => (
                      showClassicRumbleControl
                        ? setClassicRumblePreset(presetValue)
                        : setHapticsPreset(presetValue)
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div
              className="inline-switch feedback-boost-control haptics-boost-control"
              title={feedbackBoostEnabled ? 'Feedback boost: up to 500%' : 'Enable feedback boost up to 500%'}
            >
              <span className="feedback-boost-label">
                <IconFlame size={16} aria-hidden="true" />
                Boost
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={feedbackBoostEnabled}
                aria-label={feedbackBoostEnabled ? 'Disable feedback boost' : 'Enable feedback boost'}
                className={`switch ${feedbackBoostEnabled ? 'on' : ''}`}
                disabled={!connected || pendingAction !== null || feedbackBoostCommitPending}
                onClick={toggleFeedbackBoostEnabled}
              >
                <span />
              </button>
            </div>
            {showClassicRumbleControl ? (
              <div
                className="inline-switch feedback-boost-control haptics-rumble-v1-control"
                title={classicRumbleV1Enabled ? 'Classic rumble: v1 compatibility mode' : 'Classic rumble: v2 default mode'}
              >
                <span className="feedback-boost-label">v1 Rumble</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={classicRumbleV1Enabled}
                  aria-label={classicRumbleV1Enabled ? 'Disable v1 rumble mode' : 'Enable v1 rumble mode'}
                  className={`switch ${classicRumbleV1Enabled ? 'on' : ''}`}
                  disabled={!connected || pendingAction !== null || classicRumbleV1CommitPending}
                  onClick={toggleClassicRumbleV1Enabled}
                >
                  <span />
                </button>
              </div>
            ) : null}
          </section>
          <section className="feature-card test-card">
            <div className="feature-card-title">
              <span className="feature-icon"><IconTestPipe size={20} /></span>
              <div className="title-copy">
                <h3>Testing</h3>
                <p>Run a short test to feel the current settings.</p>
              </div>
            </div>
            <button className="primary-action" type="button" disabled={activeFeedbackTestUnavailable} onClick={runFeedbackTest}>
              <Play size={15} />
              {showClassicRumbleControl
                ? connected && testLocked
                  ? 'Testing'
                  : 'Test Rumble'
              : connected && testLocked
                  ? 'Testing'
                : connected && snapshot.status?.testHapticsCooldown
                  ? 'Cooling Down'
                  : 'Test Haptics'}
            </button>
            <button className="secondary-action" type="button" disabled={!testLocked} onClick={() => setTestLocked(false)}>
              <span className="stop-glyph" aria-hidden="true" />
              Stop Test
            </button>
            <div className={`feature-status test-status ${activeFeedbackStatusTone}`}>
              <span className="status-badge">
                <span className={`dot ${activeFeedbackStatusTone}`} />
                <strong>{activeFeedbackStatusLabel}</strong>
              </span>
            </div>
          </section>
        </div>
        )}
        <FeatureTipsPanel tab="haptics" onSettingsFocusRequest={focusBridgeSettings} audioHapticsOpen={audioHapticsOpen} />
    </div>
  );
}
