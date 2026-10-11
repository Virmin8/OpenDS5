/**
 * Tray icon colours for light and dark taskbars. The OpenDS5 mark and the
 * battery number are white-on-transparent, made for a dark taskbar; on a light
 * Windows taskbar they all but disappear.
 */

export interface TrayColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface TrayBatteryPalette {
  shadow: TrayColor;
  discharging: TrayColor;
  charging: TrayColor;
}

export type TrayTheme = 'dark' | 'light';

const DARK_TASKBAR_BATTERY: TrayBatteryPalette = {
  shadow: { red: 0, green: 0, blue: 0, alpha: 180 },
  discharging: { red: 245, green: 248, blue: 255, alpha: 255 },
  charging: { red: 57, green: 215, blue: 125, alpha: 255 }
};

const LIGHT_TASKBAR_BATTERY: TrayBatteryPalette = {
  shadow: { red: 255, green: 255, blue: 255, alpha: 200 },
  discharging: { red: 28, green: 32, blue: 38, alpha: 255 },
  charging: { red: 0, green: 128, blue: 64, alpha: 255 }
};

/** Pixels whose channels differ by less than this count as grey (the mark's white body). */
const GREY_CHANNEL_SPREAD = 48;

/**
 * Windows themes the taskbar separately from apps ("Choose your default
 * Windows mode"); Electron reports it as shouldUseDarkColorsForSystemIntegratedUI.
 * Other platforms keep the dark-taskbar icons.
 */
export function trayTheme(
  platform: NodeJS.Platform,
  theme: { shouldUseDarkColorsForSystemIntegratedUI: boolean }
): TrayTheme {
  return platform === 'win32' && !theme.shouldUseDarkColorsForSystemIntegratedUI ? 'light' : 'dark';
}

export function trayBatteryPalette(theme: TrayTheme): TrayBatteryPalette {
  return theme === 'light' ? LIGHT_TASKBAR_BATTERY : DARK_TASKBAR_BATTERY;
}

/** Dark grey the mark's body is drawn in on a light taskbar (same in BGRA and RGBA order). */
const LIGHT_TASKBAR_MARK_SHADE = 30;

/**
 * Recolours a 4-bytes-per-pixel bitmap of the mark for a light taskbar: grey
 * pixels become one dark shade with their brightness as opacity, so the white
 * body turns solid dark and its black outlines become gaps; coloured accents
 * are kept. Works on BGRA and RGBA alike, alpha last. Returns a new buffer.
 */
export function recolorMarkForLightTaskbar(bitmap: Buffer): Buffer {
  const out = Buffer.from(bitmap);
  for (let offset = 0; offset + 3 < out.length; offset += 4) {
    if (out[offset + 3] === 0) {
      continue;
    }
    const a = out[offset];
    const b = out[offset + 1];
    const c = out[offset + 2];
    if (Math.max(a, b, c) - Math.min(a, b, c) >= GREY_CHANNEL_SPREAD) {
      continue;
    }
    const brightness = (a + b + c) / 3;
    out[offset] = LIGHT_TASKBAR_MARK_SHADE;
    out[offset + 1] = LIGHT_TASKBAR_MARK_SHADE;
    out[offset + 2] = LIGHT_TASKBAR_MARK_SHADE;
    out[offset + 3] = Math.round(out[offset + 3] * brightness / 255);
  }
  return out;
}
