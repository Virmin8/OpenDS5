import type { InstalledGamesList } from '../../preload';
import type { TriggerProfile } from '../../shared/trigger-profiles';

// vds (the virtual DualSense bridge) runs on Linux, and on Windows once vdsd
// is installed; otherwise Windows uses the DS5 Bridge Pico dongle. Settings
// the Bluetooth path cannot honour (polling rate, keyboard/quiet Mute modes)
// are hidden with vds; the Pico firmware keeps them.
export const GAME_SOURCE_LABELS: Record<InstalledGamesList['games'][number]['source'], string> = {
  steam: 'Steam',
  heroic: 'Heroic',
  lutris: 'Lutris',
  epic: 'Epic'
};
// Lutris is Linux-only; the Epic Games Launcher is scanned on Windows.
export const GAME_LAUNCHERS_LABEL = typeof window !== 'undefined' && window.vds?.platform === 'win32'
  ? 'Steam, Epic and Heroic'
  : 'Steam, Heroic and Lutris';
export const GAME_PROFILE_LINK_NONE = '__none__';

/**
 * Game Profile tiles without cover art get a generated look: a deterministic gradient
 * class picked from the profile id plus a monogram built from the game title.
 */
export const GAME_TILE_ART_CLASS_COUNT = 6;

export function gameTileArtClass(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return `game-tile-art-${hash % GAME_TILE_ART_CLASS_COUNT}`;
}

export function gameTileMonogram(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((word) => word.length > 0);
  const letters = words.slice(0, 2).map((word) => word[0].toUpperCase()).join('');
  return letters || '?';
}

/** The display title of a game tile: the profile's game metadata, else its name. */
export function gameProfileTitle(profile: Pick<TriggerProfile, 'name' | 'meta'>): string {
  return profile.meta?.game?.trim() || profile.name;
}
