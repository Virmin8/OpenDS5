import {
  IconAlertHexagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconTestPipe,
  IconWaveSine,
  IconKeyboard as Keyboard,
  IconMicrophone as Mic,
  IconMicrophoneOff as MicOff,
  IconPlayerPlay as Play,
  IconAdjustmentsHorizontal as SlidersHorizontal,
  IconVolumeOff as VolumeX
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import type { BridgeSnapshot } from '../../shared/types';
import {
  AUDIO_BUFFER_LENGTH_MAX,
  AUDIO_BUFFER_LENGTH_MIN,
  audioBufferDelayLabel,
  audioBufferPercent,
  audioBufferZoneLabel,
  audioBufferZoneTone,
  audioBufferZoneTooltip,
  clampAudioBufferLength,
  MIC_PROCESSING_OPTIONS,
  MIC_SPEAKER_GAIN_OPTIONS,
  MIC_VOLUME_PRESETS,
  MIC_VOLUME_STEP,
  snapMicVolume,
  snapSpeakerVolume,
  SPEAKER_BOOST_OPTIONS,
  SPEAKER_GAIN_OPTIONS,
  SPEAKER_VOLUME_PRESETS,
  SPEAKER_VOLUME_STEP,
  stopMicLiveListen
} from '../app/audio';
import {
  effectiveMuteButtonMode,
  MUTE_BUTTON_MODE_OPTIONS,
  MUTE_KEY_OPTIONS,
  MUTE_KEYBOARD_BEHAVIOR_OPTIONS,
  MUTE_MODIFIER_OPTIONS,
  PERCENT_SLIDER_TICKS,
  sliderTickClass,
  VDS_AVAILABLE,
  VDS_LINUX
} from '../app/common';
import { AudioHapticsConfigLabel, CustomSelect, FeatureTipsPanel } from '../app/components';
import type { AppState } from '../app/useAppState';

export function AudioTab({ app, snapshot }: { app: AppState; snapshot: BridgeSnapshot }) {
  const {
    activeAudioTestLocked, activeAudioTestStatusLabel, activeAudioTestStatusTone,
    activeAudioTestUnavailable, activeControlTab, audioBufferAuto, audioBufferLengthControlDisabled,
    audioBufferLengthControlSupported, audioBufferLengthEditingRef, audioBufferLengthValue,
    audioEnabled, audioPathLabel, audioPathTone, audioPathTooltip, commitAudioBufferLength,
    commitMicVolume, commitSpeakerVolume, connected, controllerControlsAvailable, duplexMicEnabled,
    duplexMicLabel, gameStreamActive, largerAudioBlocks, largerAudioBlocksError,
    largerAudioBlocksPending, microphoneOn, micTestError, micTestLocked, micVolumeCommitPending,
    micVolumeEditingRef, micVolumeValue, muteButtonActionsSupported, outputControlLabel,
    outputControlLower, OutputIcon, pendingAction, runAction, runTestMic, runTestSpeaker,
    setAudioBufferLengthValue, setMicPreset, setMicVolumeValue, setMuteButtonAction, setMuteModifier,
    setShowMicrophoneControl, setSpeakerGainLevel, setSpeakerPreset, setSpeakerTestLocked,
    setSpeakerVolumeValue, showMicrophoneControl, speakerGainLevel, speakerOutputMissing,
    speakerTestLocked, speakerVolumeCommitPending, speakerVolumeEditingRef, speakerVolumeSupported,
    speakerVolumeValue, toggleAudioEnabled, toggleDuplexMicEnabled, toggleLargerAudioBlocks,
    toggleMicMute, toggleSpeakerEnabled
  } = app;

  // vdsd mic processing, shown on the Audio page's Mic view.
  function renderMicProcessingCard() {
    if (!snapshot) {
      return null;
    }
    return (
      <section className="system-card audio-processing-card">
        <div className="feature-card-title system-card-heading">
          <span className="feature-icon system-icon icon-wide"><SlidersHorizontal size={20} /></span>
          <div className="title-copy">
            <h3>Mic Processing</h3>
            <p>Controller sound processing while the mic is on.</p>
          </div>
        </div>
        <div className="segmented-row mic-processing-grid" role="radiogroup" aria-label="Mic processing">
          {MIC_PROCESSING_OPTIONS.map(([label, value]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={snapshot.settings.micProcessing === value}
              className={snapshot.settings.micProcessing === value ? 'active' : ''}
              disabled={!controllerControlsAvailable || pendingAction !== null}
              onClick={() => void runAction('mic-processing', () => window.bridge.setMicProcessing(value))}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mic-speaker-warning">
          <IconAlertTriangle size={16} stroke={2.2} aria-hidden="true" />
          <span>
            Noise cancelling and a high Mic-On Gain lower the controller speaker&apos;s quality while
            the mic is on. Echo cancelling keeps it clean.
          </span>
        </p>
      </section>
    );
  }

  // Mute Button settings, shown on the Audio page's Mic view.
  function renderMuteButtonCard() {
    if (!snapshot) {
      return null;
    }
    return (
      <section className="system-card mute-card audio-mute-card">
        <div className="feature-card-title system-card-heading">
          <span className="feature-icon system-icon icon-wide"><MicOff size={20} /></span>
          <div className="title-copy">
            <h3>Mute Button</h3>
            <p>Set controller mute behavior.</p>
          </div>
        </div>
        <div className="system-fields">
          <div className="select-row">
            <span>Behavior</span>
            <CustomSelect
              value={effectiveMuteButtonMode(snapshot.settings.muteButtonMode)}
              disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
              options={MUTE_BUTTON_MODE_OPTIONS}
              ariaLabel="Mute button behavior"
              onChange={(mode) => setMuteButtonAction(mode)}
            />
          </div>
          {VDS_AVAILABLE && (
            <div className="select-row">
              <span>Mute Light</span>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.muteLedEnabled}
                aria-label="Mute light"
                title="Light the Mute button while the microphone is off"
                className={`switch ${snapshot.settings.muteLedEnabled ? 'on' : ''}`}
                disabled={!connected || pendingAction !== null}
                onClick={() => void runAction('mute-light', () => (
                  window.bridge.setMuteLedEnabled(!snapshot.settings.muteLedEnabled)
                ))}
              >
                <span />
              </button>
            </div>
          )}
          {effectiveMuteButtonMode(snapshot.settings.muteButtonMode) === 'keyboard' && (
            <>
              <div className="select-row">
                <span>Key</span>
                <CustomSelect
                  value={snapshot.settings.muteKeyboardUsage}
                  disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                  options={MUTE_KEY_OPTIONS}
                  ariaLabel="Mute keyboard key"
                  onChange={(usage) => setMuteButtonAction('keyboard', usage)}
                />
              </div>
              <div className="select-row">
                <span>Press Mode</span>
                <CustomSelect
                  value={snapshot.settings.muteKeyboardBehavior}
                  disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                  options={MUTE_KEYBOARD_BEHAVIOR_OPTIONS}
                  ariaLabel="Mute keyboard press mode"
                  onChange={(behavior) => setMuteButtonAction('keyboard', undefined, undefined, behavior)}
                />
              </div>
              <div className="modifier-block">
                <div className="modifier-grid" aria-label="Keyboard modifiers">
                  {MUTE_MODIFIER_OPTIONS.map(([label, bit]) => {
                    const enabled = (snapshot.settings.muteKeyboardModifiers & bit) !== 0;
                    return (
                      <button
                        key={bit}
                        type="button"
                        className={enabled ? 'active' : ''}
                        disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                        onClick={() => setMuteModifier(bit, !enabled)}
                      >
                        <Keyboard size={16} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="select-row">
                <span
                  className="settings-menu-copy-tooltip chord-starter-label"
                  tabIndex={0}
                  aria-describedby="mute-chord-starter-tooltip"
                >
                  Chord Starter
                  <span
                    id="mute-chord-starter-tooltip"
                    className="settings-shortcut-tooltip chord-starter-tooltip"
                    role="tooltip"
                  >
                    Lets Mute start a chord. When enabled, the keyboard key waits 250ms so a chord can be detected first.
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={snapshot.settings.muteKeyboardChordStarterEnabled}
                  className={`switch ${snapshot.settings.muteKeyboardChordStarterEnabled ? 'on' : ''}`}
                  disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                  onClick={() => setMuteButtonAction(
                    'keyboard',
                    undefined,
                    undefined,
                    undefined,
                    !snapshot.settings.muteKeyboardChordStarterEnabled
                  )}
                >
                  <span />
                </button>
              </div>
            </>
          )}
          {snapshot.settings.muteButtonMode === 'quiet' && (
            <div className={`quiet-state ${snapshot.status?.quietModeEnabled ? 'active' : ''}`}>
              <VolumeX size={18} />
              <span>{snapshot.status?.quietModeEnabled ? 'Controller Quiet On' : 'Controller Quiet Off'}</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Larger audio blocks (Linux), shown on the Audio page's Speaker view.
  function renderAudioBlocksCard() {
    return (
      <section className="system-card audio-blocks-card">
        <div className="feature-card-title system-card-heading">
          <span className="feature-icon system-icon icon-wide"><IconWaveSine size={20} /></span>
          <div className="title-copy">
            <h3>Audio Blocks</h3>
            <p>Turn on if controller audio crackles.</p>
          </div>
        </div>
        <div className="system-fields">
          <div className="select-row">
            <span>Larger Audio Blocks</span>
            <button
              type="button"
              role="switch"
              aria-checked={largerAudioBlocks === true}
              aria-label="Larger audio blocks"
              title="PipeWire's usual 5.3 ms blocks instead of 2.7 ms. Haptics get slightly less tight. Changing it restarts PipeWire, so all sound stops for a moment."
              className={`switch ${largerAudioBlocks ? 'on' : ''}`}
              disabled={largerAudioBlocksPending}
              onClick={() => void toggleLargerAudioBlocks()}
            >
              <span />
            </button>
          </div>
        </div>
        <p className="audio-blocks-note" role={largerAudioBlocksError ? 'alert' : undefined}>
          {largerAudioBlocksError
            || (largerAudioBlocksPending
              ? 'Restarting PipeWire…'
              : 'Changing this restarts PipeWire, so all sound stops for a moment.')}
        </p>
      </section>
    );
  }

  return (
    <div
      className={`control-page audio-page ${activeControlTab === 'audio' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-audio"
      aria-labelledby="control-tab-audio"
      aria-hidden={activeControlTab !== 'audio'}
    >
        <div className="feature-heading">
          <div>
            <h2>Audio</h2>
            <p>{`Adjust controller ${outputControlLower} and microphone levels.`}</p>
          </div>
          <div className="audio-heading-actions">
            <div className="chords-field chords-inline-field audio-speaker-gain-field">
              <span>Speaker Gain</span>
              <CustomSelect
                value={speakerGainLevel}
                options={SPEAKER_GAIN_OPTIONS}
                disabled={!controllerControlsAvailable || !speakerVolumeSupported || pendingAction !== null}
                ariaLabel="Speaker gain"
                className="audio-speaker-gain-select"
                closeOnSelect={true}
                onChange={setSpeakerGainLevel}
                renderValue={(_label, value) => (
                  <span>{value}</span>
                )}
                renderOption={(label) => (
                  <span className="speaker-gain-option">
                    <strong>{label}</strong>
                  </span>
                )}
              />
            </div>
            {VDS_AVAILABLE && (
              <div
                className="chords-field chords-inline-field audio-speaker-gain-field audio-mic-gain-field"
                title="Speaker gain while the microphone is on. Same keeps the Speaker Gain; higher levels lower the speaker's quality."
              >
                <span>Mic-On Gain</span>
                <CustomSelect
                  value={snapshot.settings.micSpeakerGainLevel}
                  options={MIC_SPEAKER_GAIN_OPTIONS}
                  disabled={!controllerControlsAvailable || !speakerVolumeSupported || pendingAction !== null}
                  ariaLabel="Speaker gain while the microphone is on"
                  className="audio-speaker-gain-select audio-mic-gain-select"
                  closeOnSelect={true}
                  onChange={(value) => void runAction('mic-speaker-gain', () => window.bridge.setMicSpeakerGainLevel(value))}
                  renderValue={(label) => (
                    <span>{label}</span>
                  )}
                  renderOption={(label) => (
                    <span className="speaker-gain-option">
                      <strong>{label}</strong>
                    </span>
                  )}
                />
              </div>
            )}
            {VDS_AVAILABLE && (
              <div
                className="chords-field chords-inline-field audio-speaker-gain-field audio-speaker-boost-field"
                title="Extra loudness for the controller's built-in speaker. Lower it if the speaker sounds harsh or distorted; headphones bypass it."
              >
                <span>Speaker Boost</span>
                <CustomSelect
                  value={snapshot.settings.speakerBoostDb}
                  options={SPEAKER_BOOST_OPTIONS}
                  disabled={!controllerControlsAvailable || !speakerVolumeSupported || pendingAction !== null}
                  ariaLabel="Speaker boost"
                  className="audio-speaker-gain-select audio-speaker-boost-select"
                  closeOnSelect={true}
                  onChange={(value) => void runAction('speaker-boost', () => window.bridge.setSpeakerBoostDb(value))}
                  renderValue={(label) => (
                    <span>{label}</span>
                  )}
                  renderOption={(label) => (
                    <span className="speaker-gain-option">
                      <strong>{label}</strong>
                    </span>
                  )}
                />
              </div>
            )}
            <div className="audio-heading-controls">
              <div className="inline-switch">
                <span>Enabled</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={audioEnabled}
                  aria-label="Enable audio"
                  className={`switch ${audioEnabled ? 'on' : ''}`}
                  disabled={!controllerControlsAvailable || pendingAction !== null}
                  onClick={toggleAudioEnabled}
                >
                  <span />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="feature-card-grid">
          <section className="feature-card preset-card">
            <div className="feature-card-title">
              <button
                type="button"
                className={`feature-icon audio-enable-button icon-medium ${
                  showMicrophoneControl
                    ? duplexMicEnabled
                      ? 'active'
                      : ''
                    : snapshot.settings.speakerEnabled
                      ? 'active'
                      : ''
                }`}
                aria-pressed={showMicrophoneControl ? duplexMicEnabled : snapshot.settings.speakerEnabled}
                aria-label={showMicrophoneControl ? duplexMicLabel : `Enable controller ${outputControlLower}`}
                title={showMicrophoneControl ? duplexMicLabel : `Enable controller ${outputControlLower}`}
                disabled={
                  showMicrophoneControl
                    ? !controllerControlsAvailable || pendingAction !== null
                    : !controllerControlsAvailable || !speakerVolumeSupported || pendingAction !== null
                }
                onClick={showMicrophoneControl ? toggleDuplexMicEnabled : toggleSpeakerEnabled}
              >
                {showMicrophoneControl ? <Mic size={20} /> : <OutputIcon size={20} />}
              </button>
              <div className="title-copy">
                <h3>{showMicrophoneControl ? 'Microphone' : outputControlLabel}</h3>
                <p>
                  {showMicrophoneControl
                    ? 'Microphone level'
                    : `${outputControlLabel} level`}
                </p>
              </div>
              <div className="dual-selector audio-mode-selector" role="tablist" aria-label="Audio control mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!showMicrophoneControl}
                  className={!showMicrophoneControl ? 'active' : ''}
                  onClick={() => setShowMicrophoneControl(false)}
                >
                  {outputControlLabel}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={showMicrophoneControl}
                  className={showMicrophoneControl ? 'active' : ''}
                  onClick={() => setShowMicrophoneControl(true)}
                >
                  Mic
                </button>
              </div>
            </div>
            <div className="framed-slider">
              <label className="slider-row">
                <span>0%</span>
                <div className="range-control">
                  {showMicrophoneControl ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step={MIC_VOLUME_STEP}
                      value={micVolumeValue}
                      disabled={!connected || !duplexMicEnabled || micVolumeCommitPending}
                      style={{ '--range-fill': `${micVolumeValue}%` } as CSSProperties}
                      aria-label="Microphone level"
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
                  ) : (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step={SPEAKER_VOLUME_STEP}
                      value={speakerVolumeValue}
                      disabled={!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled}
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
                  )}
                  <div className="range-ticks" aria-hidden="true">
                    {PERCENT_SLIDER_TICKS.map((value) => (
                      <span key={value} className={sliderTickClass(value, 100)} />
                    ))}
                  </div>
                </div>
                <strong>{showMicrophoneControl ? micVolumeValue : speakerVolumeValue}%</strong>
              </label>
            </div>
            {showMicrophoneControl ? (
              <>
                <div className="segmented-row">
                  {MIC_VOLUME_PRESETS.map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      className={micVolumeValue === value ? 'active' : ''}
                      disabled={!connected || !duplexMicEnabled || micVolumeCommitPending}
                      onClick={() => setMicPreset(Number(value))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {VDS_AVAILABLE ? (
                  <div className="mic-switch-row">
                    <span>Microphone</span>
                    <span className="mic-switch-state">
                      {microphoneOn ? 'On' : VDS_LINUX ? 'Off · muted in Linux' : 'Off'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={microphoneOn}
                      aria-label="Microphone"
                      className={`switch ${microphoneOn ? 'on' : ''}`}
                      disabled={!controllerControlsAvailable || pendingAction !== null}
                      onClick={toggleDuplexMicEnabled}
                    >
                      <span />
                    </button>
                  </div>
                ) : (
                  <div className="mic-option-grid">
                    <button
                      type="button"
                      className={snapshot.settings.micMuted ? 'active danger' : ''}
                      aria-pressed={snapshot.settings.micMuted}
                      disabled={!connected || !duplexMicEnabled || pendingAction !== null}
                      onClick={toggleMicMute}
                    >
                      <VolumeX size={15} />
                      Mute
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="segmented-row">
                  {SPEAKER_VOLUME_PRESETS.map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      className={speakerVolumeValue === value ? 'active' : ''}
                      disabled={!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled || speakerVolumeCommitPending}
                      onClick={() => setSpeakerPreset(Number(value))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="audio-secondary-controls">
                  <div
                    className={`audio-buffer-control framed-slider ${audioBufferLengthControlDisabled ? 'disabled' : ''}`}
                    style={{ '--range-fill': `${audioBufferPercent(audioBufferLengthValue)}%` } as CSSProperties}
                  >
                    <div className={`audio-buffer-header ${VDS_AVAILABLE ? 'with-auto-switch' : ''}`}>
                      <AudioHapticsConfigLabel
                        id="audio-buffer-length-tooltip"
                        label="Audio Buffer Length"
                        tooltip="Sets the DualSense audio buffer value. Lower values reduce haptic delay but increase stutter risk; higher values improve speaker stability at the cost of latency."
                        className="audio-buffer-title"
                      />
                      <div className="audio-buffer-readout">
                        {audioBufferAuto ? (
                          <strong>Auto</strong>
                        ) : (
                          <>
                            <strong>{audioBufferLengthValue}</strong>
                            <span>{audioBufferDelayLabel(audioBufferLengthValue)}</span>
                          </>
                        )}
                      </div>
                      {audioBufferAuto && <span aria-hidden="true" />}
                      {!audioBufferAuto && (
                        <div
                          className={`audio-buffer-status-icon ${audioBufferZoneTone(audioBufferLengthValue)}`}
                          aria-label={audioBufferZoneLabel(audioBufferLengthValue)}
                          aria-describedby="audio-buffer-zone-tooltip"
                          tabIndex={0}
                        >
                          {audioBufferZoneTone(audioBufferLengthValue) === 'safe' && (
                            <IconCircleCheck size={18} stroke={2.35} aria-hidden="true" />
                          )}
                          {audioBufferZoneTone(audioBufferLengthValue) === 'risky' && (
                            <IconAlertTriangle size={18} stroke={2.35} aria-hidden="true" />
                          )}
                          {audioBufferZoneTone(audioBufferLengthValue) === 'stutter' && (
                            <IconAlertHexagon size={18} stroke={2.35} aria-hidden="true" />
                          )}
                          <span
                            id="audio-buffer-zone-tooltip"
                            className="settings-shortcut-tooltip shortcut-glyph-tooltip audio-buffer-zone-tooltip"
                            role="tooltip"
                          >
                            {audioBufferZoneTooltip(audioBufferLengthValue)}
                          </span>
                        </div>
                      )}
                      {VDS_AVAILABLE && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={audioBufferAuto}
                          aria-label="Automatic audio buffer length"
                          title="Automatic: the lowest buffer your Bluetooth link can keep smooth"
                          className={`switch ${audioBufferAuto ? 'on' : ''}`}
                          disabled={!connected || !audioBufferLengthControlSupported || pendingAction !== null}
                          onClick={() => void runAction('audio-buffer-auto', () => (
                            window.bridge.setHapticsBufferAuto(!audioBufferAuto)
                          ))}
                        >
                          <span />
                        </button>
                      )}
                    </div>
                    {!audioBufferAuto && (
                    <label className="audio-slider-row audio-buffer-slider-row">
                      <div className="range-control audio-buffer-range-control">
                        <input
                          type="range"
                          min={AUDIO_BUFFER_LENGTH_MIN}
                          max={AUDIO_BUFFER_LENGTH_MAX}
                          step="1"
                          value={audioBufferLengthValue}
                          aria-label="Audio buffer length"
                          aria-valuetext={`${audioBufferLengthValue}, ${audioBufferDelayLabel(audioBufferLengthValue)}, ${audioBufferZoneLabel(audioBufferLengthValue)}`}
                          disabled={audioBufferLengthControlDisabled}
                          onPointerDown={() => {
                            audioBufferLengthEditingRef.current = true;
                          }}
                          onPointerCancel={() => void commitAudioBufferLength()}
                          onChange={(event) => {
                            audioBufferLengthEditingRef.current = true;
                            setAudioBufferLengthValue(clampAudioBufferLength(Number(event.currentTarget.value)));
                          }}
                          onPointerUp={() => void commitAudioBufferLength()}
                          onKeyDown={(event) => {
                            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                              audioBufferLengthEditingRef.current = true;
                            }
                          }}
                          onKeyUp={(event) => {
                            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                              void commitAudioBufferLength();
                            }
                          }}
                          onBlur={() => void commitAudioBufferLength()}
                        />
                      </div>
                    </label>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
          <section className="feature-card test-card">
            <div className="feature-card-title">
              <span className="feature-icon"><IconTestPipe size={20} /></span>
              <div className="title-copy">
                <h3>Testing</h3>
                <p>{showMicrophoneControl ? 'Listen to the controller microphone for five seconds.' : `Play a short sample through the controller ${outputControlLower}.`}</p>
              </div>
            </div>
            <button
              className="primary-action"
              type="button"
              disabled={activeAudioTestUnavailable}
              onClick={showMicrophoneControl ? runTestMic : runTestSpeaker}
            >
              {showMicrophoneControl ? <Mic size={15} /> : <Play size={15} />}
              {showMicrophoneControl
                ? connected && micTestLocked
                  ? 'Live Listening'
                  : connected && micTestError
                    ? 'Retry Mic'
                    : 'Test Mic'
                : connected && speakerTestLocked
                  ? 'Playing Tone'
                  : connected && gameStreamActive
                    ? 'Game Active'
                  : connected && speakerOutputMissing
                      ? `Retry ${outputControlLabel}`
                    : `Test ${outputControlLabel}`}
            </button>
            <button
              className="secondary-action"
              type="button"
              disabled={!activeAudioTestLocked}
              onClick={showMicrophoneControl ? stopMicLiveListen : () => setSpeakerTestLocked(false)}
            >
              <span className="stop-glyph" aria-hidden="true" />
              Stop Test
            </button>
            <div className="feature-status test-status audio-test-status">
              <span className={`status-badge ${activeAudioTestStatusTone}`} title={activeAudioTestStatusLabel}>
                <span className={`dot ${activeAudioTestStatusTone}`} />
                <strong>{activeAudioTestStatusLabel}</strong>
              </span>
              <span className={`status-badge ${audioPathTone}`} title={audioPathTooltip}>
                <span className={`dot ${audioPathTone}`} />
                <strong>{audioPathLabel}</strong>
              </span>
            </div>
          </section>
        </div>
        {showMicrophoneControl ? (
          <div className={`feature-card-grid audio-mic-extra-grid ${VDS_AVAILABLE ? '' : 'single'}`}>
            {VDS_AVAILABLE && renderMicProcessingCard()}
            {renderMuteButtonCard()}
          </div>
        ) : VDS_LINUX && largerAudioBlocks !== null ? (
          <div className="feature-card-grid audio-mic-extra-grid">
            {renderAudioBlocksCard()}
            <FeatureTipsPanel tab="audio" />
          </div>
        ) : <FeatureTipsPanel tab="audio" />}
    </div>
  );
}
