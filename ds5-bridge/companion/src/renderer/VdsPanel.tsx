import { useCallback, useEffect, useState } from 'react';
import { usePageVisible } from './usePageVisible';
import {
  IconBluetooth,
  IconDeviceGamepad2,
  IconPlugConnected,
  IconPlugConnectedX,
  IconRefresh
} from '@tabler/icons-react';
import type { VdsBluetoothMode, VdsController, VdsStatus } from '../shared/vds';

const POLL_INTERVAL_MS = 2000;
const IDLE_OPTIONS: Array<[label: string, seconds: number]> = [
  ['1 min', 60],
  ['2 min', 120],
  ['5 min', 300],
  ['10 min', 600],
  ['30 min', 1800]
];

function controllerState(controller: VdsController, normalMode: boolean): string {
  if (controller.connected) {
    return `Bridged on ${controller.path || 'virtual port'}`;
  }
  if (controller.online) {
    return normalMode ? 'Connected to system Bluetooth' : 'Connected to system Bluetooth (not bridged)';
  }
  if (controller.registered) {
    return normalMode ? 'Attached; waiting for OpenDS5 mode' : 'Attached; press PS to connect';
  }
  return controller.paired ? 'Paired, not attached' : 'Not paired';
}

export function VdsPanel({ active }: { active: boolean }) {
  const [status, setStatus] = useState<VdsStatus | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setStatus(await window.vds.getStatus());
    } catch (error) {
      setStatus({
        available: false,
        error: error instanceof Error ? error.message : String(error),
        bluetooth: null,
        controllers: []
      });
    }
  }, []);

  const pageVisible = usePageVisible();
  useEffect(() => {
    if (!active || !pageVisible) {
      return undefined;
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active, pageVisible, refresh]);

  const run = async (key: string, action: () => Promise<VdsStatus>) => {
    setPending(key);
    setActionError('');
    try {
      setStatus(await action());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(null);
    }
  };

  const bluetooth = status?.bluetooth ?? null;
  const normalMode = bluetooth?.mode === 'normal';
  const busy = pending !== null || bluetooth?.switching === true;
  const setMode = (mode: VdsBluetoothMode) => void run(`mode-${mode}`, () => window.vds.setBluetoothMode(mode));
  const setAuto = (enabled: boolean, idleSeconds: number) => void run(
    'auto',
    () => window.vds.setBluetoothAuto(enabled, idleSeconds)
  );

  // Bluetooth modes switch BlueZ's input plugin; Windows only attaches.
  const bluetoothModes = window.vds.platform === 'linux';
  let modeDescription = 'Checking vdsd…';
  if (status?.accessHint) {
    modeDescription = status.accessHint;
  } else if (status && !status.available) {
    modeDescription = `vdsd is not reachable: ${status.error}`;
  } else if (status && !bluetooth) {
    modeDescription = 'This vdsd does not support Bluetooth mode control. Install the updated vdsd.';
  } else if (bluetooth?.switching) {
    modeDescription = 'Switching Bluetooth mode… Bluetooth devices reconnect in a few seconds.';
  } else if (bluetooth) {
    modeDescription = normalMode
      ? 'Normal: classic Bluetooth keyboards, mice and controllers work. Controllers are not bridged.'
      : bluetooth.listening
        ? 'OpenDS5: attached controllers are bridged as virtual USB controllers. Bluetooth LE mice and keyboards keep working.'
        : 'OpenDS5: waiting to take over the controller Bluetooth channels…';
  }

  return (
    <div
      className={`control-page system-page vds-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-vds"
      aria-labelledby="control-tab-vds"
      aria-hidden={!active}
    >
      <div className="feature-heading system-heading">
        <div>
          <h2>Bluetooth</h2>
          <p>{bluetoothModes
            ? 'Control the vds controller bridge and system Bluetooth.'
            : 'Attach paired controllers to the vds controller bridge.'}</p>
        </div>
        <div className="profile-controls">
          <button className="heading-action" type="button" disabled={pending !== null} onClick={() => void refresh()}>
            <IconRefresh size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="feature-card-grid">
        {bluetoothModes && (
          <section className="system-card">
            <div className="feature-card-title system-card-heading">
              <span className="feature-icon system-icon icon-wide"><IconBluetooth size={20} /></span>
              <div className="title-copy">
                <h3>Bluetooth Mode</h3>
                <p>{modeDescription}</p>
              </div>
            </div>
            <div className="system-fields">
              <div className="modifier-block">
                <div className="modifier-grid" aria-label="Bluetooth mode">
                  <button
                    type="button"
                    className={bluetooth && !normalMode ? 'active' : ''}
                    aria-pressed={Boolean(bluetooth) && !normalMode}
                    disabled={!bluetooth || busy}
                    onClick={() => normalMode && setMode('vds')}
                  >
                    <IconDeviceGamepad2 size={16} />
                    OpenDS5
                  </button>
                  <button
                    type="button"
                    className={normalMode ? 'active' : ''}
                    aria-pressed={normalMode}
                    disabled={!bluetooth || busy}
                    onClick={() => !normalMode && setMode('normal')}
                  >
                    <IconBluetooth size={16} />
                    Normal
                  </button>
                </div>
              </div>
              <div className="select-row">
                <span>Auto switch</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bluetooth?.auto ?? false}
                  aria-label="Automatically switch Bluetooth mode"
                  className={`switch ${bluetooth?.auto ? 'on' : ''}`}
                  disabled={!bluetooth || pending !== null}
                  onClick={() => bluetooth && setAuto(!bluetooth.auto, bluetooth.idleSeconds)}
                >
                  <span />
                </button>
              </div>
              {bluetooth?.auto && (
                <>
                  <p className="vds-hint">
                    Switches to Normal after no controller has been connected for:
                  </p>
                  <div className="modifier-block">
                    <div className="modifier-grid vds-idle-grid" aria-label="Idle time before switching to normal mode">
                      {IDLE_OPTIONS.map(([label, seconds]) => (
                        <button
                          key={seconds}
                          type="button"
                          className={bluetooth.idleSeconds === seconds ? 'active' : ''}
                          disabled={pending !== null}
                          onClick={() => setAuto(true, seconds)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="vds-hint">
                    In Normal mode, turning on an attached DualSense switches back to OpenDS5. Bluetooth restarts,
                    so press PS once more to connect it through OpenDS5.
                  </p>
                </>
              )}
              {bluetooth?.lastError && <p className="vds-error">{bluetooth.lastError}</p>}
            </div>
          </section>
        )}

        <section className={`system-card ${bluetoothModes ? '' : 'system-card-full'}`}>
          <div className="feature-card-title system-card-heading">
            <span className="feature-icon system-icon icon-wide"><IconDeviceGamepad2 size={20} /></span>
            <div className="title-copy">
              <h3>Controllers</h3>
              <p>Paired controllers. Attach one to bridge it through OpenDS5.</p>
            </div>
          </div>
          <div className="system-fields">
            {!bluetoothModes && status && (status.accessHint || !status.available) && (
              <p className="vds-error">{status.accessHint ?? `vdsd is not reachable: ${status.error}`}</p>
            )}
            {status?.available && status.controllers.length === 0 && (
              <p className="vds-hint">
                No paired controllers found. Pair the DualSense in your Bluetooth settings first
                (hold Create + PS until the light bar flashes).
              </p>
            )}
            {status?.controllers.map((controller) => (
              <div className="vds-controller-row" key={controller.address}>
                <div className="vds-controller-copy">
                  <strong>{controller.name || 'Controller'}</strong>
                  <span>{controller.address}</span>
                  <span>{controllerState(controller, normalMode)}</span>
                </div>
                {controller.registered ? (
                  <button
                    type="button"
                    className="heading-action"
                    disabled={pending !== null}
                    onClick={() => void run(`detach-${controller.address}`, () => window.vds.detach(controller.address))}
                  >
                    <IconPlugConnectedX size={18} />
                    Detach
                  </button>
                ) : (
                  <button
                    type="button"
                    className="heading-action"
                    disabled={pending !== null}
                    onClick={() => void run(`attach-${controller.address}`, () => window.vds.attach(controller.address))}
                  >
                    <IconPlugConnected size={18} />
                    Attach
                  </button>
                )}
              </div>
            ))}
            {actionError && <p className="vds-error">{actionError}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
