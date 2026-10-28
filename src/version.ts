import { readFileSync } from 'node:fs';
import path from 'node:path';

// The installed package's version, found by walking up from this module.
// Works both in dev (src/) and from the published package (dist/src/).
export function readVersion(): string {
  let dir = path.dirname(new URL(import.meta.url).pathname);
  for (let i = 0; i < 4; i++) {
    try {
      return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
    } catch {
      dir = path.dirname(dir);
    }
  }
  return 'unknown';
}
