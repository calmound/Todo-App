import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ICON_DIR = path.resolve('src-tauri/icons');
const ICON_SVG = path.join(ICON_DIR, 'icon.svg');
const ICON_PNG = path.join(ICON_DIR, 'icon.png');
const ICON_ICNS = path.join(ICON_DIR, 'icon.icns');

function statMtimeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}

fs.mkdirSync(ICON_DIR, { recursive: true });

const input = fs.existsSync(ICON_SVG) ? ICON_SVG : fs.existsSync(ICON_PNG) ? ICON_PNG : null;
if (!input) {
  console.warn('[tauri] no icon source found, expected src-tauri/icons/icon.svg (preferred) or icon.png');
  process.exit(0);
}

const inputMtime = statMtimeMs(input);
const icnsMtime = statMtimeMs(ICON_ICNS);

// Regenerate only when needed to keep dev fast. Force with `FORCE_TAURI_ICON=1`.
const shouldGenerate =
  process.env.FORCE_TAURI_ICON === '1' || icnsMtime === null || (inputMtime !== null && icnsMtime < inputMtime);

if (!shouldGenerate) {
  console.log('[tauri] icons up-to-date');
  process.exit(0);
}

console.log(`[tauri] generating icons from ${path.relative(process.cwd(), input)}`);
execSync(`npx tauri icon "${input}" -o "${ICON_DIR}"`, { stdio: 'inherit' });
