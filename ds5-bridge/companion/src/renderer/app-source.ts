import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rendererDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * The main window's source for tests that check its text: App.tsx plus the
 * modules split out of it (app/ and tabs/).
 */
export function readAppSource(): string {
  const files = [path.join(rendererDir, 'App.tsx')];
  for (const dir of ['app', 'tabs']) {
    let names: string[] = [];
    try {
      names = readdirSync(path.join(rendererDir, dir));
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(path.join(rendererDir, dir, name));
    }
  }
  return files.map((file) => readFileSync(file, 'utf8')).join('\n');
}
