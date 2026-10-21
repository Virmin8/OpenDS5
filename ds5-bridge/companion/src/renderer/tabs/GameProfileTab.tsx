import {
  IconActivity as Activity,
  IconAlertTriangle,
  IconChevronLeft as ChevronLeft,
  IconArrowLeft,
  IconBulb,
  IconDeviceGamepad2,
  IconDeviceGamepad3,
  IconPhoto,
  IconTargetArrow,
  IconVolume,
  IconPencil as Pencil,
  IconPlus as Plus,
  IconSparkles as Sparkles,
  IconTrash as Trash2
} from '@tabler/icons-react';
import { CustomSelect } from '../app/components';
import { GAME_PROFILE_LINK_NONE, gameProfileTitle, gameTileArtClass, gameTileMonogram } from '../app/games';
import { triggerProfileHasEffects } from '../app/triggers';
import type { AppState } from '../app/useAppState';
import { nativeGameFeatures } from '../game-library-match';

export function GameProfileTab({ app }: { app: AppState }) {
  const {
    activeControlTab, activeGameProfile, closeGameProfile, dismissSteamInputNotice, gameArtwork, gameHasSettings,
    gameProfileLinkOptions, gameProfiles, gameSettingsScope, gameSettingsStatus, linkedProfileFor,
    nativeFeatureMap, openGameArtworkDialog, openGameCreateDialog, openGameProcessEditor,
    openGameProfile, openGameProfileEntry, openGameTriggerEditor, pendingAction, selectControlTab,
    selectEngineTriggerState, setGameDeleteConfirm, setGameProfileLink, setGameSettingsScope,
    toggleTriggerProfilesEnabled, triggerProfileEngineStatus, triggerProfiles,
    triggerProfilesEnabled, steamInputActive, steamInputNoticeDismissed
  } = app;

  return (
    <div
      className={`control-page game-profile-page ${activeControlTab === 'game-profile' ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-game-profile"
      aria-labelledby="control-tab-game-profile"
      aria-hidden={activeControlTab !== 'game-profile'}
    >
      {openGameProfileEntry === null ? (
        <>
          <div className="feature-heading">
            <div>
              <h2>Game Profile</h2>
              <p>Everything about a game — triggers, haptics, audio, lighting and remapping — in one place.</p>
            </div>
            <div className="game-auto-switch">
              <Activity size={14} />
              <span className="game-auto-switch-label">Auto Switching</span>
              <span className={`game-auto-switch-state ${triggerProfilesEnabled ? 'on' : ''}`}>
                <span className={`dot ${triggerProfilesEnabled ? 'good' : 'warn'}`} />
                {triggerProfilesEnabled ? 'Running' : 'Off'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={triggerProfilesEnabled}
                aria-label="Enable automatic game profile switching"
                className={`switch ${triggerProfilesEnabled ? 'on' : ''}`}
                onClick={() => void toggleTriggerProfilesEnabled()}
              >
                <span />
              </button>
            </div>
          </div>
          <div className="game-profile-content">
            {steamInputActive && !steamInputNoticeDismissed && (
              <div className="steam-input-notice" role="status">
                <IconAlertTriangle size={18} stroke={2.2} aria-hidden="true" />
                <div>
                  <strong>Steam Input is using your controller</strong>
                  <span>
                    Games with native DualSense support lose adaptive triggers and haptics, and may see
                    double input. For those games, open the game&apos;s <b>Properties → Controller</b> in
                    Steam and choose <b>Disable Steam Input</b>.
                  </span>
                </div>
                <button type="button" className="secondary-action" onClick={dismissSteamInputNotice}>
                  Don&apos;t show again
                </button>
              </div>
            )}
            {activeGameProfile && (
              <section className="game-hero" aria-label="Now playing">
                <span
                  className={`game-hero-art ${gameArtwork[activeGameProfile.id] ? 'has-image' : gameTileArtClass(activeGameProfile.id)}`}
                  style={gameArtwork[activeGameProfile.id]
                    ? { backgroundImage: `url("${gameArtwork[activeGameProfile.id]}")` }
                    : undefined}
                  aria-hidden="true"
                >
                  {!gameArtwork[activeGameProfile.id] && (
                    <span className="game-tile-monogram">{gameTileMonogram(gameProfileTitle(activeGameProfile))}</span>
                  )}
                </span>
                <div className="game-hero-copy">
                  <span className="game-hero-kicker">
                    <span className="dot good" />
                    Now Playing
                    {triggerProfileEngineStatus?.matchedName ? ` · ${triggerProfileEngineStatus.matchedName}` : ''}
                  </span>
                  <h3>{gameProfileTitle(activeGameProfile)}</h3>
                  <div className="game-tile-chips">
                    <span className={`game-tile-chip ${triggerProfileHasEffects(activeGameProfile) ? 'on' : ''}`}>
                      Triggers
                    </span>
                    <span className={`game-tile-chip ${gameSettingsStatus?.appliedProfileId === activeGameProfile.id ? 'on' : ''}`}>
                      {gameSettingsStatus?.appliedProfileId === activeGameProfile.id ? 'Game Settings' : 'Global Settings'}
                    </span>
                  </div>
                  {(() => {
                    if (!triggerProfileEngineStatus?.enabled || !triggerProfileEngineStatus.activeStateName) return null;
                    const activeStates = triggerProfiles.find(
                      (profile) => profile.id === triggerProfileEngineStatus.activeProfileId
                    )?.states;
                    if (!activeStates || activeStates.length < 2) return null;
                    return (
                      <div className="trigger-profiles-live-state-chips game-hero-states">
                        {activeStates.map((state) => (
                          <button
                            key={state.name}
                            type="button"
                            className={`trigger-lab-chip compact ${
                              state.name === triggerProfileEngineStatus.activeStateName ? 'active' : ''
                            }`}
                            aria-pressed={state.name === triggerProfileEngineStatus.activeStateName}
                            onClick={() => void selectEngineTriggerState(state.name)}
                          >
                            <span className="trigger-lab-chip-label">{state.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className="game-hero-actions">
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => void openGameProfile(activeGameProfile.id)}
                  >
                    <Pencil size={14} />
                    Customize
                  </button>
                </div>
              </section>
            )}
            <div className="game-tile-grid">
              {gameProfiles.map((profile) => {
                const title = gameProfileTitle(profile);
                const art = gameArtwork[profile.id];
                const native = nativeGameFeatures(nativeFeatureMap, profile);
                const live = Boolean(
                  triggerProfileEngineStatus?.enabled
                  && triggerProfileEngineStatus.activeProfileId === profile.id
                );
                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`game-tile ${live ? 'playing' : ''}`}
                    onClick={() => void openGameProfile(profile.id)}
                  >
                    <span
                      className={`game-tile-art ${art ? 'has-image' : gameTileArtClass(profile.id)}`}
                      style={art ? { backgroundImage: `url("${art}")` } : undefined}
                      aria-hidden="true"
                    >
                      {!art && <span className="game-tile-monogram">{gameTileMonogram(title)}</span>}
                    </span>
                    {native && <span className="game-tile-native-badge">Native</span>}
                    {live && (
                      <span className="game-tile-live">
                        <span className="dot" />
                        Playing
                      </span>
                    )}
                    <span className="game-tile-meta">
                      <strong>{title}</strong>
                      <span className="game-tile-chips">
                        {native?.triggers ? (
                          <span className="game-tile-chip native on">Native triggers</span>
                        ) : (
                          <span className={`game-tile-chip ${triggerProfileHasEffects(profile) ? 'on' : ''}`}>
                            Triggers
                          </span>
                        )}
                        {native?.haptics && <span className="game-tile-chip native on">Haptics</span>}
                        {native?.lightbar && <span className="game-tile-chip native on">LED</span>}
                        {linkedProfileFor(profile.id) ? (
                          <span className="game-tile-chip on profile-link">
                            {linkedProfileFor(profile.id)?.name}
                          </span>
                        ) : (
                          <span className={`game-tile-chip ${gameHasSettings(profile.id) ? 'on' : ''}`}>
                            Settings
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                className="game-tile game-tile-add"
                onClick={openGameCreateDialog}
              >
                <Plus size={22} />
                <span>Add Game</span>
              </button>
            </div>
            {gameProfiles.length === 0 && (
              <p className="game-profile-empty-hint">
                Add a game to give it its own trigger effects, sound, lighting and button mapping —
                or install one from the library in the Trigger Profiles tab.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="feature-heading game-detail-heading">
            <div>
              <h2>{gameProfileTitle(openGameProfileEntry)}</h2>
              <p>
                {openGameProfileEntry.match.processNames.length > 0
                  ? `Applies automatically when ${openGameProfileEntry.match.processNames.join(', ')} is running.`
                  : 'No process match yet — add one in the trigger editor so this game is detected.'}
              </p>
            </div>
            <button
              className="nav-back"
              type="button"
              onClick={() => void closeGameProfile()}
            >
              <span className="nav-back-arrow" aria-hidden="true"><ChevronLeft size={22} /></span>
              <span className="nav-back-lines">
                <i>Back to</i>
                <b>All Games</b>
              </span>
            </button>
          </div>
          <div className="game-profile-content">
            <section className="game-detail-header">
              <button
                type="button"
                className={`game-detail-art ${gameArtwork[openGameProfileEntry.id] ? 'has-image' : gameTileArtClass(openGameProfileEntry.id)}`}
                style={gameArtwork[openGameProfileEntry.id]
                  ? { backgroundImage: `url("${gameArtwork[openGameProfileEntry.id]}")` }
                  : undefined}
                aria-label="Back to all games"
                onClick={() => void closeGameProfile()}
              >
                {!gameArtwork[openGameProfileEntry.id] && (
                  <span className="game-tile-monogram">{gameTileMonogram(gameProfileTitle(openGameProfileEntry))}</span>
                )}
                <span className="game-detail-art-overlay">
                  <IconArrowLeft size={16} />
                  All Games
                </span>
              </button>
              <div className="game-detail-copy">
                <span className="game-detail-status">
                  {triggerProfileEngineStatus?.enabled && triggerProfileEngineStatus.activeProfileId === openGameProfileEntry.id ? (
                    <>
                      <span className="dot good" />
                      Playing now
                      {gameSettingsStatus?.appliedProfileId === openGameProfileEntry.id ? ' — game settings active' : ''}
                    </>
                  ) : linkedProfileFor(openGameProfileEntry.id) ? (
                    <>
                      <span className="dot" />
                      Switches to your “{linkedProfileFor(openGameProfileEntry.id)?.name}” profile when the game is detected
                    </>
                  ) : gameHasSettings(openGameProfileEntry.id) ? (
                    <>
                      <span className="dot" />
                      Game settings ready — applied when the game is detected
                    </>
                  ) : (
                    <>
                      <span className="dot" />
                      Using your global settings
                    </>
                  )}
                </span>
                <div className="game-profile-link-row">
                  <span>Profile when playing</span>
                  <CustomSelect
                    value={linkedProfileFor(openGameProfileEntry.id)?.id ?? GAME_PROFILE_LINK_NONE}
                    options={gameProfileLinkOptions}
                    floatingMenu
                    floatingMenuMinWidth={220}
                    disabled={pendingAction !== null}
                    ariaLabel="Profile when playing"
                    onChange={(profileId) => setGameProfileLink(openGameProfileEntry.id, profileId)}
                  />
                </div>
                {linkedProfileFor(openGameProfileEntry.id) ? (
                  <p className="game-scope-hint">
                    While this game runs, your “{linkedProfileFor(openGameProfileEntry.id)?.name}” profile
                    is selected and your previous profile comes back when it closes. To change what that
                    profile does, pick it in the sidebar and edit it from any tab.
                  </p>
                ) : (
                  <>
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
                <p className="game-scope-hint">
                  {gameSettingsScope === 'game'
                    ? 'Every tab now edits this game’s own settings. Your global settings stay untouched and come back when the game exits.'
                    : 'Every tab edits your global settings. Switch to Game Settings to tune this game without touching them.'}
                </p>
                  </>
                )}
              </div>
              <div className="game-detail-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => openGameArtworkDialog(openGameProfileEntry.id, gameProfileTitle(openGameProfileEntry))}
                >
                  <IconPhoto size={14} />
                  Cover Art
                </button>
                <button
                  type="button"
                  className="secondary-action danger"
                  onClick={() => setGameDeleteConfirm({
                    id: openGameProfileEntry.id,
                    name: gameProfileTitle(openGameProfileEntry)
                  })}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => openGameProcessEditor(openGameProfileEntry)}
                >
                  <IconTargetArrow size={14} />
                  Game Path
                </button>
              </div>
            </section>
            <div className="overview-card-grid game-detail-nav">
              {nativeGameFeatures(nativeFeatureMap, openGameProfileEntry)?.triggers ? (
                <div className="overview-card game-detail-nav-native">
                  <div className="overview-card-title">
                    <span className="feature-icon overview-icon"><IconTargetArrow size={19} /></span>
                    <h3>Adaptive Triggers</h3>
                    <span className="game-tile-chip native on">Native</span>
                  </div>
                  <p className="game-detail-nav-copy">
                    This game drives the triggers itself — custom trigger settings are
                    disabled so they can’t fight the game’s own effects.
                  </p>
                </div>
              ) : (
                <button className="overview-card" type="button" onClick={() => openGameTriggerEditor(openGameProfileEntry)}>
                  <div className="overview-card-title">
                    <span className="feature-icon overview-icon"><IconTargetArrow size={19} /></span>
                    <h3>Adaptive Triggers</h3>
                  </div>
                  <p className="game-detail-nav-copy">
                    {triggerProfileHasEffects(openGameProfileEntry)
                      ? 'Edit this game’s trigger effects and process match.'
                      : 'No trigger effects yet — design some for this game.'}
                  </p>
                </button>
              )}
              <button className="overview-card" type="button" onClick={() => selectControlTab('audio')}>
                <div className="overview-card-title">
                  <span className="feature-icon overview-icon"><IconVolume size={19} /></span>
                  <h3>Audio</h3>
                </div>
                <p className="game-detail-nav-copy">Speaker, microphone and controller audio.</p>
              </button>
              <button className="overview-card" type="button" onClick={() => selectControlTab('haptics')}>
                <div className="overview-card-title">
                  <span className="feature-icon overview-icon"><Sparkles size={19} /></span>
                  <h3>Haptics</h3>
                  {nativeGameFeatures(nativeFeatureMap, openGameProfileEntry)?.haptics && (
                    <span className="game-tile-chip native on">Native</span>
                  )}
                </div>
                <p className="game-detail-nav-copy">
                  {nativeGameFeatures(nativeFeatureMap, openGameProfileEntry)?.haptics
                    ? 'This game has native HD haptics — tune intensity and audio-reactive feedback here.'
                    : 'HD haptics, rumble and audio-reactive feedback.'}
                </p>
              </button>
              <button className="overview-card" type="button" onClick={() => selectControlTab('triggers')}>
                <div className="overview-card-title">
                  <span className="feature-icon overview-icon"><IconDeviceGamepad2 size={19} /></span>
                  <h3>Trigger Lab</h3>
                </div>
                <p className="game-detail-nav-copy">Trigger intensity and live effect testing.</p>
              </button>
              <button className="overview-card" type="button" onClick={() => selectControlTab('lighting')}>
                <div className="overview-card-title">
                  <span className="feature-icon overview-icon"><IconBulb size={19} /></span>
                  <h3>Lighting</h3>
                  {nativeGameFeatures(nativeFeatureMap, openGameProfileEntry)?.lightbar && (
                    <span className="game-tile-chip native on">Native</span>
                  )}
                </div>
                <p className="game-detail-nav-copy">
                  {nativeGameFeatures(nativeFeatureMap, openGameProfileEntry)?.lightbar
                    ? 'This game syncs the lightbar itself — a lightbar override here would hide its effects.'
                    : 'Lightbar color, brightness and player LEDs.'}
                </p>
              </button>
              <button className="overview-card" type="button" onClick={() => selectControlTab('remapping')}>
                <div className="overview-card-title">
                  <span className="feature-icon overview-icon"><IconDeviceGamepad3 size={19} /></span>
                  <h3>Button Remapping</h3>
                </div>
                <p className="game-detail-nav-copy">This game’s button layout.</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
