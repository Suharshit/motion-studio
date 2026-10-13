// scripts/lib/fish.mjs — minimal Fish Audio client (TTS, STT, voice library). No SDK needed.
// Docs: https://docs.fish.audio  ·  key lives in .env as FISH_API_KEY (never in prompts or code).
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = join(fileURLToPath(import.meta.url), '../../..');
const API = 'https://api.fish.audio';

// Load .env without a dependency (process env wins over the file).
export function loadEnv() {
  const p = join(ROOT, '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

// Clean one-line errors for CLI use (missing key, 401/402, network) instead of a stack trace.
for (const ev of ['uncaughtException', 'unhandledRejection']) {
  process.on(ev, (e) => {
    console.error('✗ ' + (e?.message ?? e));
    process.exit(1);
  });
}

export function key() {
  const k = process.env.FISH_API_KEY;
  if (!k || k.startsWith('your_')) {
    throw new Error('FISH_API_KEY missing. Copy .env.example to .env and paste your Fish Audio key (https://fish.audio/app/api-keys).');
  }
  return k;
}

async function call(path, init, {retries = 4} = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + path, init);
    if (res.ok) return res;
    const body = await res.text().catch(() => '');
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= retries) {
      const hint =
        res.status === 401 ? ' (check FISH_API_KEY)' : res.status === 402 ? ' (out of Fish Audio credit — top up, or set FISH_TTS_MODEL=s2.1-pro-free)' : '';
      throw new Error(`Fish Audio ${path} → ${res.status}${hint}: ${body.slice(0, 300)}`);
    }
    await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
  }
}

/**
 * Text → speech. Returns a Buffer of audio.
 * opts: {voice, model, format, speed, volume, temperature, topP, latency, sampleRate, pronunciations}
 * Multi-speaker (S2 family / drama-3-preview): voice = [idA, idB] and text uses <|speaker:0|> tags.
 */
export async function tts(text, opts = {}) {
  const model = opts.model ?? process.env.FISH_TTS_MODEL ?? 's2.1-pro';
  const voice = opts.voice ?? process.env.FISH_VOICE_ID ?? null;
  const body = {
    text,
    reference_id: voice || null,
    format: opts.format ?? 'mp3',
    mp3_bitrate: 192,
    sample_rate: opts.sampleRate ?? 44100,
    normalize: true,
    latency: opts.latency ?? 'normal',
    temperature: opts.temperature ?? 0.7,
    top_p: opts.topP ?? 0.7,
    chunk_length: 300,
    condition_on_previous_chunks: true,
    prosody: {speed: opts.speed ?? 1, volume: opts.volume ?? 0, normalize_loudness: true},
  };
  if (opts.pronunciations && Object.keys(opts.pronunciations).length) {
    body.pronunciation_dictionary = [{items: Object.entries(opts.pronunciations).map(([key, value]) => ({key, value}))}];
  }
  const res = await call('/v1/tts', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', model},
    body: JSON.stringify(body),
  });
  return Buffer.from(await res.arrayBuffer());
}

/** Speech → text with word-level timestamps. Returns {text, duration, segments:[{text,start,end}], ...}. */
export async function stt(audioBuffer, {filename = 'audio.mp3', language, model} = {}) {
  const fd = new FormData();
  fd.append('audio', new Blob([audioBuffer]), filename);
  fd.append('ignore_timestamps', 'false');
  if (language) fd.append('language', language);
  const res = await call('/v1/asr', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key()}`, model: model ?? process.env.FISH_STT_MODEL ?? 'transcribe-1-pro'},
    body: fd,
  });
  return res.json();
}

/** Search the voice library. */
export async function listVoices({search, language, tag, self = false, pageSize = 20, page = 1, sortBy = 'score'} = {}) {
  const q = new URLSearchParams({page_size: String(pageSize), page_number: String(page), sort_by: sortBy, self: String(self)});
  if (search) q.set('title', search);
  if (language) q.set('language', language);
  if (tag) q.set('tag', tag);
  const res = await call(`/model?${q}`, {headers: {Authorization: `Bearer ${key()}`}});
  return res.json();
}

export async function getVoice(id) {
  const res = await call(`/model/${id}`, {headers: {Authorization: `Bearer ${key()}`}});
  return res.json();
}
