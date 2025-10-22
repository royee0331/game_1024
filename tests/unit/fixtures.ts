import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GameState } from '@core/types';

interface FixtureFile {
  state: GameState;
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadFixture(name: string): GameState {
  const filePath = path.resolve(dirname, '../fixtures', `${name}.json`);
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as FixtureFile;
  return parsed.state;
}
