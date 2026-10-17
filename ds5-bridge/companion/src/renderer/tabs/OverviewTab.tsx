import {
  IconActivity as Activity,
  IconBell as Bell,
  IconAdjustmentsSpark,
  IconBatteryEco,
  IconBinary,
  IconBluetooth,
  IconBrandXbox,
  IconDeviceGamepad2,
  IconMicrophone as Mic,
  IconMoon as Moon,
  IconPlayerPlay as Play,
  IconVolume as Volume2,
  IconBolt as Zap
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import playStationLogoUrl from '../../../../assets/brand/playstation-logo.svg';
import type { BridgeSnapshot } from '../../shared/types';
import {
  HAPTICS_STEP,
  MIC_VOLUME_STEP,
  snapHapticsValue,
  snapMicVolume,
  snapSpeakerVolume,
  SPEAKER_VOLUME_STEP
} from '../app/audio';
import {
  HOST_PERSONA_OPTIONS,
  PERCENT_SLIDER_TICKS,
  SIGNAL_STRENGTH_AVAILABLE,
  sliderTickClass,
  TOUCHPAD_MOUSE_AVAILABLE,
  VDS_AVAILABLE
} from '../app/common';
import { DpadShortcutGlyphs, TurnOffShortcutGlyphs } from '../app/components';
import { LIGHTBAR_BRIGHTNESS_STEP, snapLightbarBrightness } from '../app/lighting';
import type { AppState } from '../app/useAppState';

export function OverviewTab({ app, snapshot }: { app: AppState; snapshot: BridgeSnapshot }) {
  const {
    activeControlTab, activeFeedbackTestUnavailable, adaptiveTriggersSupported, commitHapticsValue,
    commitLightbar, commitMicVolume, commitSpeakerVolume, connected, controllerConnected,
    controllerControlsAvailable, duplexMicEnabled, focusBridgeSettings, focusNotificationSettings,
    handleOverviewSleepController, hapticsEditingRef, hapticsSliderMax, hapticsSliderTicks,
    hapticsValue, hostPersonaControlSupported, lightbarBrightnessEditingRef, lightbarBrightnessValue,
    lightbarCommitPending, lightbarSupported, microphoneOn, micVolumeCommitPending,
    micVolumeEditingRef, micVolumeValue, overviewAudioOutputLabel, overviewAudioPathDetail,
    overviewAudioPathState, overviewConnectionStatus, overviewFirmwareLabel, overviewHealthLabel,
    overviewHealthTone, overviewHostPersonaMode, overviewNotificationItems, overviewPowerSavingLabel,
    overviewShortcutItems, overviewSignalLabel, overviewSignalTitle, overviewSignalTone,
    overviewSleepConfirmVisible, overviewSpeakerVolumeValue, pendingAction, percentSliderMax,
    personaTransitionActive, pollingRateControlSupported, pollingRateLabel, runAction,
    runFeedbackTest, runTestMic, runTestSpeaker, runTriggerTest, selectControlTab, setHapticsValue,
    setHostPersonaMode, setLightbarBrightnessValue, setMicVolumeValue, setSpeakerVolumeValue,
    sleepControllerSupported, speakerVolumeCommitPending, speakerVolumeEditingRef,
    speakerVolumeSupported, speakerVolumeValue, supportedHostPersonaModes, testMicUnavailable,
    testSpeakerUnavailable, toggleDuplexMicEnabled, triggerTestRunning
  } = app;

  return (
    <div
      className={`control-page overview-page ${activeControlTab === 'overview' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-overview"
      aria-labelledby="control-tab-overview"
      aria-hidden={activeControlTab !== 'overview'}
    >
      <div className="feature-heading overview-heading">
        <div>
          <h2>Overview</h2>
          <p>At-a-glance status of your controller and active settings.</p>
        </div>
        <span className={`overview-health health-label ${overviewHealthTone}`}>
          <span className={`dot ${overviewHealthTone}`} />
          {overviewHealthLabel}
        </span>
      </div>

      <div className="overview-card-grid">
        <button className="overview-card" type="button" onClick={() => selectControlTab('system')}>
          <div className="overview-card-title">
            <span className="feature-icon overview-icon"><Activity size={19} /></span>
            <h3>Connection</h3>
          </div>
          <div className="overview-fields">
            <div>
              <span>USB</span>
              <strong className={overviewConnectionStatus === 'Stable' ? 'success-value' : ''}>
                {overviewConnectionStatus}
              </strong>
            </div>
            {!VDS_AVAILABLE && (
              <div>
                <span>Polling Rate</span>
                <strong>{connected && pollingRateControlSupported ? pollingRateLabel : '--'}</strong>
              </div>
            )}
          </div>
        </button>

        <button className="overview-card" type="button" onClick={() => selectControlTab('audio')}>
          <div className="overview-card-title">
            <span className="feature-icon overview-icon"><IconBinary size={26} /></span>
            <h3>Audio Path</h3>
          </div>
          <div className="overview-fields">
            <div>
              <span>Route</span>
              <strong className={overviewAudioPathState === 'Bridge Local' ? 'success-value' : ''}>
                {overviewAudioPathState}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{overviewAudioPathDetail}</strong>
            </div>
          </div>
        </button>

        <button className="overview-card" type="button" onClick={() => selectControlTab('audio')}>
          <div className="overview-card-title">
            <span className="feature-icon overview-icon"><Volume2 size={19} /></span>
            <h3>Audio</h3>
          </div>
          <div className="overview-fields">
            <div>
              <span>Route</span>
              <strong>{overviewAudioOutputLabel}</strong>
            </div>
            <div>
              <span>Volume</span>
              <strong>{overviewSpeakerVolumeValue}</strong>
            </div>
          </div>
        </button>

        <button className="overview-card" type="button" onClick={() => selectControlTab('system')}>
          <div className="overview-card-title">
            <span className="feature-icon overview-icon"><IconBluetooth size={19} /></span>
            <h3>Wireless</h3>
          </div>
          <div className="overview-fields">
            {SIGNAL_STRENGTH_AVAILABLE && (
            <div>
              <span>Signal</span>
              <strong className={`signal-value ${overviewSignalTone}`} title={overviewSignalTitle}>
                {overviewSignalLabel}
              </strong>
            </div>
            )}
            <div>
              <span>{VDS_AVAILABLE ? 'Bridge' : 'Firmware'}</span>
              <strong>{VDS_AVAILABLE ? 'vds' : overviewFirmwareLabel}</strong>
            </div>
          </div>
        </button>
      </div>

      <div className="overview-control-grid">
        <section className="overview-control-panel overview-quick-actions" aria-label="Quick actions">
          <div className="overview-panel-heading">
            <span className="feature-icon overview-icon"><Zap size={18} /></span>
            <div>
              <h3>Quick Actions</h3>
            </div>
          </div>
          <div className="overview-action-grid">
            <button
              type="button"
              disabled={activeFeedbackTestUnavailable}
              onClick={runFeedbackTest}
            >
              <Play size={15} />
              Test Haptics
            </button>
            <button
              type="button"
              disabled={testSpeakerUnavailable}
              onClick={runTestSpeaker}
            >
              <Volume2 size={15} />
              Test Speaker
            </button>
            {VDS_AVAILABLE ? (
              // vds has no microphone path; the slot tests the triggers instead.
              <button
                type="button"
                disabled={!connected || !controllerConnected || !adaptiveTriggersSupported || !snapshot.settings.adaptiveTriggersEnabled}
                onClick={() => void runTriggerTest()}
              >
                <IconDeviceGamepad2 size={15} />
                {triggerTestRunning ? 'Testing…' : 'Test Triggers'}
              </button>
            ) : (
              <button
                type="button"
                disabled={testMicUnavailable}
                onClick={runTestMic}
              >
                <Mic size={15} />
                Listen Mic
              </button>
            )}
            <button
              type="button"
              className={overviewSleepConfirmVisible ? 'confirm' : undefined}
              disabled={!connected || !sleepControllerSupported || !controllerConnected || pendingAction !== null}
              onClick={handleOverviewSleepController}
            >
              <Moon size={15} />
              {overviewSleepConfirmVisible ? 'Confirm Turn Off' : 'Turn Off Controller'}
            </button>
          </div>
          <div className="overview-persona-grid" aria-label="Host controller persona">
            {HOST_PERSONA_OPTIONS.map(([label, mode]) => {
              const active = overviewHostPersonaMode === mode;
              const supported = supportedHostPersonaModes.includes(mode);
              const disabled = !connected
                || !hostPersonaControlSupported
                || pendingAction !== null
                || personaTransitionActive
                || (!supported && !active);
              return (
                <button
                  key={mode}
                  type="button"
                  className={`overview-persona-button persona-${mode} ${active ? 'active' : ''}`}
                  aria-pressed={active}
                  disabled={disabled}
                  title={`Switch to ${label} mode`}
                  onClick={() => {
                    if (!active) {
                      setHostPersonaMode(mode);
                    }
                  }}
                >
                  {mode === 'xbox' ? (
                    <IconBrandXbox className="overview-persona-logo" aria-hidden="true" />
                  ) : (
                    <span
                      className="overview-persona-logo playstation"
                      style={{ '--overview-persona-logo-mask': `url("${playStationLogoUrl}")` } as CSSProperties}
                      aria-hidden="true"
                    />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overview-control-panel overview-sliders" aria-label="Quick controls">
          <div className="overview-panel-heading">
            <span className="feature-icon overview-icon"><IconAdjustmentsSpark size={18} /></span>
            <div>
              <h3>Quick Controls</h3>
            </div>
            {TOUCHPAD_MOUSE_AVAILABLE && (
              <div className="overview-heading-toggle">
                <span>Touchpad Mouse</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={snapshot.settings.touchpadMouseEnabled}
                  className={`switch ${snapshot.settings.touchpadMouseEnabled ? 'on' : ''}`}
                  disabled={!connected || pendingAction !== null}
                  onClick={() => void runAction('touchpad-mouse', () => (
                    window.bridge.setTouchpadMouseEnabled(!snapshot.settings.touchpadMouseEnabled)
                  ))}
                >
                  <span />
                </button>
              </div>
            )}
            {VDS_AVAILABLE && (
              <div className="overview-heading-toggle">
                <span>Microphone</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={microphoneOn}
                  className={`switch ${microphoneOn ? 'on' : ''}`}
                  disabled={!controllerControlsAvailable || pendingAction !== null}
                  onClick={toggleDuplexMicEnabled}
                >
                  <span />
                </button>
              </div>
            )}
          </div>
          <div className="overview-slider-list">
            <label className={`overview-slider-row ${(!connected || !snapshot.settings.hapticsEnabled) ? 'disabled' : ''}`}>
              <span>HD Haptics</span>
              <div className="overview-range-control">
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
                <div className="overview-range-ticks" aria-hidden="true">
                  {hapticsSliderTicks.map((value) => (
                    <span key={value} className={sliderTickClass(value, hapticsSliderMax)} />
                  ))}
                </div>
              </div>
              <strong>{hapticsValue}%</strong>
            </label>
            <label className={`overview-slider-row ${(!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled || speakerVolumeCommitPending) ? 'disabled' : ''}`}>
              <span>Speaker</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step={SPEAKER_VOLUME_STEP}
                  value={speakerVolumeValue}
                  disabled={!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled || speakerVolumeCommitPending}
                  style={{ '--range-fill': `${speakerVolumeValue}%` } as CSSProperties}
                  onPointerDown={() => {
                    speakerVolumeEditingRef.current = true;
                  }}
                  onChange={(event) => setSpeakerVolumeValue(snapSpeakerVolume(Number(event.currentTarget.value)))}
                  onPointerUp={() => void commitSpeakerVolume()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      speakerVolumeEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitSpeakerVolume();
                    }
                  }}
                  onBlur={() => void commitSpeakerVolume()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((value) => (
                    <span key={value} className={sliderTickClass(value, 100)} />
                  ))}
                </div>
              </div>
              <strong>{speakerVolumeValue}%</strong>
            </label>
            <label className={`overview-slider-row ${(!connected || !duplexMicEnabled || micVolumeCommitPending) ? 'disabled' : ''}`}>
              <span>Mic</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step={MIC_VOLUME_STEP}
                  value={micVolumeValue}
                  disabled={!connected || !duplexMicEnabled || micVolumeCommitPending}
                  style={{ '--range-fill': `${micVolumeValue}%` } as CSSProperties}
                  onPointerDown={() => {
                    micVolumeEditingRef.current = true;
                  }}
                  onChange={(event) => setMicVolumeValue(snapMicVolume(Number(event.currentTarget.value)))}
                  onPointerUp={() => void commitMicVolume()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      micVolumeEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitMicVolume();
                    }
                  }}
                  onBlur={() => void commitMicVolume()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((value) => (
                    <span key={value} className={sliderTickClass(value, 100)} />
                  ))}
                </div>
              </div>
              <strong>{micVolumeValue}%</strong>
            </label>
            <label className={`overview-slider-row ${(!connected || !lightbarSupported || !snapshot.settings.lightbarEnabled || lightbarCommitPending) ? 'disabled' : ''}`}>
              <span>Lightbar</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max={percentSliderMax}
                  step={LIGHTBAR_BRIGHTNESS_STEP}
                  value={lightbarBrightnessValue}
                  disabled={!connected || !lightbarSupported || !snapshot.settings.lightbarEnabled || lightbarCommitPending}
                  style={{ '--range-fill': `${(lightbarBrightnessValue / percentSliderMax) * 100}%` } as CSSProperties}
                  onPointerDown={() => {
                    lightbarBrightnessEditingRef.current = true;
                  }}
                  onChange={(event) => setLightbarBrightnessValue(snapLightbarBrightness(Number(event.currentTarget.value)))}
                  onPointerUp={() => void commitLightbar()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      lightbarBrightnessEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitLightbar();
                    }
                  }}
                  onBlur={() => void commitLightbar()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((value) => (
                    <span key={value} className={sliderTickClass(value, 100)} />
                  ))}
                </div>
              </div>
              <strong>{lightbarBrightnessValue}%</strong>
            </label>
          </div>
        </section>
      </div>

      <section className="overview-status-panel" aria-label="Active settings summary">
        <div className="overview-status-group">
          <div className="overview-status-heading">
            <IconDeviceGamepad2 size={15} />
            <span>Shortcuts</span>
          </div>
          <div className="overview-chip-row">
            {overviewShortcutItems.length > 0 ? (
              overviewShortcutItems.map((item) => (
                <button
                  className="overview-chip overview-shortcut-chip active"
                  key={item.id}
                  type="button"
                  onClick={() => focusBridgeSettings(item.id === 'sleep' ? 'sleep-shortcut' : item.id === 'profile' ? 'profile-shortcut' : 'volume-shortcut')}
                >
                  {item.label}
                  {item.id === 'sleep' ? (
                    <span className="settings-shortcut-tooltip shortcut-glyph-tooltip overview-shortcut-tooltip" role="tooltip">
                      <span>Turn off the controller with</span>
                      <TurnOffShortcutGlyphs />
                    </span>
                  ) : (
                    <span className="settings-shortcut-tooltip shortcut-glyph-tooltip overview-shortcut-tooltip" role="tooltip">
                      <span>{item.id === 'profile' ? 'Previous/next controller profile with' : 'Controller volume up/down with'}</span>
                      <DpadShortcutGlyphs pair={item.id === 'profile' ? 'left-right' : 'up-down'} />
                    </span>
                  )}
                </button>
              ))
            ) : (
              <span className="overview-chip muted">None enabled</span>
            )}
          </div>
        </div>
        <div className="overview-status-group">
          <div className="overview-status-heading">
            <IconBatteryEco size={15} />
            <span>Power Saving</span>
          </div>
          <div className="overview-chip-row">
            <button
              className={`overview-chip ${snapshot.settings.controllerPowerSavingEnabled ? 'active success' : 'muted'}`}
              type="button"
              onClick={() => focusBridgeSettings('controller-power-saving')}
            >
              {overviewPowerSavingLabel}
            </button>
          </div>
        </div>
        <div className="overview-status-group">
          <div className="overview-status-heading">
            <Bell size={15} />
            <span>Notifications</span>
          </div>
          <div className="overview-chip-row">
            {overviewNotificationItems.length > 0 ? (
              overviewNotificationItems.map((item) => (
                <button
                  className="overview-chip active"
                  key={item.id}
                  type="button"
                  onClick={() => focusNotificationSettings(item.id)}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <button
                className="overview-chip muted"
                type="button"
                onClick={() => focusNotificationSettings('all')}
              >
                Off
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
