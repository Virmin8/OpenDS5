import { afterEach, describe, expect, it } from 'vitest';
import { vdsdBackendActive } from './vdsd-backend';

describe('vdsdBackendActive', () => {
  const original = process.env.OPENDS5_VDSD;
  afterEach(() => {
    if (original === undefined) {
      delete process.env.OPENDS5_VDSD;
    } else {
      process.env.OPENDS5_VDSD = original;
    }
  });

  it('uses vdsd on Linux and never on other non-Windows platforms', () => {
    delete process.env.OPENDS5_VDSD;
    expect(vdsdBackendActive('linux')).toBe(true);
    expect(vdsdBackendActive('darwin')).toBe(false);
  });

  it('follows OPENDS5_VDSD when it is set', () => {
    process.env.OPENDS5_VDSD = '0';
    expect(vdsdBackendActive('linux')).toBe(false);
    process.env.OPENDS5_VDSD = '1';
    expect(vdsdBackendActive('win32')).toBe(true);
  });
});
