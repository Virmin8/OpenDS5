import {
  IconBell as Bell,
  IconChevronLeft as ChevronLeft,
  IconBooks,
  IconBrandGithub,
  IconFolderOpen,
  IconPhoto,
  IconReplace,
  IconTargetArrow,
  IconTool,
  IconMinus as Minus,
  IconPencil as Pencil,
  IconPlus as Plus,
  IconRefresh as RefreshCcw,
  IconDeviceFloppy as Save,
  IconSearch as SearchIcon,
  IconSettings as SettingsIcon,
  IconTrash as Trash2,
  IconX as X
} from '@tabler/icons-react';
import controllerImage from '../../../assets/controllers/dualsense-edge-front.svg';
import { MAX_CHORD_FUNCTION_NAME_LENGTH } from '../shared/protocol';
import {
  CONTROL_TABS,
  HOST_PERSONA_FULL_LABELS,
  IDLE_DISCONNECT_TIMEOUT_OPTIONS,
  OPENDS5_REPOSITORY_URL,
  saveStartupTutorialCompleted,
  SIGNAL_STRENGTH_AVAILABLE,
  STARTUP_PROFILE_LAST_USED,
  SYSTEM_UNINSTALL_AVAILABLE,
  TOUCHPAD_MOUSE_AVAILABLE,
  UI_SCALE_OPTIONS,
  UPSTREAM_OPENDS5_VERSION,
  VDS_AVAILABLE,
  VDS_LINUX
} from './app/common';
import {
  CustomSelect,
  DpadShortcutGlyphs,
  HostPersonaBrandIcon,
  StartupScreen,
  StartupTutorial,
  ThemeOption,
  TurnOffShortcutGlyphs
} from './app/components';
import {
  GAME_LAUNCHERS_LABEL,
  GAME_SOURCE_LABELS,
  gameProfileTitle,
  gameTileArtClass,
  gameTileMonogram
} from './app/games';
import { mergeDetectedProcessName, triggerProfileHasEffects } from './app/triggers';
import { useAppState } from './app/useAppState';
import { profileVariantLabel } from './library-entry';
import { AudioTab } from './tabs/AudioTab';
import { ChordsTab } from './tabs/ChordsTab';
import { GameProfileTab } from './tabs/GameProfileTab';
import { HapticsTab } from './tabs/HapticsTab';
import { LightingTab } from './tabs/LightingTab';
import { OverviewTab } from './tabs/OverviewTab';
import { RemappingTab } from './tabs/RemappingTab';
import { SystemTab } from './tabs/SystemTab';
import { TriggerProfilesTab } from './tabs/TriggerProfilesTab';
import { TriggersTab } from './tabs/TriggersTab';
import { UI_THEME_OPTIONS } from './ui-themes';
import { UpdateToast } from './UpdateToast';
import { VdsPanel } from './VdsPanel';

