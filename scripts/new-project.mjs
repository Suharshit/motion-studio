// scripts/new-project.mjs — scaffold a project from the template, seeded with a vault style.
//
//   npm run new -- <slug> --type product-launch [--style <vault-id>] [--client "Acme"] [--duration 20] [--format 9x16]
//
// Creates projects/<slug>/ with index.html (seek(t) skeleton), style.json (from the vault),
// brief.md, project.json, docs/{style_guide,shotlist,review_log}.md, vo/script.json, cues.json.
import {cpSync, existsSync, readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith('--'));
const opt = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
};
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) (console.error('usage: npm run new -- <kebab-slug> --type <type> [--style <vault-id>]'), process.exit(1));
const dest = join(ROOT, 'projects', slug);
if (existsSync(dest)) (console.error(`projects/${slug} already exists`), process.exit(1));

const router = JSON.parse(readFileSync(join(ROOT, 'prompts/router.json'), 'utf8'));
const type = opt('type', 'showreel');
const t = router.types.find((x) => x.id === type);
if (!t) (console.error(`unknown type "${type}". Types: ${router.types.map((x) => x.id).join(', ')}`), process.exit(1));

const vaultDir = join(ROOT, 'style-vault/styles');
const styleId = opt('style') ?? readdirSync(vaultDir).find((d) => {
  try {
    return JSON.parse(readFileSync(join(vaultDir, d, 'style.json'), 'utf8')).bestFor?.includes(type);
  } catch {
    return false;
  }
}) ?? 'ink-and-signal';
const stylePath = join(vaultDir, styleId, 'style.json');
if (!existsSync(stylePath)) (console.error(`no vault style "${styleId}" — npm run vault -- list`), process.exit(1));

cpSync(join(ROOT, 'templates/project'), dest, {recursive: true});
const style = JSON.parse(readFileSync(stylePath, 'utf8'));
style.derivedFrom = styleId;
writeFileSync(join(dest, 'style.json'), JSON.stringify(style, null, 2));

const duration = Number(opt('duration', 16));
const format = opt('format', t.formats[0]);
const project = {
  slug,
  type,
  client: opt('client', ''),
  created: new Date().toISOString().slice(0, 10),
  engine: t.engine,
  duration,
  formats: [format],
  style: {from: styleId},
  status: 'brief',
  vault: null, // set by `npm run vault -- save|skip` — required before `npm run deliver`
};
writeFileSync(join(dest, 'project.json'), JSON.stringify(project, null, 2));
for (const f of ['brief.md', 'index.html']) {
  const p = join(dest, f);
  writeFileSync(
    p,
    readFileSync(p, 'utf8')
      .replaceAll('{{SLUG}}', slug)
      .replaceAll('{{TYPE}}', type)
      .replaceAll('{{PLAYBOOK}}', t.playbook)
      .replaceAll('{{STYLE}}', styleId)
      .replaceAll('{{DURATION}}', String(duration))
      .replaceAll('{{FORMAT}}', format)
      .replaceAll('{{CLIENT}}', project.client || '—'),
  );
}
console.log(`projects/${slug} created
  type      ${type}  → read ${t.playbook}
  style     ${styleId} (copied to style.json — edit freely; vault it at the end if it becomes its own look)
  engine    ${t.engine} · effort ${t.effort}
  passes    ${t.passes.join(' → ')}
Next: fill brief.md, then npm run preview -- ${slug}`);
