import {
  IconClipboardCopy,
  IconInfoCircle,
  IconStethoscope,
  IconTool,
  IconPencil as Pencil,
  IconRefresh as RefreshCcw,
  IconDeviceFloppy as Save,
  IconAdjustmentsHorizontal as Settings2,
  IconTrash as Trash2
} from '@tabler/icons-react';
import { Fragment } from 'react';
import type { BridgeSnapshot } from '../../shared/types';
import type { VdsTraceScope } from '../../shared/vds';
import { SPEAKER_LIMITING_WARN_DB } from '../app/audio';
import {
  controllerName,
  controllerProfileSettingsFromSnapshot,
  healthLabel,
  HOST_PERSONA_FULL_LABELS,
  HOST_PERSONA_OPTIONS,
  POLLING_RATE_OPTIONS,
  VDS_AVAILABLE,
  VDS_LINUX,
  vdsPacketModeLabel
} from '../app/common';
import {
  CustomSelect,
  HostPersonaOption,
  ProfileSaveStatus,
  SystemProfileSummary,
  UptimeValue
} from '../app/components';
import type { AppState } from '../app/useAppState';

export function SystemTab({ app, snapshot }: { app: AppState; snapshot: BridgeSnapshot }) {
  const {
    ackText, activeControlTab, appVersion, audioDebugText, audioEventLogText, backupBusy,
    backupStatus, canDeleteControllerProfile, checkForUpdatesNow, connected, controllerConnected,
    controllerPowerSavingActive, deleteControllerProfile, diagnosticsVisible, feedbackTraceText,
    hapticsCommitPending, hostPersonaControlSupported, hostPersonaOptions, lightbarCommitPending,
    manualUpdateCheck, openDeviceCleanupConfirm, overviewHostPersonaMode, pendingAction,
    personaTransitionActive, pollingRateControlSupported, renameControllerProfile, runAction,
    runBackupAction, saveControllerProfile, selectedControllerProfileIsDefault,
    selectedControllerProfileIsGameOwned, setHostPersonaMode, setPollingRateMode, setShowDiagnostics,
    settingsPath, setVdsTrace, showDiagnostics, copySupportReport, supportReportState, speakerVolumeCommitPending, statusTone,
    systemHealthTone, triggerTraceText, updateState, vdsAudioStats, vdsDaemonLog, vdsDaemonLogRef,
    vdsDiagnostics, vdsTracePending, vdsVersion
  } = app;

  return (
    <div
      className={`control-page system-page ${activeControlTab === 'system' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-system"
      aria-labelledby="control-tab-system"
      aria-hidden={activeControlTab !== 'system'}
    >
        <div className="feature-heading system-heading">
          <div>
            <h2>System</h2>
            <p>Configure bridge behavior and defaults.</p>
          </div>
          <div className="profile-controls">
            {!VDS_AVAILABLE && (
            <button
              className="heading-icon-action emergency-repair-button"
              type="button"
              title="Emergency device repair"
              aria-label="Emergency device repair"
              disabled={pendingAction !== null}
              onClick={openDeviceCleanupConfirm}
            >
              <IconTool size={20} />
            </button>
            )}
            <button
              className="heading-action"
              type="button"
              disabled={!connected || pendingAction !== null || hapticsCommitPending || speakerVolumeCommitPending || lightbarCommitPending}
              onClick={() => void runAction('restore', () => window.bridge.restoreDefaults())}
            >
              <RefreshCcw size={18} />
              Restore Defaults
            </button>
          </div>
        </div>

        <div className="feature-card-grid">
          <section className={`system-card device-card system-card-full ${showDiagnostics ? 'expanded' : ''}`}>
            <div className="feature-card-title system-card-heading">
              <span className="feature-icon system-icon icon-wide">
                {showDiagnostics ? <IconStethoscope size={20} /> : <Settings2 size={20} />}
              </span>
              <div className="title-copy">
                <h3>{showDiagnostics ? 'Diagnostics' : 'Device'}</h3>
                  <p>
                    {showDiagnostics
                      ? 'Debug Data'
                      : VDS_AVAILABLE ? 'Bluetooth bridge' : 'Firmware'}
                  </p>
              </div>
              <div className="system-card-heading-actions">
              {showDiagnostics && (
                <button
                  type="button"
                  className="secondary-action support-report-button"
                  disabled={supportReportState === 'copying'}
                  title="Copy versions, controller state, key settings and the end of the vdsd log, for a bug report. Bluetooth addresses and your home folder are hidden."
                  onClick={() => void copySupportReport()}
                >
                  <IconClipboardCopy size={15} />
                  {supportReportState === 'copied'
                    ? 'Copied'
                    : supportReportState === 'failed'
                      ? "Couldn't copy"
                      : 'Copy Support Report'}
                </button>
              )}
              <div className="dual-selector system-mode-selector" role="tablist" aria-label="System control mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!showDiagnostics}
                  className={!showDiagnostics ? 'active' : ''}
                  onClick={() => setShowDiagnostics(false)}
                >
                  Device
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={showDiagnostics}
                  className={showDiagnostics ? 'active' : ''}
                  onClick={() => setShowDiagnostics(true)}
                >
                  Diagnostics
                </button>
              </div>
              </div>
            </div>
            {showDiagnostics ? (
              <div className="device-diagnostics">
                <dl>
                  <div><dt>Protocol</dt><dd>{snapshot.diagnostics.protocolVersion ?? '--'}</dd></div>
                  <div>
                    <dt>Uptime</dt>
                    <dd>
                      <UptimeValue
                        active={diagnosticsVisible}
                        lastPollAt={snapshot.diagnostics.lastPollAt}
                        uptimeSeconds={snapshot.diagnostics.uptimeSeconds}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Revision</dt>
                    <dd><span className="diagnostic-number">{snapshot.diagnostics.settingsRevision ?? '--'}</span></dd>
                  </div>
                  <div><dt>Last ACK</dt><dd>{ackText}</dd></div>
                  <div><dt>{VDS_AVAILABLE ? 'Daemon Socket' : 'HID Path'}</dt><dd>{snapshot.diagnostics.hidPath ?? '--'}</dd></div>
                  {VDS_AVAILABLE && (
                    <>
                      <div>
                        <dt>Bluetooth</dt>
                        <dd>
                          {vdsDiagnostics?.bluetooth
                            ? `${vdsDiagnostics.bluetooth.mode === 'normal' ? 'Normal' : 'OpenDS5'}${vdsDiagnostics.bluetooth.listening ? ' · listening' : ''}${vdsDiagnostics.bluetooth.auto ? ' · auto' : ''}`
                            : vdsDiagnostics?.error || '--'}
                        </dd>
                      </div>
                      <div>
                        <dt>Host Mode</dt>
                        <dd>{HOST_PERSONA_FULL_LABELS[overviewHostPersonaMode]}</dd>
                      </div>
                      {(vdsDiagnostics?.controllers ?? []).filter((controller) => controller.registered).map((controller) => (
                        <div key={controller.address}>
                          <dt>Controller</dt>
                          <dd title={controller.address}>
                            {controller.connected
                              ? `${controller.path || 'bridged'} · ${controller.profile || 'auto'}`
                              : controller.online ? 'on system Bluetooth' : 'disconnected'}
                            {` · ${controller.address}`}
                          </dd>
                        </div>
                      ))}
                      {vdsAudioStats && !vdsAudioStats.available && (
                        <div><dt>Audio</dt><dd title={vdsAudioStats.error}>{vdsAudioStats.error}</dd></div>
                      )}
                      {(vdsAudioStats?.ports ?? []).map((audio) => (
                        <Fragment key={`audio-${audio.path}`}>
                          <div>
                            <dt>Audio</dt>
                            <dd>
                              {audio.streaming || audio.micOpen ? 'Streaming' : 'Idle'}
                              {' · '}
                              {audio.headphones
                                ? 'headphones, stereo'
                                : `speaker, ${audio.speakerMono ? 'mono' : 'stereo'}, boost ${audio.speakerBoostDb > 0 ? `+${audio.speakerBoostDb.toFixed(0)} dB` : 'off'}, volume ${audio.speakerVolumePercent}%`}
                            </dd>
                          </div>
                          {!audio.headphones && audio.speakerBoostDb > 0 && (
                            <div>
                              <dt>Limiter</dt>
                              <dd
                                className={audio.speakerLimitingDb > SPEAKER_LIMITING_WARN_DB ? 'diagnostic-warning' : undefined}
                                title="How much the speaker limiter turns the boosted audio down. A few dB now and then is fine; cutting more most of the time dulls the sound without making it louder."
                              >
                                {audio.speakerLimitingDb.toFixed(1)} dB avg · {audio.speakerLimitingMaxDb.toFixed(1)} dB peak
                                {audio.speakerLimitingDb > SPEAKER_LIMITING_WARN_DB && ' · lower Speaker Boost for clearer sound'}
                              </dd>
                            </div>
                          )}
                          <div>
                            <dt>Packets</dt>
                            <dd title="Each Bluetooth packet carries only what is live: haptics alone (0x33), plus speaker audio (0x36), plus the mic section while it records.">
                              {vdsPacketModeLabel(audio.packetMode, audio.hapticsOnly, audio.streaming)}
                            </dd>
                          </div>
                          <div>
                            <dt>Mic</dt>
                            <dd
                              className={!audio.micOpen && audio.micPacketsPerSecond > 0 ? 'diagnostic-warning' : undefined}
                              title="Mic packets from the controller. While the mic is closed there should be none; any that arrive make vdsd send the close again."
                            >
                              {audio.micOpen ? 'Open' : 'Closed'}
                              {` · ${audio.micPacketsPerSecond.toFixed(1)} packets/s · ${audio.micPacketsTotal} total`}
                              {audio.micStartupMs >= 0 ? ` · started in ${audio.micStartupMs} ms` : ''}
                              {audio.micFirstSoundMs >= 0 ? ` · first sound ${audio.micFirstSoundMs} ms` : ''}
                              {audio.micWhileClosedTotal > 0 ? ` · ${audio.micWhileClosedTotal} while closed` : ''}
                            </dd>
                          </div>
                          <div>
                            <dt>Buffer</dt>
                            <dd>{audio.bufferLength} samples · {audio.bufferMs.toFixed(1)} ms{audio.bufferAuto ? ' · auto' : ''}</dd>
                          </div>
                          <div>
                            <dt>Delivery</dt>
                            <dd>
                              {audio.streaming
                                ? `${audio.packetsPerSecond.toFixed(1)} packets/s · longest gap ${audio.maxGapMs.toFixed(1)} ms`
                                : '--'}
                            </dd>
                          </div>
                          <div>
                            <dt>Late Packets</dt>
                            <dd
                              className={audio.late > 0 ? 'diagnostic-warning' : undefined}
                              title="Gaps between audio packets longer than the controller's buffer. Each one is a probable audible dropout; raise the Audio Buffer Length if these keep appearing."
                            >
                              {audio.late} in the last {audio.windowSeconds > 0 ? `${audio.windowSeconds.toFixed(0)} s` : 'poll'} · {audio.lateTotal} total
                            </dd>
                          </div>
                          <div>
                            <dt>Queue</dt>
                            <dd title="Refills: the send queue ran dry mid-stream. Dropped: chunks discarded because the queue was full. Blocked: Bluetooth sends that had to wait.">
                              {audio.queueDepth} queued · {audio.refillsTotal} refills · {audio.trimsTotal} trimmed · {audio.queueDroppedTotal} dropped · {audio.blockedTotal} blocked
                            </dd>
                          </div>
                        </Fragment>
                      ))}
                      {vdsDiagnostics?.bluetooth?.lastError && (
                        <div><dt>Last Error</dt><dd title={vdsDiagnostics.bluetooth.lastError}>{vdsDiagnostics.bluetooth.lastError}</dd></div>
                      )}
                      {/* Trace toggles are Linux only; the Windows build hides them. */}
                      {VDS_LINUX && (
                      <div>
                        <dt>vdsd Trace</dt>
                        <dd className="vds-trace-toggles">
                          {(['output', 'input'] as VdsTraceScope[]).map((scope) => {
                            const on = scope === 'output' ? vdsDaemonLog?.traceOutput : vdsDaemonLog?.traceInput;
                            return (
                              <span key={scope} className="vds-trace-toggle">
                                <span>{scope === 'output' ? 'Output' : 'Input'}</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={Boolean(on)}
                                  aria-label={`vdsd ${scope} trace`}
                                  className={`switch ${on ? 'on' : ''}`}
                                  disabled={!vdsDaemonLog?.available || vdsTracePending}
                                  onClick={() => void setVdsTrace(scope, !on)}
                                >
                                  <span />
                                </button>
                              </span>
                            );
                          })}
                        </dd>
                      </div>
                      )}
                      <div className="debug-entry daemon-log-entry">
                        <dt>Daemon Log</dt>
                        <dd>
                          <textarea
                            ref={vdsDaemonLogRef}
                            readOnly
                            aria-label="vdsd log"
                            value={vdsDaemonLog
                              ? vdsDaemonLog.available
                                ? vdsDaemonLog.lines.join('\n')
                                : vdsDaemonLog.error
                              : 'Loading…'}
                          />
                        </dd>
                      </div>
                    </>
                  )}
                  {!VDS_AVAILABLE && (
                    <>
                  <div>
                    <dt>Audio Log</dt>
                    <dd title={snapshot.diagnostics.audioDebugLogPath ?? undefined}>
                      {snapshot.diagnostics.audioDebugLogPath ?? '--'}
                    </dd>
                  </div>
                  <div>
                    <dt>Dropped</dt>
                    <dd><span className="diagnostic-number">{snapshot.diagnostics.audioDebugDroppedCount}</span></dd>
                  </div>
                  <div>
                    <dt>Trigger Drop</dt>
                    <dd><span className="diagnostic-number">{snapshot.diagnostics.triggerTraceDroppedCount}</span></dd>
                  </div>
                  <div>
                    <dt>Feedback Drop</dt>
                    <dd><span className="diagnostic-number">{snapshot.diagnostics.feedbackTraceDroppedCount}</span></dd>
                  </div>
                  <div className="debug-entry">
                    <dt>Audio Debug</dt>
                    <dd>
                      <textarea readOnly value={audioDebugText} aria-label="Audio debug copy text" />
                    </dd>
                  </div>
                  <div className="debug-entry">
                    <dt>Audio Events</dt>
                    <dd>
                      <textarea readOnly value={audioEventLogText} aria-label="Audio event log text" />
                    </dd>
                  </div>
                  <div className="debug-entry">
                    <dt>Trigger Trace</dt>
                    <dd>
                      <textarea readOnly value={triggerTraceText} aria-label="Trigger trace text" />
                    </dd>
                  </div>
                  <div className="debug-entry">
                    <dt>Feedback Trace</dt>
                    <dd>
                      <textarea readOnly value={feedbackTraceText} aria-label="Feedback trace text" />
                    </dd>
                  </div>
                    </>
                  )}
                </dl>
              </div>
            ) : (
              <div className="device-list">
                <div className="device-row">
                  <span>{VDS_AVAILABLE ? 'Bridge' : 'Firmware'}</span>
                  <strong>
                    {VDS_AVAILABLE
                      ? `vds${vdsVersion ? ` ${vdsVersion}` : ''}`
                      : snapshot.status?.firmwareVersion ?? '--'}
                  </strong>
                </div>
                <div className="device-row">
                  <span>Controller</span>
                  <strong>{controllerConnected ? controllerName(snapshot.status?.controllerType) : '--'}</strong>
                </div>
                {!VDS_AVAILABLE && (
                  <div className="device-row device-control-row">
                    <span>Polling Rate</span>
                    <CustomSelect
                      value={snapshot.settings.pollingRateMode}
                      disabled={!connected || !pollingRateControlSupported || pendingAction !== null}
                      options={POLLING_RATE_OPTIONS}
                      ariaLabel="Polling rate"
                      onChange={setPollingRateMode}
                    />
                  </div>
                )}
                <div className="device-row device-control-row">
                  <span>Host Controller</span>
                  <CustomSelect
                    value={snapshot.settings.hostPersonaMode}
                    disabled={!connected || !hostPersonaControlSupported || pendingAction !== null || personaTransitionActive}
                    options={hostPersonaOptions.length > 0 ? hostPersonaOptions : HOST_PERSONA_OPTIONS.slice(0, 1)}
                    className="host-persona-selector"
                    ariaLabel="Host controller persona"
                    getOptionClassName={(_, mode) => (mode === 'xbox' ? 'host-persona-platform-break' : undefined)}
                    renderValue={(label, mode) => <HostPersonaOption label={label} value={mode} />}
                    renderOption={(label, mode) => <HostPersonaOption label={label} value={mode} />}
                    onChange={setHostPersonaMode}
                  />
                </div>
                <div className="device-row device-status-row">
                  <span>Status</span>
                  <strong className={`health-label ${systemHealthTone}`}>
                    <span className={`dot ${systemHealthTone === 'good' ? statusTone : systemHealthTone}`} />
                    {healthLabel(snapshot)}
                  </strong>
                </div>
              </div>
            )}
          </section>
          {!showDiagnostics && (
            <section className="system-card about-card system-card-full">
              <div className="feature-card-title system-card-heading">
                <span className="feature-icon system-icon icon-wide">
                  <IconInfoCircle size={20} />
                </span>
                <div className="title-copy">
                  <h3>About</h3>
                  <p>OpenDS5 companion</p>
                </div>
              </div>
              <div className="device-list about-list">
                <div className="device-row">
                  <span>Version</span>
                  <strong className="device-mono">{appVersion ?? '--'}</strong>
                </div>
                <div className="device-row device-update-row">
                  <label className="device-update-auto">
                    <input
                      type="checkbox"
                      checked={snapshot.settings.autoUpdateCheckEnabled}
                      onChange={(event) => void runAction('auto-update-check', () => (
                        window.bridge.setAutoUpdateCheckEnabled(event.target.checked)
                      ))}
                    />
                    <span>Check for updates automatically</span>
                  </label>
                  <div className="device-update-control">
                    <span className="device-update-status" aria-live="polite">
                      {manualUpdateCheck === 'checking'
                        ? 'Checking…'
                        : manualUpdateCheck === 'current'
                          ? "You're up to date"
                          : manualUpdateCheck === 'failed'
                            ? "Couldn't reach GitHub"
                            : manualUpdateCheck === 'found' && 'version' in updateState
                              ? `${updateState.version} is available`
                              : ''}
                    </span>
                    <button
                      type="button"
                      className="secondary-action device-update-button"
                      disabled={manualUpdateCheck === 'checking'}
                      onClick={checkForUpdatesNow}
                    >
                      Check now
                    </button>
                  </div>
                </div>
                <div className="device-row">
                  <span>Config file</span>
                  <strong className="device-mono" title={settingsPath ?? undefined}>{settingsPath ?? '--'}</strong>
                </div>
                <div className="device-row device-update-row">
                  <span>Settings backup</span>
                  <div className="device-update-control">
                    <span className="device-update-status" aria-live="polite">{backupStatus}</span>
                    <button
                      type="button"
                      className="secondary-action device-update-button"
                      disabled={backupBusy}
                      title="Save your settings, trigger profiles and game artwork to one file"
                      onClick={() => void runBackupAction('backup')}
                    >
                      Back Up…
                    </button>
                    <button
                      type="button"
                      className="secondary-action device-update-button"
                      disabled={backupBusy}
                      title="Replace your settings with a backup; OpenDS5 restarts"
                      onClick={() => void runBackupAction('restore')}
                    >
                      Restore…
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
        <section className="feature-help-panel system-profile-panel" aria-label="System profiles and tips">
          <div className="system-profile-strip">
            <ProfileSaveStatus />
            <div className="remapping-profile-actions">
              <button
                type="button"
                disabled={selectedControllerProfileIsDefault || selectedControllerProfileIsGameOwned || pendingAction !== null}
                onClick={renameControllerProfile}
              >
                <Pencil size={15} />
                Rename Profile
              </button>
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={saveControllerProfile}
              >
                <Save size={15} />
                Save New Profile
              </button>
              <button
                type="button"
                disabled={!canDeleteControllerProfile || pendingAction !== null}
                onClick={deleteControllerProfile}
              >
                <Trash2 size={15} />
                Delete Profile
              </button>
            </div>
          </div>
          <SystemProfileSummary
            settings={controllerProfileSettingsFromSnapshot(snapshot)}
            powerSavingActive={controllerPowerSavingActive}
          />
        </section>
    </div>
  );
}
