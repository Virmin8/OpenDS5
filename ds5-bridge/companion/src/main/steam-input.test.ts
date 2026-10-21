import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { steamHasVirtualController } from './steam-input';

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
});
