// scripts/route.mjs — decide which playbook(s) a brief needs, and which vault styles fit.
//
//   npm run route -- "30s vertical launch video for acme.com with a voiceover, in the style of ./refs/x.mp4"
//   npm run route -- --file projects/<slug>/brief.md
//
// Output: ranked video types → playbook, engine, effort, passes; triggered modifiers; matching vault styles.
// Claude still reads prompts/ROUTER.md and makes the final call — this is a fast, explainable first pass.
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const fi = argv.indexOf('--file');
const brief = (fi >= 0 ? readFileSync(argv[fi + 1], 'utf8') : argv.filter((a) => !a.startsWith('--')).join(' ')).toLowerCase();
if (!brief.trim()) (console.error('usage: npm run route -- "<brief text>"  |  --file brief.md'), process.exit(1));
const json = argv.includes('--json');

const R = JSON.parse(readFileSync(join(ROOT, 'prompts/router.json'), 'utf8'));
const hit = (kw) => {
  const k = kw.toLowerCase();
  return /^[\w ]+$/.test(k) ? new RegExp(`\\b${k.replace(/ /g, '\\s+')}\\b`).test(brief) : brief.includes(k);
};
const score = (t) => {
  const found = t.keywords.filter(hit);
  return {found, s: found.reduce((a, k) => a + (k.includes(' ') ? 2 : 1), 0)};
};

const hasUrl = /https?:\/\/|\b[\w-]+\.(com|io|ai|app|co|dev|so|xyz|in|net|org)\b/.test(brief);
const types = R.types
  .map((t) => {
    const r = score(t);
    // a product URL is the strongest product signal
    if (hasUrl && (t.id === 'product-launch' || t.id === 'mascot-explainer')) {
      r.s += t.id === 'product-launch' ? 2 : 1;
      r.found.push('url');
    }
    return {...t, ...r};
  })
  .sort((a, b) => b.s - a.s);
const top = types.filter((t) => t.s > 0).slice(0, 3);
const mods = R.modifiers.map((m) => ({...m, ...score(m)})).filter((m) => m.s > 0);

// Vault styles whose bestFor / tags / mood overlap the brief or the chosen type
const vaultDir = join(ROOT, 'style-vault/styles');
const styles = existsSync(vaultDir)
  ? readdirSync(vaultDir)
      .filter((d) => existsSync(join(vaultDir, d, 'style.json')))
      .map((d) => JSON.parse(readFileSync(join(vaultDir, d, 'style.json'), 'utf8')))
  : [];
const chosen = top[0]?.id;
const styleHits = styles
  .map((s) => {
    const words = [...(s.tags ?? []), ...(s.mood ?? [])];
    const w = words.filter((x) => brief.includes(x.toLowerCase())).length;
    const b = (s.bestFor ?? []).includes(chosen) ? 2 : 0;
    return {id: s.id, name: s.name, score: w + b, why: [b ? `bestFor ${chosen}` : '', ...words.filter((x) => brief.includes(x.toLowerCase()))].filter(Boolean)};
  })
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 4);

if (json) {
  console.log(JSON.stringify({types: top, modifiers: mods, styles: styleHits}, null, 2));
  process.exit(0);
}

if (!top.length) {
  console.log('No type matched clearly. Read prompts/ROUTER.md and ask the client one question: "Is this about showing a product, telling a story, or showing craft?"');
} else {
  console.log('VIDEO TYPE');
  top.forEach((t, i) => {
    console.log(`${i === 0 ? '→' : ' '} ${t.id.padEnd(17)} score ${t.s}  (${t.found.join(', ')})`);
    if (i === 0) {
      console.log(`    playbook  ${t.playbook}`);
      console.log(`    engine    ${t.engine}`);
      console.log(`    effort    ${t.effort}`);
      console.log(`    duration  ${t.duration} · formats ${t.formats.join(', ')}`);
      console.log(`    passes    ${t.passes.join(' → ')}   (? = only if needed)`);
    }
  });
}
if (mods.length) {
  console.log('\nMODIFIERS');
  for (const m of mods) console.log(`  + ${m.id.padEnd(15)} ${m.playbook}  — ${m.note}`);
}
console.log('\nSTYLE VAULT');
if (styleHits.length) for (const s of styleHits) console.log(`  ${s.id.padEnd(26)} ${s.name}  (${s.why.join(', ')})`);
else console.log(`  no close match in ${styles.length} saved styles — this project may produce a NEW style worth vaulting.`);
console.log('\nAlways also: CLAUDE.md house rules · prompts/passes/critique-pass.md · prompts/passes/delivery-and-vault.md');
