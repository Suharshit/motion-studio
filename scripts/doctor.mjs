// scripts/doctor.mjs — check the studio is ready to render.   npm run doctor
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
const ok = (m) => console.log('  ✓ ' + m);
const no = (m, fix) => (bad++, console.log('  ✗ ' + m + (fix ? `\n      → ${fix}` : '')));
const has = (cmd, args = ['-version']) => spawnSync(cmd, args, {encoding: 'utf8'}).status === 0;

console.log('Runtime');
const nodeMajor = Number(process.versions.node.split('.')[0]);
nodeMajor >= 22 ? ok(`node ${process.versions.node}`) : no(`node ${process.versions.node}`, 'install Node 22+');
has('ffmpeg') ? ok('ffmpeg') : no('ffmpeg missing', 'brew install ffmpeg  |  sudo apt install ffmpeg');
has('ffprobe') ? ok('ffprobe') : no('ffprobe missing', 'comes with ffmpeg');
const filters = spawnSync('ffmpeg', ['-hide_banner', '-filters'], {encoding: 'utf8'}).stdout ?? '';
for (const f of ['tmix', 'loudnorm', 'sidechaincompress', 'tile', 'ssim']) filters.includes(` ${f} `) ? ok(`ffmpeg filter ${f}`) : no(`ffmpeg filter ${f}`, 'use a full ffmpeg build');
const py = spawnSync('python3', ['-c', 'import numpy, librosa, soundfile; print(librosa.__version__)'], {encoding: 'utf8'});
py.status === 0 ? ok(`python librosa ${py.stdout.trim()}`) : no('python numpy/librosa/soundfile (only needed to measure supplied tracks)', 'pip install -r requirements.txt');

console.log('Browser');
try {
  const {chromium} = await import('playwright');
  const b = await chromium.launch({executablePath: process.env.MOTION_BROWSER || undefined});
  ok(`chromium ${b.version()}${process.env.MOTION_BROWSER ? ' (MOTION_BROWSER)' : ''}`);
  await b.close();
} catch (e) {
  no('headless chromium not launchable', 'npx playwright install chromium   (or set MOTION_BROWSER=/path/to/chrome in .env)');
}

console.log('Fish Audio');
const envPath = join(ROOT, '.env');
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const key = process.env.FISH_API_KEY ?? env.match(/^FISH_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key || key.startsWith('your_')) no('FISH_API_KEY not set', 'cp .env.example .env and paste your key');
else {
  try {
    const r = await fetch('https://api.fish.audio/model?page_size=1&self=true', {headers: {Authorization: `Bearer ${key}`}});
    r.ok ? ok('FISH_API_KEY valid') : no(`FISH_API_KEY rejected (${r.status})`, 'check the key at fish.audio');
  } catch {
    no('api.fish.audio unreachable', 'check network');
  }
  const voice = process.env.FISH_VOICE_ID ?? env.match(/^FISH_VOICE_ID=(.*)$/m)?.[1]?.trim();
  voice ? ok(`default voice ${voice}`) : console.log('  · FISH_VOICE_ID empty (fine — set a voice per project in vo/script.json; find one with npm run voices)');
}

console.log('Studio');
existsSync(join(ROOT, 'style-vault/INDEX.md')) ? ok('style vault') : no('style-vault/INDEX.md missing', 'npm run vault -- index');
existsSync(join(ROOT, '.claude/skills/motion-studio/SKILL.md')) ? ok('Claude Code skills') : no('skills missing');
console.log(bad ? `\n${bad} issue(s).` : '\nAll good. Start Claude Code here and say: /new-video');
process.exit(bad ? 1 : 0);
