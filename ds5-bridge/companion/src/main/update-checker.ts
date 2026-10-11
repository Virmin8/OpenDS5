export type ReleaseAsset = { name: string; url: string; size: number };

export type Release = {
  version: string;
  notes: string;
  draft: boolean;
  prerelease: boolean;
  assets: ReleaseAsset[];
};

export type UpdateDecision =
  | { kind: 'none' }
  /** asset: the AppImage on Linux, the setup .exe on Windows. */
  | { kind: 'offer'; version: string; notes: string; asset: ReleaseAsset; sha256: ReleaseAsset };

/** The release file this platform updates from. */
export function isUpdateAsset(name: string, platform: NodeJS.Platform): boolean {
  return platform === 'win32'
    ? /^OpenDS5-Companion-Setup-.+\.exe$/i.test(name)
    : name.endsWith('.AppImage');
}

function parts(version: string): { numbers: number[]; prerelease: string | null } {
  const [core, prerelease = null] = version.replace(/^v/, '').split('-', 2);
  const numbers = core.split('.').map((n) => Number.parseInt(n, 10) || 0);
  while (numbers.length < 3) numbers.push(0);
  return { numbers, prerelease };
}

export function compareVersions(a: string, b: string): number {
  const left = parts(a);
  const right = parts(b);
  for (let i = 0; i < 3; i += 1) {
    if (left.numbers[i] !== right.numbers[i]) return left.numbers[i] - right.numbers[i];
  }
  // Equal cores: a prerelease ranks below the release it leads to (1.8.0-beta.1 < 1.8.0).
  if (left.prerelease === right.prerelease) return 0;
  if (left.prerelease === null) return 1;
  if (right.prerelease === null) return -1;
  return left.prerelease < right.prerelease ? -1 : 1;
}

export function decideUpdate(input: {
  release: Release | null;
  currentVersion: string;
  skippedVersions: readonly string[];
  platform?: NodeJS.Platform;
}): UpdateDecision {
  const { release, currentVersion, skippedVersions, platform = 'linux' } = input;
  if (!release) return { kind: 'none' };
  if (release.draft || release.prerelease) return { kind: 'none' };
  if (skippedVersions.includes(release.version)) return { kind: 'none' };
  if (compareVersions(release.version, currentVersion) <= 0) return { kind: 'none' };

  const asset = release.assets.find((a) => isUpdateAsset(a.name, platform));
  const sha256 = asset && release.assets.find((a) => a.name === `${asset.name}.sha256`);
  if (!asset || !sha256) return { kind: 'none' };

  return { kind: 'offer', version: release.version, notes: release.notes, asset, sha256 };
}