export function App() {
  const app = useAppState();
  const {
    activeControlTab, activeTheme, anyModalOpen, applyGameArtworkChoice, appVersion, batteryCharging,
    batteryChargingSegment, batteryCritical, batteryLevelTone, batterySegmentCount, beginWindowDrag,
    browseGameCreateExecutable, browseGameExecutableForEditor, chargeCompleteToastEnabled,
    chordFunctionDialog, chordFunctionDialogFunction, chordFunctionNameDraft,
    closeChordFunctionDialog, closeControllerProfileDialog, closeDeviceCleanupConfirm,
    closeRemapProfileDialog, confirmDeleteGameProfile, confirmDeleteTriggerProfile,
    confirmResetTriggerProfile, connected, controllerConnected, controllerControlsAvailable,
    controllerProfileDialogMode, controllerProfileNameDraft, controllerProfileOptions,
    controllerToastEnabled, detectGameCreateProcesses, detectRunningGameForEditor,
    deviceCleanupConfirmVisible, deviceCleanupError, deviceCleanupMessage, gameArtwork,
    gameArtworkBusy, gameArtworkDialogFor, gameArtworkError, gameArtworkQuery, gameArtworkResults,
    gameCreateBusy, gameCreateCandidates, gameCreateDetectLoading, gameCreateLinkedProfileId,
    gameCreateName, gameCreateOpen, gameCreateProcessesInput, gameDeleteConfirm,
    gameDetectCandidates, gameDetectLoading, gameLibraryFilter, gameProcessDetectOpen,
    gameProcessDetectRef, gameProcessEditor, gameProcessEditorInput, gameProcessEditorSaving,
    gameProfileLinkOptions, gameSettingsScope, installedCandidateTicks, installedGames,
    installedGamesLoading, installedLibraryFiles, installTriggerProfileFromLibrary,
    loadInstalledGames, lowBatteryToastEnabled, notificationFocusTarget, notificationsEnabled,
    notificationsRef, openGameProfileEntry, overviewHostPersonaMode, overviewSignalTone,
    pendingAction, personaTransitionActive, pickDetectedGameProcessForEditor, pickInstalledGame,
    remapProfileDialogMode, remapProfileNameDraft, removeGameArtworkChoice, runAction,
    runSystemUninstall, runWindowsDeviceCleanup, saveGameProcessNames, searchGameArtworkDialog,
    selectControllerProfile, selectControlTab, selectedControllerProfile,
    selectedControllerProfileId, selectedInstalledGame, selectedRemapProfile,
    setChordFunctionNameDraft, setControllerProfileNameDraft, setGameArtworkDialogFor,
    setGameArtworkQuery, setGameCreateLinkedProfileId, setGameCreateName, setGameCreateOpen,
    setGameCreateProcessesInput, setGameDeleteConfirm, setGameLibraryFilter, setGameProcessEditor,
    setGameProcessEditorInput, setGameSettingsScope, setInstalledCandidateTicks,
    setRemapProfileNameDraft, setShowBridgeSettings, setShowNotificationsMenu,
    setStartupTutorialFeatureActive, setStartupTutorialStep, setSteamGridDbKeyDraft,
    settingsFocusTarget, setTriggerProfileDeleteConfirm, setTriggerProfileLibraryOpen,
    setTriggerProfileLibraryQuery, setTriggerProfileResetConfirm, setUninstallDialog, setUpdateState,
    showBridgeSettings, showNotificationsMenu, sidebarBatteryLabel, sidebarDeviceStatus,
    sidebarDeviceTitle, sidebarDeviceTone, sidebarSignalBars, sidebarSignalLabel,
    sleepControllerSupported, snapshot, startupTutorialFeatureActive, startupTutorialOpen,
    startupTutorialStep, startupVisible, statusTone, steamGridDbKeyDraft, submitChordFunctionDialog,
    submitControllerProfileDialog, submitGameCreate, submitRemapProfileDialog, testNotifications,
    toggleChargeCompleteNotifications, toggleControllerNotifications, toggleLowBatteryNotifications,
    triggerProfileDeleteConfirm, triggerProfileLibraryCatalog, triggerProfileLibraryInstallErrors,
    triggerProfileLibraryInstalling, triggerProfileLibraryLoading, triggerProfileLibraryOpen,
    triggerProfileLibraryQuery, triggerProfileLibraryRows, triggerProfileResetConfirm,
    triggerProfileResetting, triggerProfiles, uninstallDialog, updateState,
    usbSuspendDisconnectSupported, userControllerProfiles, windowDragging
  } = app;


  if (!snapshot || startupVisible) {
    return (
      <div className="shell loading" data-theme={activeTheme}>
        <StartupScreen ready={Boolean(snapshot)} />
      </div>
    );
  }

  return (
    <div
      className={[
        'shell',
        windowDragging ? 'window-dragging' : '',
        controllerControlsAvailable ? '' : 'controller-unavailable'
      ].filter(Boolean).join(' ')}
      data-theme={activeTheme}
    >
      <div className="window-resize-edge" />
      <div
        className="window-bar"
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('.bridge-tools') || target.closest('.window-actions')) {
            return;
          }
          setShowBridgeSettings(false);
          setShowNotificationsMenu(false);
          if (event.button === 0) {
            beginWindowDrag();
          }
        }}
      >
        <span className="bridge-wordmark" aria-label="OpenDS5">
          <span className="bridge-wordmark-ds">Open</span>
          <span className="bridge-wordmark-name">DS5</span>
        </span>
        <div className="topbar-right">
          <div className="bridge-tools">
            <div className="notifications-control" ref={notificationsRef}>
              <button
                className={`topbar-tool notification-tool ${showNotificationsMenu ? 'active' : ''} ${notificationsEnabled ? 'armed' : ''}`}
                type="button"
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={showNotificationsMenu}
                onClick={() => setShowNotificationsMenu((value) => !value)}
              >
                <Bell size={18} />
              </button>
              {showNotificationsMenu && (
                <div className="settings-menu notifications-menu" role="menu" aria-label="Notifications">
                  <div className="settings-menu-heading">
                    <Bell size={16} />
                    <span>Notifications</span>
                  </div>
                  <div className={`settings-menu-row ${notificationFocusTarget === 'controller-status' || notificationFocusTarget === 'all' ? 'settings-menu-row-highlight' : ''}`}>
                    <div>
                      <strong>Controller Status</strong>
                      <span>Toast when the controller connects or disconnects</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={controllerToastEnabled}
                      className={`switch ${controllerToastEnabled ? 'on' : ''}`}
                      disabled={pendingAction !== null}
                      onClick={toggleControllerNotifications}
                    >
                      <span />
                    </button>
                  </div>
                  <div className={`settings-menu-row ${notificationFocusTarget === 'low-battery' || notificationFocusTarget === 'all' ? 'settings-menu-row-highlight' : ''}`}>
                    <div>
                      <strong>Low Battery</strong>
                      <span>Toast when battery reaches 20% or below</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={lowBatteryToastEnabled}
                      className={`switch ${lowBatteryToastEnabled ? 'on' : ''}`}
                      disabled={pendingAction !== null}
                      onClick={toggleLowBatteryNotifications}
                    >
                      <span />
                    </button>
                  </div>
                  <div className={`settings-menu-row ${notificationFocusTarget === 'charge-complete' || notificationFocusTarget === 'all' ? 'settings-menu-row-highlight' : ''}`}>
                    <div>
                      <strong>Fully Charged</strong>
                      <span>Toast when the controller finishes charging</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={chargeCompleteToastEnabled}
                      className={`switch ${chargeCompleteToastEnabled ? 'on' : ''}`}
                      disabled={pendingAction !== null}
                      onClick={toggleChargeCompleteNotifications}
                    >
                      <span />
                    </button>
                  </div>
                  <div className="settings-menu-action">
                    <button
                      className="secondary-action"
                      type="button"
                      disabled={pendingAction !== null}
                      onClick={testNotifications}
                    >
                      Test Toast
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="bridge-tool-divider" aria-hidden="true" />
          </div>
          <div className="window-actions">
            <button type="button" title="Minimize" onClick={() => void window.bridge.minimizeWindow()}>
              <Minus size={16} />
            </button>
            <button type="button" title="Hide to tray" onClick={() => void window.bridge.hideWindow()}>
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <main className="app-content">
        <section className={`hero-card status-${statusTone}`}>
          <div className="sidebar-section-label">Device</div>
          <div className={`hero-main device-status-${sidebarDeviceTone}`}>
            <img className="controller-art" src={controllerImage} alt="" />
            <div className="status-copy">
              <div className="connection-row">
                <strong>{sidebarDeviceTitle}</strong>
              </div>
              <div className="bridge-state compact-device-status">
                <span>{sidebarDeviceStatus}</span>
              </div>
              <div className="battery-row compact-battery-row">
                {connected && controllerConnected && (
                  <span
                    className={`battery-icon ${batteryLevelTone} ${batteryCharging ? 'charging' : ''}`}
                    aria-hidden="true"
                  >
                    {[0, 1, 2].map((segment) => (
                      <span
                        key={segment}
                        className={[
                          segment < batterySegmentCount ? 'active' : '',
                          segment === batteryChargingSegment ? 'charging-segment' : '',
                          segment === 0 && batteryCritical ? 'critical-segment' : ''
                        ].filter(Boolean).join(' ')}
                      />
                    ))}
                  </span>
                )}
                <span>{sidebarBatteryLabel}</span>
              </div>
              {SIGNAL_STRENGTH_AVAILABLE && connected && controllerConnected && (
                <div className="battery-row compact-battery-row compact-signal-row">
                  <span className={`signal-icon ${overviewSignalTone}`} aria-hidden="true">
                    {[0, 1, 2, 3].map((bar) => (
                      <span key={bar} className={bar < sidebarSignalBars ? 'active' : ''} />
                    ))}
                  </span>
                  <span title="Bluetooth link RSSI">{sidebarSignalLabel}</span>
                </div>
              )}
              {connected && controllerConnected && (
                <span
                  className={`host-persona-chip persona-${overviewHostPersonaMode}`}
                  title={`The PC sees this controller as a ${HOST_PERSONA_FULL_LABELS[overviewHostPersonaMode]}`}
                >
                  <HostPersonaBrandIcon mode={overviewHostPersonaMode} size={12} />
                  {personaTransitionActive ? 'Switching…' : `As ${HOST_PERSONA_FULL_LABELS[overviewHostPersonaMode]}`}
                </span>
              )}
            </div>
          </div>
          <div className="sidebar-profile-switch">
            <span className="sidebar-profile-label">Profile</span>
            <CustomSelect
              value={selectedControllerProfileId}
              disabled={!connected || pendingAction !== null}
              options={controllerProfileOptions}
              className="sidebar-profile-select"
              floatingMenu
              floatingMenuMinWidth={200}
              ariaLabel="Controller profile"
              onChange={selectControllerProfile}
            />
          </div>
          <div className="sidebar-section-label">Controls</div>
          <div className="sidebar-controls">
            <div className="control-tabs" role="tablist" aria-label="Controls">
              {CONTROL_TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  id={`control-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeControlTab === id}
                  aria-controls={`control-panel-${id}`}
                  className={activeControlTab === id ? 'active' : ''}
                  onClick={() => selectControlTab(id)}
                >
                  <Icon size={18} stroke={2} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="sidebar-actions">
            <div className="header-settings">
              <button
                className={`sidebar-action-button ${showBridgeSettings ? 'active' : ''}`}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={showBridgeSettings}
                onClick={() => setShowBridgeSettings((value) => !value)}
              >
                <SettingsIcon size={18} />
                <span>Settings</span>
              </button>
              <button
                className={`sidebar-action-button ${activeControlTab === 'chords' ? 'active' : ''}`}
                id="control-tab-chords"
                type="button"
                aria-controls="control-panel-chords"
                aria-selected={activeControlTab === 'chords'}
                onClick={() => selectControlTab('chords')}
              >
                <IconReplace size={18} />
                <span>Chords</span>
              </button>
            </div>
          </div>
        </section>

      <section className={`control-panel flat-control-panel ${openGameProfileEntry && activeControlTab !== 'game-profile' ? 'game-scope-active' : ''}`}>
        {openGameProfileEntry && activeControlTab !== 'game-profile' && (
          <div className="game-scope-banner" role="region" aria-label="Game settings scope">
            <div className="game-scope-banner-heading">
              <strong>{gameProfileTitle(openGameProfileEntry)}</strong>
              <span>
                {gameSettingsScope === 'game'
                  ? `Saving to ${gameProfileTitle(openGameProfileEntry)}'s game settings`
                  : 'Saving to your global settings'}
              </span>
            </div>
            <div className="game-scope-toggle" role="group" aria-label="Settings scope">
              <button
                type="button"
                className={gameSettingsScope === 'game' ? 'active' : ''}
                aria-pressed={gameSettingsScope === 'game'}
                onClick={() => void setGameSettingsScope('game')}
              >
                Game Settings
              </button>
              <button
                type="button"
                className={gameSettingsScope === 'global' ? 'active' : ''}
                aria-pressed={gameSettingsScope === 'global'}
                onClick={() => void setGameSettingsScope('global')}
              >
                Global Settings
              </button>
            </div>
            <button
              className="nav-back"
              type="button"
              onClick={() => selectControlTab('game-profile')}
            >
              <span className="nav-back-arrow" aria-hidden="true"><ChevronLeft size={22} /></span>
              <span className="nav-back-lines">
                <i>Back to</i>
                <b>Game Profile</b>
              </span>
            </button>
          </div>
        )}
        <div className="control-pages">
          <GameProfileTab app={app} />
          <OverviewTab app={app} snapshot={snapshot} />

          <HapticsTab app={app} snapshot={snapshot} />

          <AudioTab app={app} snapshot={snapshot} />

          <TriggersTab app={app} snapshot={snapshot} />

          <TriggerProfilesTab app={app} />

          <LightingTab app={app} snapshot={snapshot} />

          <RemappingTab app={app} />

          <ChordsTab app={app} />

          {VDS_AVAILABLE && <VdsPanel active={activeControlTab === 'vds'} />}

          <SystemTab app={app} snapshot={snapshot} />
        </div>
      </section>
      </main>

      {startupTutorialStep !== 'done' && (
        <StartupTutorial
          featureExampleActive={startupTutorialFeatureActive}
          onFeatureExampleToggle={() => setStartupTutorialFeatureActive((active) => !active)}
          onFinish={() => {
            saveStartupTutorialCompleted();
            setStartupTutorialStep('done');
          }}
        />
      )}

      {deviceCleanupConfirmVisible && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={closeDeviceCleanupConfirm}
        >
          <form
            className="settings-menu bridge-settings-modal device-cleanup-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Emergency device repair"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void runWindowsDeviceCleanup();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <IconTool size={16} />
                <span>Emergency Device Repair</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close emergency device repair dialog"
                disabled={pendingAction === 'device-cleanup'}
                onClick={closeDeviceCleanupConfirm}
              >
                <X size={16} />
              </button>
            </div>
            <div className="device-cleanup-copy">
              <p>
                Only run this if you are running into persistent odd controller, rumble, haptics, audio, or Windows device issues.
              </p>
              <p>
                Disconnect the controller from the bridge before running this repair.
              </p>
              <ul>
                <li>Removes stale Windows DualSense, DualSense Edge, DS5 Bridge USB/HID, audio endpoint, and Bluetooth pairing records.</li>
                <li>Controller identity based profiles in Steam, emulators, or other tools may need to be assigned again.</li>
                <li>DualSense controllers paired directly to Windows over Bluetooth may need to be paired again.</li>
              </ul>
              {controllerConnected && (
                <div className="device-cleanup-alert bad">
                  Controller is still connected to the bridge.
                </div>
              )}
              {deviceCleanupError && (
                <div className="device-cleanup-alert bad">
                  {deviceCleanupError}
                </div>
              )}
              {deviceCleanupMessage && (
                <div className="device-cleanup-alert good">
                  {deviceCleanupMessage}
                </div>
              )}
            </div>
            <div className="remap-profile-dialog-actions">
              <button
                type="button"
                className="secondary-action"
                disabled={pendingAction === 'device-cleanup'}
                onClick={closeDeviceCleanupConfirm}
              >
                Close
              </button>
              <button
                type="submit"
                className="primary-action danger"
                disabled={pendingAction !== null || controllerConnected}
              >
                {pendingAction === 'device-cleanup' ? 'Running...' : 'Run Repair'}
              </button>
            </div>
          </form>
        </div>
      )}

      {chordFunctionDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={closeChordFunctionDialog}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chord function"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              submitChordFunctionDialog();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                {chordFunctionDialog.mode === 'delete' ? <Trash2 size={16} /> : <Pencil size={16} />}
                <span>
                  {chordFunctionDialog.mode === 'delete' ? 'Delete Function' : 'Rename Function'}
                </span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close chord function dialog"
                onClick={closeChordFunctionDialog}
              >
                <X size={16} />
              </button>
            </div>
            {chordFunctionDialog.mode === 'delete' ? (
              <p className="remap-profile-dialog-copy">
                Delete {chordFunctionDialogFunction?.name ?? 'this function'}?
              </p>
            ) : (
              <label className="remap-profile-name-field">
                <span>Function Name</span>
                <input
                  autoFocus
                  value={chordFunctionNameDraft}
                  maxLength={MAX_CHORD_FUNCTION_NAME_LENGTH}
                  onChange={(event) => setChordFunctionNameDraft(event.target.value)}
                />
              </label>
            )}
            <div className="remap-profile-dialog-actions">
              <button type="button" className="secondary-action" onClick={closeChordFunctionDialog}>
                Cancel
              </button>
              <button
                type="submit"
                className={`primary-action ${chordFunctionDialog.mode === 'delete' ? 'danger' : ''}`}
                disabled={pendingAction !== null || (chordFunctionDialog.mode !== 'delete' && chordFunctionNameDraft.trim().length === 0)}
              >
                {chordFunctionDialog.mode === 'delete' ? 'Delete' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {triggerProfileDeleteConfirm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setTriggerProfileDeleteConfirm(null)}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete trigger profile"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void confirmDeleteTriggerProfile();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <Trash2 size={16} />
                <span>Delete Trigger Profile</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close delete trigger profile dialog"
                onClick={() => setTriggerProfileDeleteConfirm(null)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="remap-profile-dialog-copy">
              Delete {triggerProfileDeleteConfirm.name}?
            </p>
            <div className="remap-profile-dialog-actions">
              <button type="button" className="secondary-action" onClick={() => setTriggerProfileDeleteConfirm(null)}>
                Cancel
              </button>
              <button type="submit" className="primary-action danger">
                Delete
              </button>
            </div>
          </form>
        </div>
      )}

      {gameCreateOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setGameCreateOpen(false)}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal game-create-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add game"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void submitGameCreate();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <Plus size={16} />
                <span>Add Game</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close add game dialog"
                onClick={() => setGameCreateOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="game-create-library">
              <div className="game-create-library-head">
                <span>From your libraries</span>
                <input
                  className="game-create-library-filter"
                  type="search"
                  value={gameLibraryFilter}
                  placeholder="Search games"
                  aria-label="Search installed games"
                  onChange={(event) => setGameLibraryFilter(event.target.value)}
                />
                <button
                  type="button"
                  className="secondary-action"
                  disabled={installedGamesLoading}
                  onClick={() => void loadInstalledGames(true)}
                >
                  {installedGamesLoading ? 'Scanning…' : 'Rescan'}
                </button>
              </div>
              {installedGamesLoading && installedGames === null ? (
                <p className="game-create-library-empty">Looking for {GAME_LAUNCHERS_LABEL} games…</p>
              ) : installedGames === null || installedGames.games.length === 0 ? (
                <p className="game-create-library-empty">
                  No new {GAME_LAUNCHERS_LABEL} games found — every installed game may already
                  have a profile, or the launchers aren't installed. Use Browse for .exe to add one by hand.
                </p>
              ) : (
                <div className="game-create-library-grid" role="listbox" aria-label="Installed games">
                  {installedGames.games
                    .filter((game) => game.name.toLowerCase().includes(gameLibraryFilter.trim().toLowerCase()))
                    .map((game) => (
                    <button
                      key={`${game.source}:${game.sourceId}`}
                      type="button"
                      role="option"
                      aria-selected={selectedInstalledGame?.sourceId === game.sourceId}
                      className={`game-create-library-tile ${selectedInstalledGame?.sourceId === game.sourceId ? 'selected' : ''}`}
                      onClick={() => pickInstalledGame(game)}
                    >
                      <span
                        className={`game-create-library-art ${game.cover ? 'has-image' : gameTileArtClass(game.sourceId)}`}
                        style={game.cover ? { backgroundImage: `url("${game.cover}")` } : undefined}
                        aria-hidden="true"
                      >
                        {!game.cover && <span className="game-tile-monogram">{gameTileMonogram(game.name)}</span>}
                      </span>
                      <span className="game-create-library-name">{game.name}</span>
                      <span className={`game-create-library-badge ${game.source}`}>
                        {GAME_SOURCE_LABELS[game.source]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {installedGames !== null && installedGames.errors.length > 0 && (
                <p className="game-create-library-errors">{installedGames.errors.join(' · ')}</p>
              )}
            </div>
            <label className="remap-profile-name-field">
              <span>Game Name</span>
              <input
                autoFocus
                value={gameCreateName}
                maxLength={100}
                placeholder="Cyberpunk 2077"
                onChange={(event) => setGameCreateName(event.target.value)}
              />
            </label>
            {selectedInstalledGame !== null && selectedInstalledGame.processCandidates.length > 0 && (
              <div className="game-create-candidate-ticks" role="group" aria-label="Detected executables">
                <span className="game-create-candidate-ticks-label">
                  Found in {selectedInstalledGame.name}'s folder — untick anything that isn't the game:
                </span>
                {selectedInstalledGame.processCandidates.map((candidate) => (
                  <label key={candidate} className="game-create-candidate-tick">
                    <input
                      type="checkbox"
                      checked={installedCandidateTicks[candidate] ?? false}
                      onChange={(event) => setInstalledCandidateTicks((ticks) => ({
                        ...ticks,
                        [candidate]: event.target.checked
                      }))}
                    />
                    <span>{candidate}</span>
                  </label>
                ))}
              </div>
            )}
            <label className="remap-profile-name-field">
              <span>{selectedInstalledGame ? 'Extra Process Names (optional)' : 'Process Names'}</span>
              <input
                value={gameCreateProcessesInput}
                placeholder="cyberpunk2077.exe"
                onChange={(event) => setGameCreateProcessesInput(event.target.value)}
              />
            </label>
            <div className="game-create-detect">
              <div className="game-create-detect-actions">
                <button
                  type="button"
                  className="secondary-action"
                  disabled={gameCreateDetectLoading}
                  onClick={() => void detectGameCreateProcesses()}
                >
                  <SearchIcon size={14} />
                  {gameCreateDetectLoading ? 'Scanning…' : 'Detect Running Game'}
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => void browseGameCreateExecutable()}
                >
                  <IconFolderOpen size={14} />
                  Browse for .exe…
                </button>
              </div>
              {gameCreateCandidates !== null && (
                gameCreateCandidates.length === 0 ? (
                  <p className="game-create-detect-empty">No game processes found — is the game running?</p>
                ) : (
                  <div className="game-create-candidates">
                    {gameCreateCandidates.map((candidate) => (
                      <button
                        key={candidate.name}
                        type="button"
                        className="trigger-lab-chip compact"
                        onClick={() => setGameCreateProcessesInput((current) => (
                          mergeDetectedProcessName(current, candidate.name)
                        ))}
                      >
                        {candidate.name}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
            <div className="remap-profile-name-field game-create-profile-field">
              <span>Profile When Playing</span>
              <CustomSelect
                value={gameCreateLinkedProfileId}
                options={gameProfileLinkOptions}
                floatingMenu
                ariaLabel="Profile when playing"
                onChange={setGameCreateLinkedProfileId}
              />
            </div>
            <p className="remap-profile-dialog-copy">
              With auto switching on, this profile is selected while the game runs and your
              previous profile comes back when it closes. Games you haven't added keep whatever
              profile is selected.
            </p>
            <div className="remap-profile-dialog-actions">
              <button type="button" className="secondary-action" onClick={() => setGameCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-action"
                disabled={gameCreateBusy || gameCreateName.trim().length === 0}
              >
                {gameCreateBusy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {uninstallDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (uninstallDialog.phase === 'confirm') setUninstallDialog(null);
          }}
        >
          <div
            className="settings-menu bridge-settings-modal remap-profile-modal uninstall-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Uninstall OpenDS5"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <Trash2 size={16} />
                <span>Uninstall OpenDS5</span>
              </div>
              {uninstallDialog.phase !== 'running' && (
                <button
                  className="modal-close-button"
                  type="button"
                  aria-label="Close uninstall dialog"
                  onClick={() => setUninstallDialog(null)}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {uninstallDialog.phase === 'confirm' && (
              <>
                {VDS_LINUX ? (
                  <p className="remap-profile-dialog-copy">
                    This removes everything the installer set up: the vds_hcd kernel module (DKMS),
                    vdsd and vdsctl, the systemd service, udev rules, the WirePlumber config, the
                    vds group, the Bluetooth override (other Bluetooth input devices work again),
                    and the OpenDS5 AppImage, menu entry and autostart entry. You will be asked for
                    your password once.
                  </p>
                ) : (
                  <p className="remap-profile-dialog-copy">
                    This stops and removes the vdsd service and its files in Program Files. USB/IP
                    and HidHide stay installed (remove them from Apps if nothing else uses them),
                    and OpenDS5 itself is removed from Apps. Windows asks for administrator rights once.
                  </p>
                )}
                <label className="uninstall-purge-option">
                  <input
                    type="checkbox"
                    checked={uninstallDialog.purge}
                    onChange={(event) => setUninstallDialog({ ...uninstallDialog, purge: event.target.checked })}
                  />
                  <span>Also remove app settings, profiles and game list</span>
                </label>
                <div className="remap-profile-dialog-actions">
                  <button type="button" className="secondary-action" onClick={() => setUninstallDialog(null)}>
                    Cancel
                  </button>
                  <button type="button" className="primary-action danger" onClick={() => void runSystemUninstall()}>
                    Uninstall
                  </button>
                </div>
              </>
            )}
            {uninstallDialog.phase !== 'confirm' && (
              <>
                <ol className="uninstall-steps">
                  {uninstallDialog.steps.length === 0 && <li className="pending">Waiting for authentication…</li>}
                  {uninstallDialog.steps.map((step, index) => (
                    <li key={step} className={uninstallDialog.statuses[index] ?? 'pending'}>
                      <span className="uninstall-step-mark" aria-hidden="true">
                        {uninstallDialog.statuses[index] === 'ok'
                          ? '✓'
                          : uninstallDialog.statuses[index] === 'fail'
                            ? '!'
                            : uninstallDialog.statuses[index] === 'start' ? '…' : ''}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {uninstallDialog.phase === 'done' && (
                  <>
                    <p className="remap-profile-dialog-copy">
                      {uninstallDialog.exit === 0
                        ? VDS_LINUX
                          ? 'OpenDS5 has been removed. Log out and back in to drop the vds group from your session. Run the AppImage again any time to reinstall.'
                          : 'The vdsd service has been removed. Restart OpenDS5 to set it up again, or remove OpenDS5 from Apps.'
                        : uninstallDialog.exit === 126 || uninstallDialog.exit === 127
                          ? 'Uninstall was cancelled before anything was changed.'
                          : `Some steps failed — see ${VDS_LINUX ? '/var/log/opends5/uninstall.log' : '%ProgramData%\\OpenDS5\\logs\\uninstall.log'}. Everything else was removed.`}
                    </p>
                    <div className="remap-profile-dialog-actions">
                      <button type="button" className="secondary-action" onClick={() => setUninstallDialog(null)}>
                        Close
                      </button>
                      <button type="button" className="primary-action" onClick={() => void window.vds.quitApp()}>
                        Quit OpenDS5
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {gameArtworkDialogFor && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setGameArtworkDialogFor(null)}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal game-artwork-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cover art"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void searchGameArtworkDialog();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <IconPhoto size={16} />
                <span>Cover Art</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close cover art dialog"
                onClick={() => setGameArtworkDialogFor(null)}
              >
                <X size={16} />
              </button>
            </div>
            <label className="remap-profile-name-field">
              <span>SteamGridDB API Key</span>
              <input
                value={steamGridDbKeyDraft ?? snapshot?.settings.steamGridDbApiKey ?? ''}
                placeholder="Paste your API key"
                onChange={(event) => setSteamGridDbKeyDraft(event.target.value)}
              />
            </label>
            <p className="remap-profile-dialog-copy game-artwork-key-hint">
              Covers come from SteamGridDB. Keys are free:{' '}
              <button
                type="button"
                className="game-artwork-key-link"
                onClick={() => void window.bridge.openExternal('https://www.steamgriddb.com/profile/preferences/api')}
              >
                steamgriddb.com → Preferences → API
              </button>
            </p>
            <div className="game-artwork-search-row">
              <input
                className="game-artwork-search-input"
                value={gameArtworkQuery}
                placeholder="Search game title"
                aria-label="Search game title"
                onChange={(event) => setGameArtworkQuery(event.target.value)}
              />
              <button
                type="submit"
                className="primary-action"
                disabled={gameArtworkBusy || gameArtworkQuery.trim().length === 0}
              >
                <SearchIcon size={14} />
                {gameArtworkBusy ? 'Working…' : 'Search'}
              </button>
            </div>
            {gameArtworkError && <p className="game-artwork-error">{gameArtworkError}</p>}
            {gameArtworkResults !== null && gameArtworkResults.length > 0 && (
              <div className="game-artwork-results" role="listbox" aria-label="Search results">
                {gameArtworkResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="game-artwork-result"
                    disabled={gameArtworkBusy}
                    onClick={() => void applyGameArtworkChoice(result)}
                  >
                    <IconPhoto size={14} />
                    <span>{result.name}</span>
                    <span className="game-artwork-result-hint">Use this cover</span>
                  </button>
                ))}
              </div>
            )}
            <div className="remap-profile-dialog-actions">
              {gameArtwork[gameArtworkDialogFor] && (
                <button
                  type="button"
                  className="secondary-action danger"
                  onClick={() => void removeGameArtworkChoice()}
                >
                  Remove Cover
                </button>
              )}
              <button type="button" className="secondary-action" onClick={() => setGameArtworkDialogFor(null)}>
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      {gameProcessEditor && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setGameProcessEditor(null)}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Set game process names"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void saveGameProcessNames();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <IconTargetArrow size={16} />
                <span>Game Path</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close process names dialog"
                onClick={() => setGameProcessEditor(null)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="remap-profile-dialog-copy">
              Set which running executables activate {gameProcessEditor.name}.
            </p>
            <label className="trigger-profiles-process-field">
              <span>Process Names (comma-separated)</span>
              <input
                value={gameProcessEditorInput}
                placeholder="game.exe, other.exe"
                autoFocus
                onChange={(event) => setGameProcessEditorInput(event.target.value)}
              />
            </label>
            <div className="game-detect-anchor game-process-editor-actions" ref={gameProcessDetectRef}>
              <button
                type="button"
                className="secondary-action game-detect-button"
                disabled={gameDetectLoading}
                onClick={() => void detectRunningGameForEditor()}
              >
                <SearchIcon size={14} />
                Detect running game
              </button>
              <button
                type="button"
                className="secondary-action game-detect-button"
                onClick={() => void browseGameExecutableForEditor()}
              >
                <IconFolderOpen size={14} />
                Browse for .exe…
              </button>

              {gameProcessDetectOpen && (
                <div className="game-detect-popover" role="dialog" aria-label="Detected running games">
                  {gameDetectCandidates.length === 0 ? (
                    <p className="game-detect-empty">No game detected — is it running?</p>
                  ) : (
                    <ul className="game-detect-list">
                      {gameDetectCandidates.map((candidate) => (
                        <li key={candidate.name}>
                          <button
                            type="button"
                            className="game-detect-candidate"
                            onClick={() => pickDetectedGameProcessForEditor(candidate.name)}
                          >
                            <span className="game-detect-candidate-name">{candidate.name}</span>
                            {candidate.kind !== 'other' && (
                              <span className="game-detect-candidate-kind">
                                {candidate.kind === 'proton' ? 'Proton' : 'game path'}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="remap-profile-dialog-actions">
              <button type="button" className="secondary-action" onClick={() => setGameProcessEditor(null)}>
                Cancel
              </button>
              <button type="submit" className="primary-action" disabled={gameProcessEditorSaving}>
                {gameProcessEditorSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {gameDeleteConfirm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setGameDeleteConfirm(null)}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete game profile"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void confirmDeleteGameProfile(false);
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <Trash2 size={16} />
                <span>Delete Game Profile</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close delete game profile dialog"
                onClick={() => setGameDeleteConfirm(null)}
              >
                <X size={16} />
              </button>
            </div>
            {(() => {
              const target = triggerProfiles.find((profile) => profile.id === gameDeleteConfirm.id);
              const hasEffects = target ? triggerProfileHasEffects(target) : false;
              return (
                <>
                  <p className="remap-profile-dialog-copy">
                    Delete {gameDeleteConfirm.name}? Its game settings and cover art are removed.
                    Your global settings are not affected.
                  </p>
                  {hasEffects && (
                    <div className="game-delete-triggers-warning" role="alert">
                      <strong>This game has custom trigger effects.</strong>
                      <span>
                        Delete them too, or keep them as a trigger profile in the Trigger
                        Profiles tab (it still applies when the game runs).
                      </span>
                    </div>
                  )}
                  <div className="remap-profile-dialog-actions">
                    <button type="button" className="secondary-action" onClick={() => setGameDeleteConfirm(null)}>
                      Cancel
                    </button>
                    {hasEffects && (
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => void confirmDeleteGameProfile(true)}
                      >
                        Keep Trigger Profile
                      </button>
                    )}
                    <button type="submit" className="primary-action danger">
                      {hasEffects ? 'Delete Everything' : 'Delete'}
                    </button>
                  </div>
                </>
              );
            })()}
          </form>
        </div>
      )}

      {triggerProfileResetConfirm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setTriggerProfileResetConfirm(null)}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Reset trigger profile"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void confirmResetTriggerProfile();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <RefreshCcw size={16} />
                <span>Reset Trigger Profile</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close reset trigger profile dialog"
                onClick={() => setTriggerProfileResetConfirm(null)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="remap-profile-dialog-copy">
              {`Reset ${triggerProfileResetConfirm.name} to its library defaults? Your changes to this profile will be discarded.`}
            </p>
            <div className="remap-profile-dialog-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setTriggerProfileResetConfirm(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-action" disabled={triggerProfileResetting}>
                {triggerProfileResetting ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {remapProfileDialogMode && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={closeRemapProfileDialog}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Button remapping profile"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              submitRemapProfileDialog();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                {remapProfileDialogMode === 'delete' ? <Trash2 size={16} /> : <Save size={16} />}
                <span>
                  {remapProfileDialogMode === 'save'
                    ? 'Save New Profile'
                    : remapProfileDialogMode === 'rename'
                      ? 'Rename Profile'
                      : 'Delete Profile'}
                </span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close profile dialog"
                onClick={closeRemapProfileDialog}
              >
                <X size={16} />
              </button>
            </div>
            {remapProfileDialogMode === 'delete' ? (
              <p className="remap-profile-dialog-copy">
                Delete {selectedRemapProfile?.name ?? 'this profile'}?
              </p>
            ) : (
              <label className="remap-profile-name-field">
                <span>Profile Name</span>
                <input
                  autoFocus
                  value={remapProfileNameDraft}
                  maxLength={48}
                  onChange={(event) => setRemapProfileNameDraft(event.target.value)}
                />
              </label>
            )}
            <div className="remap-profile-dialog-actions">
              <button type="button" className="secondary-action" onClick={closeRemapProfileDialog}>
                Cancel
              </button>
              <button
                type="submit"
                className={`primary-action ${remapProfileDialogMode === 'delete' ? 'danger' : ''}`}
                disabled={pendingAction !== null || (remapProfileDialogMode !== 'delete' && remapProfileNameDraft.trim().length === 0)}
              >
                {remapProfileDialogMode === 'delete' ? 'Delete' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {controllerProfileDialogMode && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={closeControllerProfileDialog}
        >
          <form
            className="settings-menu bridge-settings-modal remap-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="System profile"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              submitControllerProfileDialog();
            }}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                {controllerProfileDialogMode === 'delete' ? <Trash2 size={16} /> : <Save size={16} />}
                <span>
                  {controllerProfileDialogMode === 'save'
                    ? 'Save New Profile'
                    : controllerProfileDialogMode === 'rename'
                      ? 'Rename Profile'
                      : 'Delete Profile'}
                </span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close system profile dialog"
                onClick={closeControllerProfileDialog}
              >
                <X size={16} />
              </button>
            </div>
            {controllerProfileDialogMode === 'delete' ? (
              <p className="remap-profile-dialog-copy">
                Delete {selectedControllerProfile?.name ?? 'this profile'}?
              </p>
            ) : (
              <label className="remap-profile-name-field">
                <span>Profile Name</span>
                <input
                  autoFocus
                  value={controllerProfileNameDraft}
                  maxLength={48}
                  onChange={(event) => setControllerProfileNameDraft(event.target.value)}
                />
              </label>
            )}
            <div className="remap-profile-dialog-actions">
              <button type="button" className="secondary-action" onClick={closeControllerProfileDialog}>
                Cancel
              </button>
              <button
                type="submit"
                className={`primary-action ${controllerProfileDialogMode === 'delete' ? 'danger' : ''}`}
                disabled={pendingAction !== null || (controllerProfileDialogMode !== 'delete' && controllerProfileNameDraft.trim().length === 0)}
              >
                {controllerProfileDialogMode === 'delete' ? 'Delete' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {triggerProfileLibraryOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setTriggerProfileLibraryOpen(false)}
        >
          <div
            className="settings-menu trigger-profiles-library-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Profile library"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-menu-heading trigger-profiles-library-heading">
              <div className="modal-heading-copy">
                <IconBooks size={16} />
                <span>Profile Library</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close profile library"
                onClick={() => setTriggerProfileLibraryOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="trigger-profiles-library-body">
              {triggerProfileLibraryLoading ? (
                <p className="trigger-profiles-library-empty">Loading library…</p>
              ) : !triggerProfileLibraryCatalog ? null : triggerProfileLibraryCatalog.entries.length === 0 ? (
                <div className="trigger-profiles-library-error">
                  <p>
                    {triggerProfileLibraryCatalog.error
                      ? `Couldn't load the profile library — ${triggerProfileLibraryCatalog.error}`
                      : 'The profile library has no profiles yet.'}
                  </p>
                  {triggerProfileLibraryCatalog.error ? (
                    <p>Browse profiles manually at https://github.com/LordVicky/OpenDS5-Profiles</p>
                  ) : null}
                </div>
              ) : (
                <>
                  {triggerProfileLibraryCatalog.fromCache && (
                    <p className="trigger-profiles-library-stale">
                      {`Couldn't refresh — showing cached list from ${new Date(triggerProfileLibraryCatalog.fetchedAtMs).toLocaleString()}`}
                    </p>
                  )}
                  <div className="trigger-profiles-library-search">
                    <SearchIcon size={14} aria-hidden="true" />
                    <input
                      type="search"
                      value={triggerProfileLibraryQuery}
                      onChange={(event) => setTriggerProfileLibraryQuery(event.target.value)}
                      placeholder="Search a game…"
                      aria-label="Search the profile library"
                      autoFocus
                    />
                  </div>
                  {triggerProfileLibraryRows.length === 0 ? (
                    <div className="trigger-profiles-library-none">
                      <strong>{`No profile for “${triggerProfileLibraryQuery.trim()}” yet`}</strong>
                      <p>
                        Nobody has published one, and the game doesn&apos;t drive the triggers itself.
                        You can build one in Trigger Lab.
                      </p>
                    </div>
                  ) : (
                    <ul className="trigger-profiles-library-list">
                      {triggerProfileLibraryRows.map((row) =>
                        row.kind === 'native' ? (
                          <li key={row.key} className="trigger-profiles-library-entry">
                            <div className="trigger-profiles-library-entry-copy">
                              <span className="trigger-profiles-library-entry-title">
                                <strong>{row.game}</strong>
                              </span>
                              <p className="trigger-profiles-library-entry-description">
                                Drives its own triggers. OpenDS5 passes through — nothing to install.
                              </p>
                            </div>
                            <span className="library-pill library-pill-native">Native</span>
                          </li>
                        ) : (
                          <li key={row.key} className="trigger-profiles-library-entry">
                            <div className="trigger-profiles-library-entry-copy">
                              <span className="trigger-profiles-library-entry-title">
                                <strong>{row.entry.game}</strong>
                                <span className="trigger-profiles-library-entry-author">
                                  {[
                                    profileVariantLabel(row.entry.game, row.entry.name),
                                    row.entry.author ? `by ${row.entry.author}` : null,
                                    row.entry.origin
                                      ? `ported from ${row.entry.origin.from}`
                                      : null
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              </span>
                              <p className="trigger-profiles-library-entry-description">
                                {row.entry.description}
                              </p>
                              {row.entry.capabilities ? (
                                <p className="trigger-profiles-library-entry-capabilities">
                                  {row.entry.capabilities}
                                </p>
                              ) : null}
                              {triggerProfileLibraryInstallErrors[row.entry.file] ? (
                                <p className="trigger-profiles-library-entry-error">
                                  {triggerProfileLibraryInstallErrors[row.entry.file]}
                                </p>
                              ) : null}
                            </div>
                            <span
                              className={`library-pill ${
                                row.entry.tier === 'verified'
                                  ? 'library-pill-verified'
                                  : 'library-pill-community'
                              }`}
                            >
                              {row.entry.tier === 'verified' ? 'Verified' : 'Community'}
                            </span>
                            {installedLibraryFiles.has(row.entry.file) ? (
                              <span className="trigger-profiles-library-installed">Installed</span>
                            ) : (
                              <button
                                type="button"
                                className="secondary-action trigger-profiles-library-install-button"
                                disabled={triggerProfileLibraryInstalling !== null}
                                onClick={() => void installTriggerProfileFromLibrary(row.entry)}
                              >
                                {triggerProfileLibraryInstalling === row.entry.file ? 'Installing…' : 'Install'}
                              </button>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showBridgeSettings && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowBridgeSettings(false)}
        >
          <div
            className="settings-menu bridge-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bridge settings"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-menu-heading bridge-settings-modal-heading">
              <div className="modal-heading-copy">
                <SettingsIcon size={16} />
                <span>Bridge Settings</span>
              </div>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close bridge settings"
                onClick={() => setShowBridgeSettings(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="bridge-settings-columns">
              <div className="bridge-settings-column">
                <div className="settings-menu-section-label">Appearance</div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Theme</strong>
                  </div>
                  <CustomSelect
                    value={snapshot.settings.uiThemePreset}
                    options={UI_THEME_OPTIONS}
                    className="settings-theme-select"
                    showSelectedCheck={false}
                    ariaLabel="UI theme"
                    disabled={pendingAction !== null}
                    renderValue={(label, value) => <ThemeOption label={label} value={value} />}
                    renderOption={(label, value) => <ThemeOption label={label} value={value} />}
                    onChange={(value) => {
                      void runAction('ui-theme', () => window.bridge.setUiThemePreset(value));
                    }}
                  />
                </div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>UI Scale</strong>
                  </div>
                  <CustomSelect
                    value={snapshot.settings.uiScalePercent}
                    options={UI_SCALE_OPTIONS}
                    className="settings-scale-select"
                    showSelectedCheck={false}
                    ariaLabel="UI scale"
                    disabled={pendingAction !== null}
                    onChange={(value) => {
                      void runAction('ui-scale', () => window.bridge.setUiScalePercent(value));
                    }}
                  />
                </div>
                <div className="settings-menu-section-label">General</div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Launch at Startup</strong>
                    <span>{VDS_AVAILABLE ? 'Start OpenDS5 when you log in' : 'Start in the tray when Windows starts'}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.launchAtStartupEnabled}
                    className={`switch ${snapshot.settings.launchAtStartupEnabled ? 'on' : ''}`}
                    disabled={pendingAction !== null}
                    onClick={() => void runAction('launch-at-startup', () => (
                      window.bridge.setLaunchAtStartupEnabled(!snapshot.settings.launchAtStartupEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Launch with Profile</strong>
                    <span>Profile selected when OpenDS5 starts</span>
                  </div>
                  <CustomSelect
                    value={snapshot.settings.startupControllerProfileId || STARTUP_PROFILE_LAST_USED}
                    options={[
                      ['Last used', STARTUP_PROFILE_LAST_USED],
                      ...userControllerProfiles.map((profile): [string, string] => [profile.name, profile.id])
                    ]}
                    className="settings-startup-profile-select"
                    floatingMenu
                    floatingMenuMinWidth={180}
                    ariaLabel="Launch with profile"
                    disabled={pendingAction !== null}
                    onChange={(value) => void runAction('startup-profile', () => (
                      window.bridge.setStartupControllerProfileId(value === STARTUP_PROFILE_LAST_USED ? '' : value)
                    ))}
                  />
                </div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Start Minimized</strong>
                    <span>Open in the tray instead of showing the window</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.startMinimizedEnabled}
                    className={`switch ${snapshot.settings.startMinimizedEnabled ? 'on' : ''}`}
                    disabled={pendingAction !== null}
                    onClick={() => void runAction('start-minimized', () => (
                      window.bridge.setStartMinimizedEnabled(!snapshot.settings.startMinimizedEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Battery Tray Icon</strong>
                    <span>Show controller battery percentage in the tray</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.showBatteryPercentTrayIcon}
                    className={`switch ${snapshot.settings.showBatteryPercentTrayIcon ? 'on' : ''}`}
                    disabled={pendingAction !== null}
                    onClick={() => void runAction('battery-tray-icon', () => (
                      window.bridge.setShowBatteryPercentTrayIcon(!snapshot.settings.showBatteryPercentTrayIcon)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                <div className="settings-menu-section-label">Connection Behavior</div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Idle Disconnect</strong>
                  </div>
                  <div className="settings-menu-controls">
                    <CustomSelect
                      value={snapshot.settings.idleDisconnectTimeoutMinutes}
                      options={IDLE_DISCONNECT_TIMEOUT_OPTIONS}
                      className="settings-timeout-select"
                      showSelectedCheck={false}
                      ariaLabel="Idle disconnect timeout"
                      disabled={!connected || !snapshot.settings.idleDisconnectEnabled}
                      onChange={(value) => {
                        void runAction('idle-timeout', () => window.bridge.setIdleDisconnectTimeoutMinutes(value));
                      }}
                    />
                    <button
                      type="button"
                      role="switch"
                      aria-checked={snapshot.settings.idleDisconnectEnabled}
                      className={`switch ${snapshot.settings.idleDisconnectEnabled ? 'on' : ''}`}
                      disabled={!connected}
                      onClick={() => void runAction('idle', () => (
                        window.bridge.setIdleDisconnectEnabled(!snapshot.settings.idleDisconnectEnabled)
                      ))}
                    >
                      <span />
                    </button>
                  </div>
                </div>
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>PC Sleep Disconnect</strong>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.usbSuspendDisconnectEnabled}
                    className={`switch ${snapshot.settings.usbSuspendDisconnectEnabled ? 'on' : ''}`}
                    disabled={!connected || !usbSuspendDisconnectSupported}
                    onClick={() => void runAction('usb-suspend', () => (
                      window.bridge.setUsbSuspendDisconnectEnabled(!snapshot.settings.usbSuspendDisconnectEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                {SYSTEM_UNINSTALL_AVAILABLE && (
                  <>
                    <div className="settings-menu-section-label">Maintenance</div>
                    <div className="settings-menu-row">
                      <div className="settings-menu-copy">
                        <strong>Uninstall OpenDS5</strong>
                        <span>{VDS_LINUX ? 'Remove the driver, daemon and launcher' : 'Remove the vdsd service'}</span>
                      </div>
                      <button
                        type="button"
                        className="secondary-action danger settings-uninstall-button"
                        onClick={() => {
                          setShowBridgeSettings(false);
                          setUninstallDialog({ phase: 'confirm', purge: false, steps: [], statuses: {}, exit: null });
                        }}
                      >
                        <Trash2 size={14} />
                        Uninstall…
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="bridge-settings-column">
                <div className="settings-menu-section-label">Power & Controller</div>
                <div className={`settings-menu-row ${settingsFocusTarget === 'controller-power-saving' ? 'settings-menu-row-highlight' : ''}`}>
                  <div className="settings-menu-copy">
                    <strong>Controller Power Saving</strong>
                    <span>Caps haptics, triggers, and lightbar brightness at 60% while headphones are plugged in</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.controllerPowerSavingEnabled}
                    className={`switch ${snapshot.settings.controllerPowerSavingEnabled ? 'on' : ''}`}
                    disabled={pendingAction !== null}
                    onClick={() => void runAction('controller-power-saving', () => (
                      window.bridge.setControllerPowerSavingEnabled(!snapshot.settings.controllerPowerSavingEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                {TOUCHPAD_MOUSE_AVAILABLE && (
                  <div className="settings-menu-row">
                    <div className="settings-menu-copy">
                      <strong>Touchpad Mouse Input</strong>
                      <span>Let the touchpad move the desktop cursor. Turn off to stop games treating touchpad gestures as camera movement; in-game touch features keep working</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={snapshot.settings.touchpadMouseEnabled}
                      className={`switch ${snapshot.settings.touchpadMouseEnabled ? 'on' : ''}`}
                      disabled={pendingAction !== null}
                      onClick={() => void runAction('touchpad-mouse', () => (
                        window.bridge.setTouchpadMouseEnabled(!snapshot.settings.touchpadMouseEnabled)
                      ))}
                    >
                      <span />
                    </button>
                  </div>
                )}
                <div className="settings-menu-row">
                  <div className="settings-menu-copy">
                    <strong>Player Slot LED</strong>
                    <span>Show the controller player indicator lights</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.playerLedEnabled}
                    className={`switch ${snapshot.settings.playerLedEnabled ? 'on' : ''}`}
                    disabled={!connected}
                    onClick={() => void runAction('player-led', () => (
                      window.bridge.setPlayerLedEnabled(!snapshot.settings.playerLedEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                <div className="settings-menu-section-label">Shortcuts</div>
                <div className={`settings-menu-row ${settingsFocusTarget === 'sleep-shortcut' ? 'settings-menu-row-highlight' : ''}`}>
                  <div className="settings-menu-copy settings-menu-copy-tooltip">
                    <strong>Turn Off Shortcut</strong>
                    <div className="settings-shortcut-tooltip shortcut-glyph-tooltip" role="tooltip">
                      <span>Turn off the controller with</span>
                      <TurnOffShortcutGlyphs />
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.sleepKeybindEnabled}
                    className={`switch ${snapshot.settings.sleepKeybindEnabled ? 'on' : ''}`}
                    disabled={!connected || !sleepControllerSupported || pendingAction !== null}
                    onClick={() => void runAction('sleep-keybind', () => (
                      window.bridge.setSleepKeybindEnabled(!snapshot.settings.sleepKeybindEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                <div className={`settings-menu-row ${settingsFocusTarget === 'volume-shortcut' ? 'settings-menu-row-highlight' : ''}`}>
                  <div className="settings-menu-copy settings-menu-copy-tooltip">
                    <strong>Volume Shortcut</strong>
                    <div className="settings-shortcut-tooltip shortcut-glyph-tooltip" role="tooltip">
                      <span>Controller volume up/down with</span>
                      <DpadShortcutGlyphs pair="up-down" />
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.speakerVolumeShortcutEnabled}
                    className={`switch ${snapshot.settings.speakerVolumeShortcutEnabled ? 'on' : ''}`}
                    disabled={!connected}
                    onClick={() => void runAction('volume-shortcut', () => (
                      window.bridge.setSpeakerVolumeShortcutEnabled(!snapshot.settings.speakerVolumeShortcutEnabled)
                    ))}
                  >
                    <span />
                  </button>
                </div>
                {VDS_AVAILABLE && (
                  <div className={`settings-menu-row ${settingsFocusTarget === 'profile-shortcut' ? 'settings-menu-row-highlight' : ''}`}>
                    <div className="settings-menu-copy settings-menu-copy-tooltip">
                      <strong>Profile Shortcut</strong>
                      <div className="settings-shortcut-tooltip shortcut-glyph-tooltip" role="tooltip">
                        <span>Previous/next controller profile with</span>
                        <DpadShortcutGlyphs pair="left-right" />
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={snapshot.settings.profileShortcutEnabled}
                      aria-label="Profile shortcut"
                      className={`switch ${snapshot.settings.profileShortcutEnabled ? 'on' : ''}`}
                      disabled={!connected}
                      onClick={() => void runAction('profile-shortcut', () => (
                        window.bridge.setProfileShortcutEnabled(!snapshot.settings.profileShortcutEnabled)
                      ))}
                    >
                      <span />
                    </button>
                  </div>
                )}
                <div className="settings-menu-section-label">About</div>
                <button
                  type="button"
                  className="settings-menu-link-row"
                  onClick={() => void window.bridge.openExternal(OPENDS5_REPOSITORY_URL)}
                >
                  <span className="settings-menu-link-icon" aria-hidden="true">
                    <IconBrandGithub size={18} />
                  </span>
                  <span className="settings-menu-link-copy">
                    <strong>OpenDS5{appVersion ? ` ${appVersion}` : ''}</strong>
                    <span>Virmin8/OpenDS5 · AGPL-3.0</span>
                  </span>
                </button>
                {/* This fork starts from LordVicky's OpenDS5 at UPSTREAM_OPENDS5_VERSION. */}
                <button
                  type="button"
                  className="settings-menu-link-row"
                  onClick={() => void window.bridge.openExternal('https://github.com/LordVicky/OpenDS5')}
                >
                  <span className="settings-menu-link-icon" aria-hidden="true">
                    <IconBrandGithub size={18} />
                  </span>
                  <span className="settings-menu-link-copy">
                    <strong>Based on OpenDS5 {UPSTREAM_OPENDS5_VERSION}</strong>
                    <span>by LordVicky</span>
                  </span>
                </button>
                {/* Upstream attribution. The companion app is an AGPL-3.0 derivative of
                    SundayMoments/DS5_Bridge, so the credit stays. */}
                <button
                  type="button"
                  className="settings-menu-link-row"
                  onClick={() => void window.bridge.openExternal('https://github.com/SundayMoments')}
                >
                  <span className="settings-menu-link-icon" aria-hidden="true">
                    <IconBrandGithub size={18} />
                  </span>
                  <span className="settings-menu-link-copy">
                    <strong>Based on DS5 Bridge</strong>
                    <span>by SundayMoments</span>
                  </span>
                </button>
                {/* vds (MIT, Jihong Min) is the virtual-DualSense transport this port runs on. */}
                <button
                  type="button"
                  className="settings-menu-link-row"
                  onClick={() => void window.bridge.openExternal('https://github.com/hurryman2212/vds')}
                >
                  <span className="settings-menu-link-icon" aria-hidden="true">
                    <IconBrandGithub size={18} />
                  </span>
                  <span className="settings-menu-link-copy">
                    <strong>Powered by vds</strong>
                    <span>by Jihong Min · MIT</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!startupTutorialOpen && !anyModalOpen && (
        <UpdateToast
          state={updateState}
          onAction={(action) => {
            if (action === 'skip') {
              if ('version' in updateState) void window.update.skip(updateState.version);
              setUpdateState({ phase: 'idle' });
              return;
            }
            if (action === 'dismiss') {
              void window.update.dismiss();
              setUpdateState({ phase: 'idle' });
              return;
            }
            void window.update[action]();
          }}
        />
      )}

    </div>
  );
}
