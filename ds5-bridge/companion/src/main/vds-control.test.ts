import { describe, expect, it } from 'vitest';
import { vdsSocketAccessHint } from './vds-control';

describe('vdsSocketAccessHint', () => {
  const groupFile = 'wheel:x:998:alice\nvds:x:951:alice,bob\n';

  it('asks for a new login when the user joined vds after this session started', () => {
    expect(vdsSocketAccessHint(groupFile, 'alice', [1000, 998])).toContain('Log out and back in');
  });

  it('asks to add the user when they are not in vds', () => {
    expect(vdsSocketAccessHint(groupFile, 'carol', [1000])).toContain('sudo usermod -aG vds');
  });

  it('asks to add the user when the vds group does not exist', () => {
    expect(vdsSocketAccessHint('wheel:x:998:alice\n', 'alice', [1000])).toContain('sudo usermod -aG vds');
  });
});
