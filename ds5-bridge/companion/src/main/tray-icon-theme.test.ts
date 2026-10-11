import { describe, expect, it } from 'vitest';
import { recolorMarkForLightTaskbar, trayBatteryPalette, trayTheme } from './tray-icon-theme';

describe('trayTheme', () => {
  it('follows the Windows taskbar theme', () => {
    expect(trayTheme('win32', { shouldUseDarkColorsForSystemIntegratedUI: false })).toBe('light');
    expect(trayTheme('win32', { shouldUseDarkColorsForSystemIntegratedUI: true })).toBe('dark');
  });

  it('keeps the dark-taskbar icons on Linux', () => {
    expect(trayTheme('linux', { shouldUseDarkColorsForSystemIntegratedUI: false })).toBe('dark');
  });
});

describe('trayBatteryPalette', () => {
  it('draws dark digits on a light taskbar and light digits on a dark one', () => {
    const luminance = ({ red, green, blue }: { red: number; green: number; blue: number }) =>
      (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
    expect(luminance(trayBatteryPalette('light').discharging)).toBeLessThan(64);
    expect(luminance(trayBatteryPalette('light').charging)).toBeLessThan(128);
    expect(luminance(trayBatteryPalette('dark').discharging)).toBeGreaterThan(200);
  });
});

describe('recolorMarkForLightTaskbar', () => {
  it('draws the white body solid dark and its black outlines as gaps', () => {
    const bitmap = Buffer.from([
      255, 255, 255, 255, // white body
      0, 0, 0, 255, // black outline
      230, 120, 40, 255, // blue accent (BGRA)
      200, 200, 200, 0 // transparent
    ]);
    const out = recolorMarkForLightTaskbar(bitmap);
    expect([...out.subarray(0, 4)]).toEqual([30, 30, 30, 255]);
    expect(out[7]).toBe(0);
    expect([...out.subarray(8, 12)]).toEqual([230, 120, 40, 255]);
    expect([...out.subarray(12, 16)]).toEqual([200, 200, 200, 0]);
    expect(bitmap[0]).toBe(255);
  });
});
