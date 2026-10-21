import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { steamHasVirtualController, steamInputTakesOverController, steamPlayStationSupport } from './steam-input';

describe('steamHasVirtualController', () => {
  let root: string;
  let roots: { proc: string; sys: string; dev: string };

  function hidraw(name: string, devicePath: string) {
    const target = path.join(roots.sys, 'devices', devicePath);
    fs.mkdirSync(target, { recursive: true });
    fs.mkdirSync(path.join(roots.sys, 'class', 'hidraw', name), { recursive: true });
    fs.symlinkSync(target, path.join(roots.sys, 'class', 'hidraw', name, 'device'));
  }

  function process(pid: number, comm: string, openNodes: string[]) {
    const dir = path.join(roots.proc, String(pid));
    fs.mkdirSync(path.join(dir, 'fd'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'comm'), `${comm}\n`);
    openNodes.forEach((node, i) => fs.symlinkSync(path.join(roots.dev, node), path.join(dir, 'fd', String(10 + i))));
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'opends5-steam-'));
    roots = { proc: path.join(root, 'proc'), sys: path.join(root, 'sys'), dev: path.join(root, 'dev') };
    fs.mkdirSync(roots.proc, { recursive: true });
    hidraw('hidraw2', 'pci0000:00/usb1/1-5/1-5:1.0/0003:2516:0015.0002');
    hidraw('hidraw11', 'platform/vds_hcd.0/usb5/5-1/5-1:1.3/0003:054C:0CE6.0010');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('is true when Steam has the virtual DualSense open', () => {
    process(2299, 'steam', ['hidraw2', 'hidraw11']);
    expect(steamHasVirtualController(roots)).toBe(true);
  });

  it('is false when Steam only has other devices open', () => {
    process(2299, 'steam', ['hidraw2']);
    expect(steamHasVirtualController(roots)).toBe(false);
  });

  it('ignores other programs (a game reading the controller directly)', () => {
    process(4000, 'GameThread', ['hidraw11']);
    process(2299, 'steamwebhelper', ['hidraw11']);
    expect(steamHasVirtualController(roots)).toBe(false);
  });

  it('is false with no virtual controller, even if Steam has a real one open', () => {
    fs.rmSync(path.join(roots.sys, 'class', 'hidraw', 'hidraw11'), { recursive: true });
    hidraw('hidraw12', 'pci0000:00/usb1/1-2/1-2:1.3/0003:054C:0CE6.0011');
    process(2299, 'steam', ['hidraw12']);
    expect(steamHasVirtualController(roots)).toBe(false);
  });

  it('is false when /sys or /proc cannot be read', () => {
    expect(steamHasVirtualController({ proc: path.join(root, 'nope'), sys: path.join(root, 'nope'), dev: roots.dev })).toBe(false);
  });

  describe('PlayStation Controller Support', () => {
    function steamConfig(home: string, account: string, body: string, ageSeconds = 0) {
      const dir = path.join(home, '.local', 'share', 'Steam', 'userdata', account, 'config');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, 'localconfig.vdf');
      fs.writeFileSync(file, `"UserLocalConfigStore"\n{\n${body}\n}\n`);
      const when = Date.now() / 1000 - ageSeconds;
      fs.utimesSync(file, when, when);
    }

    it('reads the setting of the account that used Steam last, defaulting to 1', () => {
      const home = path.join(root, 'home');
      expect(steamPlayStationSupport(home)).toBeNull();
      steamConfig(home, '111', '\t"SteamController_PSSupport"\t\t"2"', 3600);
      steamConfig(home, '222', '\t"SteamController_PSSupport"\t\t"0"');
      expect(steamPlayStationSupport(home)).toBe('0');
      steamConfig(home, '333', '\t"Other"\t\t"x"', -60);
      expect(steamPlayStationSupport(home)).toBe('1');
    });

    it('warns only when support is Enabled and Steam has the controller', () => {
      const home = path.join(root, 'home');
      process(2299, 'steam', ['hidraw11']);
      steamConfig(home, '1', '\t"SteamController_PSSupport"\t\t"0"');
      expect(steamInputTakesOverController(home, roots)).toBe(false);
      steamConfig(home, '1', '\t"SteamController_PSSupport"\t\t"1"');
      expect(steamInputTakesOverController(home, roots)).toBe(false);
      steamConfig(home, '1', '\t"SteamController_PSSupport"\t\t"2"');
      expect(steamInputTakesOverController(home, roots)).toBe(true);
    });

    it('does not warn when Steam does not have the controller, whatever the setting', () => {
      const home = path.join(root, 'home');
      steamConfig(home, '1', '\t"SteamController_PSSupport"\t\t"2"');
      expect(steamInputTakesOverController(home, roots)).toBe(false);
    });
  });
});
