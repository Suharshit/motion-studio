// scripts/vault.mjs — the studio's personal styling vault.
//
//   npm run vault -- list
//   npm run vault -- show <id>
//   npm run vault -- suggest <type> ["keywords"]         best styles for a video type
//   npm run vault -- similar <slug>                      is this project's style new? (0–1 similarity to every vault style)
//   npm run vault -- apply <id> <slug>                   copy a vault style into a project's style.json
//   npm run vault -- save <slug> --id <kebab> --name "Name" --tags "a,b" --mood "x,y" --best-for "type1,type2" [--lesson "..."]
//   npm run vault -- save <slug> --update <existing-id> [--lesson "..."]     refine an existing style (old version kept)
//   npm run vault -- skip <slug> --reason "near-duplicate of X, nothing new"
//   npm run vault -- index                               rebuild style-vault/INDEX.md
//
// Every saved style = style-vault/styles/<id>/{style.json, guide.md, signature.md, poster.png, contact.png}
import {existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, appendFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = join(ROOT, 'style-vault');
const STYLES = join(VAULT, 'styles');
const argv = process.argv.slice(2);
const [cmd, ...rest] = argv;
const pos = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--') && !rest[i - 1].includes('=')));
const opt = (k) => {
  const i = rest.indexOf('--' + k);
  return i < 0 ? undefined : rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true;
};
const list = (s) => (s ? String(s).split(',').map((x) => x.trim()).filter(Boolean) : []);
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const all = () =>
  existsSync(STYLES)
    ? readdirSync(STYLES)
        .filter((d) => existsSync(join(STYLES, d, 'style.json')))
        .map((d) => readJSON(join(STYLES, d, 'style.json')))
    : [];

// ---------------------------------------------------------------- similarity
const hexToRgb = (h) => {
  const m = String(h).replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  return m ? m.slice(1).map((x) => parseInt(x, 16)) : null;
};
// perceptual-ish distance (redmean), normalized 0..1
const colorDist = (a, b) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  if (!A || !B) return 1;
  const r = (A[0] + B[0]) / 2, dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2];
  return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db) / 765;
};
function paletteSim(p, q) {
  const keys = ['bg', 'surface', 'primary', 'secondary', 'accent', 'text'];
  const P = keys.map((k) => p?.[k]).filter(Boolean), Q = keys.map((k) => q?.[k]).filter(Boolean);
  if (!P.length || !Q.length) return 0;
  // role-matched (bg vs bg, accent vs accent) blended with nearest-color matching
  const role = keys.filter((k) => p?.[k] && q?.[k]).map((k) => 1 - colorDist(p[k], q[k]));
  const near = P.map((c) => 1 - Math.min(...Q.map((d) => colorDist(c, d))));
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  return 0.6 * avg(role) + 0.4 * avg(near);
}
export function similarity(a, b) {
  const parts = {
    palette: paletteSim(a.colors, b.colors),
    display: a.typography?.display?.family === b.typography?.display?.family ? 1 : 0,
    body: a.typography?.body?.family === b.typography?.body?.family ? 1 : 0,
    weightCase: (a.typography?.display?.case ?? 'none') === (b.typography?.display?.case ?? 'none') && Math.abs((a.typography?.display?.weight ?? 400) - (b.typography?.display?.weight ?? 400)) <= 100 ? 1 : 0,
    pace: a.motion?.pace === b.motion?.pace ? 1 : 0,
    reveal: a.motion?.textReveal === b.motion?.textReveal ? 1 : 0,
    transition: a.motion?.transition === b.motion?.transition ? 1 : 0,
    background: a.texture?.background === b.texture?.background ? 1 : 0,
    grain: 1 - Math.min(1, Math.abs((a.texture?.grain ?? 0) - (b.texture?.grain ?? 0)) * 5),
  };
  const w = {palette: 0.4, display: 0.15, body: 0.07, weightCase: 0.05, pace: 0.08, reveal: 0.08, transition: 0.05, background: 0.07, grain: 0.05};
  const score = Object.entries(w).reduce((s, [k, x]) => s + x * parts[k], 0);
  return {score: +score.toFixed(3), parts};
}

// ---------------------------------------------------------------- index
function rebuildIndex() {
  const styles = all().sort((a, b) => (a.source?.date ?? '').localeCompare(b.source?.date ?? '') || a.id.localeCompare(b.id));
  const rows = styles.map((s) => {
    const sw = ['bg', 'primary', 'accent', 'text'].map((k) => s.colors?.[k]).filter(Boolean).map((c) => `\`${c}\``).join(' ');
    const type = `${s.typography?.display?.family ?? '?'} / ${s.typography?.body?.family ?? '?'}`;
    return `| [${s.id}](styles/${s.id}/) | ${s.name} | ${(s.bestFor ?? []).join(', ')} | ${(s.mood ?? []).join(', ')} | ${type} | ${s.motion?.pace ?? ''} · ${s.motion?.textReveal ?? ''} | ${sw} | ${s.source?.project ?? 'seed'} |`;
  });
  const md = `# Style vault index

${styles.length} styles. Auto-generated by \`npm run vault -- index\` (runs on every save). Don't edit by hand.

Pick a style: \`npm run vault -- suggest <type> "keywords"\` · use it: \`npm run new -- <slug> --type <type> --style <id>\` or \`npm run vault -- apply <id> <slug>\`.

| id | name | best for | mood | display / body | motion | palette | from |
|---|---|---|---|---|---|---|---|
${rows.join('\n')}
`;
  writeFileSync(join(VAULT, 'INDEX.md'), md);
  return styles.length;
}

