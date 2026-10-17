import {
  IconDeviceGamepad2,
  IconTestPipe,
  IconPlayerPlay as Play,
  IconRefresh as RefreshCcw
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import type { BridgeSnapshot } from '../../shared/types';
import { PERCENT_SLIDER_TICKS, sliderTickClass } from '../app/common';
import { FeatureTipsPanel } from '../app/components';
import {
  snapTriggerEffectIntensity,
  TRIGGER_EFFECT_PRESETS,
  TRIGGER_EFFECT_STEP,
  TRIGGER_TEST_MODE_OPTIONS,
  TRIGGER_TEST_TARGET_OPTIONS
} from '../app/triggers';
import type { AppState } from '../app/useAppState';

export function TriggersTab({ app, snapshot }: { app: AppState; snapshot: BridgeSnapshot }) {
  const {
    activeControlTab, adaptiveTriggerOutputActive, adaptiveTriggersSupported,
    commitTriggerEffectIntensity, connected, controllerConnected, controllerControlsAvailable,
    controllerPowerSavingActive, focusBridgeSettings, pendingAction, percentSliderMax,
    resetAdaptiveTriggers, runTriggerTest, setTriggerEffectIntensityValue, setTriggerIntensityPreset,
    setTriggerTest, stopTriggerTest, toggleAdaptiveTriggersEnabled, triggerEffectEditingRef,
    triggerEffectIntensityValue, triggerTest, triggerTestRunning
  } = app;

  return (
    <div
      className={`control-page triggers-page ${activeControlTab === 'triggers' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-triggers"
      aria-labelledby="control-tab-triggers"
      aria-hidden={activeControlTab !== 'triggers'}
    >
        <div className="feature-heading">
          <div>
            <h2>Adaptive Triggers</h2>
            <p>Set the strength of adaptive trigger effects</p>
          </div>
          <div className="triggers-heading-controls">
            {/* Rarely needed, but it is the way out when a game quits without releasing
                the triggers and leaves an effect held on them. */}
            <button
              className="secondary-action triggers-reset-button"
              type="button"
              title="Clear any effect currently held on the triggers"
              disabled={!connected || !adaptiveTriggersSupported || adaptiveTriggerOutputActive || pendingAction !== null}
              onClick={resetAdaptiveTriggers}
            >
              <RefreshCcw size={14} />
              Reset
            </button>
            <div className="inline-switch">
              <span>Enabled</span>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.adaptiveTriggersEnabled}
                className={`switch ${snapshot.settings.adaptiveTriggersEnabled ? 'on' : ''}`}
                disabled={!controllerControlsAvailable || !adaptiveTriggersSupported || pendingAction !== null}
                onClick={toggleAdaptiveTriggersEnabled}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
        <div className="feature-card-grid">
          <section className="feature-card preset-card">
            <div className="feature-card-title">
              <button
                type="button"
                className={`feature-icon triggers-enable-button icon-compact ${snapshot.settings.adaptiveTriggersEnabled ? 'active' : ''} ${controllerPowerSavingActive && snapshot.settings.adaptiveTriggersEnabled ? 'power-saving-active' : ''}`}
                aria-pressed={snapshot.settings.adaptiveTriggersEnabled}
                aria-label="Enable adaptive triggers"
                title="Enable adaptive triggers"
                disabled={!controllerControlsAvailable || !adaptiveTriggersSupported || pendingAction !== null}
                onClick={toggleAdaptiveTriggersEnabled}
              >
                <IconDeviceGamepad2 size={20} />
              </button>
              <div className="title-copy">
                <h3>Intensity</h3>
                <p>Set the overall strength of adaptive trigger effects</p>
              </div>
            </div>
            <div className="framed-slider">
              <label className="slider-row">
                <span>0%</span>
                <div className="range-control">
                  <input
                    type="range"
                    min="0"
                    max={percentSliderMax}
                    step={TRIGGER_EFFECT_STEP}
                    value={triggerEffectIntensityValue}
                    disabled={!connected || !adaptiveTriggersSupported || !snapshot.settings.adaptiveTriggersEnabled}
                    style={{ '--range-fill': `${(triggerEffectIntensityValue / percentSliderMax) * 100}%` } as CSSProperties}
                    onPointerDown={() => {
                      triggerEffectEditingRef.current = true;
                    }}
                    onChange={(event) => (
                      setTriggerEffectIntensityValue(snapTriggerEffectIntensity(Number(event.currentTarget.value)))
                    )}
                    onPointerUp={() => void commitTriggerEffectIntensity()}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        triggerEffectEditingRef.current = true;
                      }
                    }}
                    onKeyUp={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        void commitTriggerEffectIntensity();
                      }
                    }}
                    onBlur={() => void commitTriggerEffectIntensity()}
                  />
                  <div className="range-ticks" aria-hidden="true">
                    {PERCENT_SLIDER_TICKS.map((value) => (
                      <span key={value} className={sliderTickClass(value, 100)} />
                    ))}
                  </div>
                </div>
                <strong>{triggerEffectIntensityValue}%</strong>
              </label>
            </div>
            <div className="segmented-row">
              {TRIGGER_EFFECT_PRESETS.map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  className={triggerEffectIntensityValue === value ? 'active' : ''}
                  disabled={!connected || !adaptiveTriggersSupported || !snapshot.settings.adaptiveTriggersEnabled || pendingAction !== null}
                  onClick={() => setTriggerIntensityPreset(Number(value))}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
          <section className="feature-card test-card trigger-test-card">
            <div className="feature-card-title">
              <span className="feature-icon"><IconTestPipe size={20} /></span>
              <div className="title-copy">
                <h3>Testing</h3>
                <p>Feel an effect on the triggers for a few seconds.</p>
              </div>
            </div>
            {(() => {
              const testDisabled = !connected || !controllerConnected || !adaptiveTriggersSupported
                || !snapshot.settings.adaptiveTriggersEnabled;
              const sliders: Array<[string, 'start' | 'end' | 'strength', boolean]> = [
                ['Start', 'start', true],
                [triggerTest.mode === 'weapon' ? 'Break' : 'End', 'end', triggerTest.mode !== 'feedback'],
                [triggerTest.mode === 'vibration' ? 'Amplitude' : 'Strength', 'strength', true]
              ];
              const statusTone = testDisabled ? 'warn' : 'good';
              const statusLabel = !connected || !controllerConnected
                ? 'Controller not connected'
                : !snapshot.settings.adaptiveTriggersEnabled
                  ? 'Adaptive triggers are off'
                  : triggerTestRunning ? 'Testing' : 'Ready';
              return (
                <>
                  <div className="trigger-test-options">
                    <div className="trigger-test-row">
                      <span>Effect</span>
                      <div className="segmented-row compact">
                        {TRIGGER_TEST_MODE_OPTIONS.map(([label, mode]) => (
                          <button
                            key={mode}
                            type="button"
                            className={triggerTest.mode === mode ? 'active' : ''}
                            disabled={testDisabled}
                            onClick={() => setTriggerTest((current) => ({ ...current, mode }))}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="trigger-test-row">
                      <span>Trigger</span>
                      <div className="segmented-row compact">
                        {TRIGGER_TEST_TARGET_OPTIONS.map(([label, target]) => (
                          <button
                            key={target}
                            type="button"
                            className={triggerTest.target === target ? 'active' : ''}
                            disabled={testDisabled}
                            onClick={() => setTriggerTest((current) => ({ ...current, target }))}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {sliders.filter(([, , shown]) => shown).map(([label, key]) => (
                      <label key={key} className="trigger-test-slider">
                        <span>{label}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={triggerTest[key]}
                          disabled={testDisabled}
                          style={{ '--range-fill': `${triggerTest[key]}%` } as CSSProperties}
                          onChange={(event) => {
                            const value = Number(event.currentTarget.value);
                            setTriggerTest((current) => ({ ...current, [key]: value }));
                          }}
                        />
                        <strong>{triggerTest[key]}%</strong>
                      </label>
                    ))}
                  </div>
                  <button className="primary-action" type="button" disabled={testDisabled} onClick={() => void runTriggerTest()}>
                    <Play size={15} />
                    {triggerTestRunning ? 'Testing' : 'Test Triggers'}
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={testDisabled || !triggerTestRunning}
                    onClick={() => void stopTriggerTest()}
                  >
                    <span className="stop-glyph" aria-hidden="true" />
                    Stop Test
                  </button>
                  <div className={`feature-status test-status ${statusTone}`}>
                    <span className="status-badge">
                      <span className={`dot ${statusTone}`} />
                      <strong>{statusLabel}</strong>
                    </span>
                  </div>
                </>
              );
            })()}
          </section>
        </div>
        <FeatureTipsPanel
          tab="triggers"
          onSettingsFocusRequest={focusBridgeSettings}
        />
    </div>
  );
}
