import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function walk(root: string, dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(root, full, out);
    else if (entry.isFile()) out.push(path.relative(root, full));
  }
}

/**
 * Kept from the DKMS era (bundles before SOURCE_HASH shipped the module source):
 * dkms.conf's PACKAGE_VERSION was stamped from package.json on every release,
 * so it is flattened to a constant; every other line still counts.
 */
function contentsFor(root: string, relative: string): Buffer {
  const raw = fs.readFileSync(path.join(root, relative));
  if (path.basename(relative) !== 'dkms.conf') return raw;
  return Buffer.from(
    raw.toString('utf8').replace(/^PACKAGE_VERSION=.*$/m, 'PACKAGE_VERSION="__hashed__"'),
    'utf8'
  );
}

/**
 * The rebuild/reinstall gate's view of the bundled driver (resources/vds-bin).
 * collect-vds-bin.sh writes SOURCE_HASH, a hash of the vds sources: the vdsd
 * binary itself embeds the release version and so differs on every release,
 * which would prompt for a password on UI-only updates. Without that file
 * (older bundles), fall back to hashing the tree.
 */
export function driverBundleHash(root: string): string {
  try {
    const stamp = path.join(root, 'SOURCE_HASH');
    if (fs.existsSync(stamp)) {
      const value = fs.readFileSync(stamp, 'utf8').trim();
      if (value.length > 0) return value;
    }
  } catch {
    /* fall through to the tree hash */
  }
  return moduleSourceHash(root);
}

export function moduleSourceHash(root: string): string {
  try {
    if (!fs.existsSync(root)) return '';
    const files: string[] = [];
    walk(root, root, files);
    files.sort();
    if (files.length === 0) return '';

    const hash = createHash('sha256');
    for (const relative of files) {
      const contents = contentsFor(root, relative);
      // Hash the path as well as the bytes, so a pure rename is still a change,
      // and frame the byte length so a path can never be confused for content
      // ({a: "AAA", b: "BBB"} must not collide with {a: "AAAb\0BBB"}).
      hash.update(relative);
      hash.update('\0');
      hash.update(String(contents.length));
      hash.update('\0');
      hash.update(contents);
    }
    return hash.digest('hex');
  } catch {
    // The contract is "a hash, or '' meaning stay inert" -- never throw into launch.
    return '';
  }
}