// ---------------------------------------------------------------- commands
const projectDir = (slug) => {
  const d = join(ROOT, 'projects', slug);
  if (!existsSync(join(d, 'style.json'))) (console.error(`projects/${slug}/style.json not found`), process.exit(1));
  return d;
};
const setVaultDecision = (dir, decision) => {
  const p = join(dir, 'project.json');
  const pj = existsSync(p) ? readJSON(p) : {};
  pj.vault = {...decision, date: new Date().toISOString().slice(0, 10)};
  writeFileSync(p, JSON.stringify(pj, null, 2));
};

switch (cmd) {
  case 'list': {
    for (const s of all()) console.log(`${s.id.padEnd(28)} ${s.name.padEnd(26)} ${(s.bestFor ?? []).join(', ')}`);
    break;
  }
  case 'show': {
    const id = pos[0];
    const d = join(STYLES, id ?? '');
    if (!id || !existsSync(d)) (console.error('usage: vault show <id>'), process.exit(1));
    console.log(readFileSync(join(d, 'style.json'), 'utf8'));
    for (const f of ['signature.md', 'guide.md']) if (existsSync(join(d, f))) console.log(`\n---- ${f} ----\n` + readFileSync(join(d, f), 'utf8'));
    break;
  }
  case 'suggest': {
    const [type, kw = ''] = pos;
    const words = kw.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const ranked = all()
      .map((s) => {
        const tagHits = [...(s.tags ?? []), ...(s.mood ?? [])].filter((x) => words.some((w) => x.toLowerCase().includes(w))).length;
        return {s, score: ((s.bestFor ?? []).includes(type) ? 3 : 0) + tagHits};
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    for (const {s, score} of ranked) console.log(`${String(score).padStart(2)}  ${s.id.padEnd(28)} ${s.name} — ${s.description ?? ''}`);
    break;
  }
  case 'similar': {
    const dir = projectDir(pos[0]);
    const mine = readJSON(join(dir, 'style.json'));
    const res = all()
      .filter((s) => s.id !== mine.id || mine.derivedFrom)
      .map((s) => ({id: s.id, ...similarity(mine, s)}))
      .sort((a, b) => b.score - a.score);
    for (const r of res.slice(0, 6)) {
      const p = r.parts;
      console.log(`${r.score.toFixed(2)}  ${r.id.padEnd(28)} palette ${p.palette.toFixed(2)} · display ${p.display} · body ${p.body} · pace ${p.pace} · reveal ${p.reveal} · bg ${p.background}`);
    }
    const top = res[0];
    console.log(
      !top || top.score < 0.8
        ? `\n→ UNIQUE (closest ${top ? top.score.toFixed(2) : 'n/a'}). Save it: npm run vault -- save ${pos[0]} --id <kebab> --name "…" --tags "…" --mood "…" --best-for "…"`
        : `\n→ NEAR-DUPLICATE of ${top.id} (${top.score.toFixed(2)}). Either refine it: npm run vault -- save ${pos[0]} --update ${top.id}  or: npm run vault -- skip ${pos[0]} --reason "…"`,
    );
    break;
  }
  case 'apply': {
    const [id, slug] = pos;
    const src = join(STYLES, id ?? '', 'style.json');
    if (!id || !slug || !existsSync(src)) (console.error('usage: vault apply <id> <slug>'), process.exit(1));
    const dir = join(ROOT, 'projects', slug);
    const s = readJSON(src);
    s.derivedFrom = id;
    writeFileSync(join(dir, 'style.json'), JSON.stringify(s, null, 2));
    console.log(`applied ${id} → projects/${slug}/style.json`);
    break;
  }
  case 'save': {
    const slug = pos[0];
    const dir = projectDir(slug);
    const style = readJSON(join(dir, 'style.json'));
    const pj = existsSync(join(dir, 'project.json')) ? readJSON(join(dir, 'project.json')) : {};
    const updateId = opt('update');
    const id = updateId ?? opt('id');
    if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) (console.error('save needs --id <kebab-case> (or --update <existing-id>)'), process.exit(1));
    const dest = join(STYLES, id);
    if (!updateId && existsSync(dest)) (console.error(`vault style "${id}" exists — pick another --id or use --update ${id}`), process.exit(1));
    mkdirSync(dest, {recursive: true});
    let prev = null;
    if (updateId) {
      if (!existsSync(join(dest, 'style.json'))) (console.error(`no vault style "${updateId}"`), process.exit(1));
      prev = readJSON(join(dest, 'style.json'));
      const v = (prev.version ?? 1);
      copyFileSync(join(dest, 'style.json'), join(dest, `style.v${v}.json`));
    }
    const today = new Date().toISOString().slice(0, 10);
    const out = {
      ...style,
      id,
      name: opt('name') ?? prev?.name ?? style.name ?? id,
      description: opt('description') ?? style.description ?? prev?.description ?? '',
      tags: [...new Set([...(prev?.tags ?? []), ...list(opt('tags')), ...(updateId ? [] : style.tags ?? [])])],
      mood: [...new Set([...(prev?.mood ?? []), ...list(opt('mood'))])],
      bestFor: [...new Set([...(prev?.bestFor ?? []), ...list(opt('best-for')), pj.type].filter(Boolean))],
      source: {project: slug, type: pj.type ?? null, date: today},
      version: (prev?.version ?? 0) + 1,
      history: [...(prev?.history ?? []), {version: (prev?.version ?? 0) + 1, project: slug, date: today, note: opt('lesson') ?? (updateId ? 'refined' : 'created')}],
    };
    delete out.derivedFrom;
    if (style.derivedFrom && style.derivedFrom !== id) out.remixOf = style.derivedFrom;
    writeFileSync(join(dest, 'style.json'), JSON.stringify(out, null, 2));

    // guide + thumbnails
    const guideSrc = join(dir, 'docs', 'style_guide.md');
    if (existsSync(guideSrc)) copyFileSync(guideSrc, join(dest, updateId ? `guide.${slug}.md` : 'guide.md'));
    const outDir = join(ROOT, 'out', slug);
    const pick = (re) => (existsSync(outDir) ? readdirSync(outDir).filter((f) => re.test(f)).sort()[0] : null);
    const poster = pick(/^poster_.*\.png$/), contact = pick(/^(qa_)?contact_.*\.png$/);
    if (poster) copyFileSync(join(outDir, poster), join(dest, updateId ? `poster.${slug}.png` : 'poster.png'));
    if (contact) copyFileSync(join(outDir, contact), join(dest, updateId ? `contact.${slug}.png` : 'contact.png'));

    const sig = join(dest, 'signature.md');
    if (!existsSync(sig)) {
      writeFileSync(
        sig,
        `# ${out.name} — signature

> Fill this in now, while the project is fresh. A style without its signature moves is just a palette.

**Born in:** ${slug} (${pj.type ?? 'unknown type'}), ${today}${out.remixOf ? ` · remix of \`${out.remixOf}\`` : ''}

## The look in one line
TODO

## Signature moves (3–5) — with the code that makes them
1. TODO — name, when it fires, and the snippet from projects/${slug}/index.html
2. TODO
3. TODO

## Composition rules
- TODO (grid, where type sits, how much air, what never goes in corners)

## What the critique loop taught us
- TODO (problems that came up and the fix that worked)

## Don't
- TODO

## Pairs well with
- Music: ${out.audio?.musicMood ?? 'TODO'}
- Voice: ${out.audio?.voiceDirection ?? 'TODO'}
`,
      );
    } else if (updateId) {
      appendFileSync(sig, `\n## Update v${out.version} — ${slug}, ${today}\n- ${opt('lesson') ?? 'TODO: what changed and why'}\n`);
    }
    if (opt('lesson')) appendFileSync(join(VAULT, 'LEARNINGS.md'), `- ${today} · ${slug} → \`${id}\`: ${opt('lesson')}\n`);
    setVaultDecision(dir, {decision: updateId ? 'updated' : 'saved', id});
    const n = rebuildIndex();
    console.log(`${updateId ? 'updated' : 'saved'} style-vault/styles/${id} (v${out.version}) · vault has ${n} styles`);
    console.log(`→ now fill in style-vault/styles/${id}/signature.md (signature moves + snippets + lessons)`);
    break;
  }
  case 'skip': {
    const slug = pos[0];
    const reason = opt('reason');
    if (!slug || !reason || reason === true) (console.error('usage: vault skip <slug> --reason "why this look is not new"'), process.exit(1));
    setVaultDecision(projectDir(slug), {decision: 'skipped', reason});
    if (opt('lesson')) appendFileSync(join(VAULT, 'LEARNINGS.md'), `- ${new Date().toISOString().slice(0, 10)} · ${slug}: ${opt('lesson')}\n`);
    console.log(`recorded: ${slug} not vaulted — ${reason}`);
    break;
  }
  case 'index': {
    console.log(`INDEX.md rebuilt (${rebuildIndex()} styles)`);
    break;
  }
  default:
    console.log('commands: list · show <id> · suggest <type> "kw" · similar <slug> · apply <id> <slug> · save <slug> --id … · save <slug> --update <id> · skip <slug> --reason … · index');
}
