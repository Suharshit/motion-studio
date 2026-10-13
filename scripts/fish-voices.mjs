// scripts/fish-voices.mjs — find a Fish Audio voice for the project.
//
//   npm run voices -- --search "narrator" [--language en] [--tag male] [--mine] [--n 20]
//   npm run voices -- --sample <voiceId> ["Custom test line"]   → out/voice-samples/<id>.mp3
//
// Put the chosen id in projects/<slug>/vo/script.json → "voice", or FISH_VOICE_ID in .env as the default.
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {listVoices, tts, ROOT} from './lib/fish.mjs';

const argv = process.argv.slice(2);
const opt = (k) => {
  const i = argv.indexOf('--' + k);
  return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
};

if (opt('sample')) {
  const id = opt('sample');
  const i = argv.indexOf('--sample');
  const text = argv[i + 2] && !argv[i + 2].startsWith('--') ? argv[i + 2] : 'Here is a quick read of how this voice sounds over your video. Clear, confident, and on the beat.';
  const dir = join(ROOT, 'out', 'voice-samples');
  mkdirSync(dir, {recursive: true});
  const audio = await tts(text, {voice: id});
  const p = join(dir, `${id}.mp3`);
  writeFileSync(p, audio);
  console.log('sample →', p);
} else {
  const r = await listVoices({search: opt('search'), language: opt('language'), tag: opt('tag'), self: !!opt('mine'), pageSize: Number(opt('n') ?? 20)});
  console.log(`${r.total} voices match. Top ${r.items.length}:\n`);
  for (const v of r.items) {
    console.log(`${v._id}  ${v.title}`);
    console.log(`   ${[(v.languages ?? []).join('/'), (v.tags ?? []).slice(0, 5).join(', '), `${v.task_count} uses`, v.licensed ? 'licensed' : ''].filter(Boolean).join(' · ')}`);
    if (v.description) console.log(`   ${v.description.replace(/\s+/g, ' ').slice(0, 110)}`);
  }
  console.log('\nAudition: npm run voices -- --sample <id>');
}
