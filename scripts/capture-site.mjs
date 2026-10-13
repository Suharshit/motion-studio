// scripts/capture-site.mjs — gather a client's real product assets from their public site.
//
//   npm run capture -- <slug> https://product.com [--pages /features,/pricing] [--mobile]
//
// Writes projects/<slug>/assets/capture/:
//   <page>_viewport@2x.png, <page>_full@2x.png   real screenshots (crop these; never redraw the UI)
//   logo_*.{svg,png,…}                            logo candidates (img/svg/icons)
//   site.json                                     dominant colors (by painted area), fonts (by text volume), title, description
// Public pages only. Never logs in or fills forms.
import {chromium} from 'playwright';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const [slug, url] = argv.filter((a) => !a.startsWith('--'));
const opt = (k) => {
  const i = argv.indexOf('--' + k);
  return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
};
if (!slug || !url) (console.error('usage: npm run capture -- <slug> <url> [--pages /a,/b] [--mobile]'), process.exit(1));

const dir = join(ROOT, 'projects', slug, 'assets', 'capture');
mkdirSync(dir, {recursive: true});
const mobile = !!opt('mobile');
const browser = await chromium.launch({executablePath: process.env.MOTION_BROWSER || undefined});
const ctx = await browser.newContext({
  viewport: mobile ? {width: 390, height: 844} : {width: 1440, height: 900},
  deviceScaleFactor: 2,
  isMobile: mobile,
  hasTouch: mobile,
});
const page = await ctx.newPage();
const pages = ['/', ...(opt('pages') ? String(opt('pages')).split(',') : [])];
const base = new URL(url);
const report = {url, captured: [], logos: [], colors: [], fonts: [], title: '', description: ''};

for (const p of pages) {
  const u = new URL(p, base).href;
  const name = (p === '/' ? 'home' : p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')) + (mobile ? '_mobile' : '');
  try {
    await page.goto(u, {waitUntil: 'networkidle', timeout: 45000});
  } catch {
    await page.goto(u, {waitUntil: 'load', timeout: 45000}).catch(() => {});
  }
  await page.waitForTimeout(1200); // let entrance animations settle
  // politely dismiss common cookie banners by hiding them (no clicks on consent)
  await page.addStyleTag({content: '[id*=cookie],[class*=cookie],[id*=consent],[class*=consent]{display:none!important}'}).catch(() => {});
  await page.screenshot({path: join(dir, `${name}_viewport@2x.png`)});
  await page.screenshot({path: join(dir, `${name}_full@2x.png`), fullPage: true}).catch(() => {});
  report.captured.push(name);

  if (p === '/') {
    const info = await page.evaluate(() => {
      const area = new Map(), fonts = new Map();
      const toHex = (c) => {
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
        if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) return null;
        return '#' + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('');
      };
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight * 3) continue;
        const cs = getComputedStyle(el);
        const bg = toHex(cs.backgroundColor);
        if (bg) area.set(bg, (area.get(bg) ?? 0) + r.width * r.height);
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
        if (own) {
          const fg = toHex(cs.color);
          if (fg) area.set(fg, (area.get(fg) ?? 0) + own.length * 40);
          const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
          const key = `${fam}|${cs.fontWeight}`;
          fonts.set(key, (fonts.get(key) ?? 0) + own.length);
        }
      }
      const body = toHex(getComputedStyle(document.body).backgroundColor) ?? '#ffffff';
      const logos = [];
      for (const img of document.querySelectorAll('img, svg')) {
        const s = (img.getAttribute('alt') ?? '') + ' ' + (img.getAttribute('class') ?? '') + ' ' + (img.getAttribute('src') ?? '') + ' ' + (img.closest('a')?.getAttribute('href') === '/' ? 'home-link' : '');
        if (/logo|brand|home-link/i.test(s)) {
          if (img.tagName.toLowerCase() === 'svg') logos.push({type: 'svg', markup: img.outerHTML});
          else logos.push({type: 'img', src: img.currentSrc || img.src});
        }
      }
      for (const l of document.querySelectorAll('link[rel*=icon]')) logos.push({type: 'icon', src: l.href});
      return {
        colors: [...area.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([hex, a]) => ({hex, weight: Math.round(a)})),
        fonts: [...fonts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({family: k.split('|')[0], weight: Number(k.split('|')[1]), chars: n})),
        body,
        logos: logos.slice(0, 12),
        title: document.title,
        description: document.querySelector('meta[name=description]')?.content ?? '',
      };
    });
    Object.assign(report, {colors: info.colors, fonts: info.fonts, bodyBackground: info.body, title: info.title, description: info.description});
    let i = 0;
    for (const l of info.logos) {
      try {
        if (l.type === 'svg') {
          const f = `logo_${i++}.svg`;
          writeFileSync(join(dir, f), l.markup.includes('xmlns') ? l.markup : l.markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
          report.logos.push(f);
        } else if (l.src && !l.src.startsWith('data:')) {
          const r = await page.request.get(l.src);
          if (!r.ok()) continue;
          const ext = (r.headers()['content-type'] ?? '').match(/svg|png|jpe?g|webp|x-icon|gif/)?.[0]?.replace('x-icon', 'ico').replace('jpeg', 'jpg') ?? 'bin';
          const f = `logo_${i++}.${ext}`;
          writeFileSync(join(dir, f), await r.body());
          report.logos.push(f);
        }
      } catch {}
    }
  }
}
writeFileSync(join(dir, 'site.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(`captured ${report.captured.length} page(s), ${report.logos.length} logo candidate(s) → ${dir}`);
console.log('top colors:', report.colors.slice(0, 6).map((c) => c.hex).join(' '));
console.log('fonts:', report.fonts.map((f) => `${f.family} ${f.weight}`).join(', '));
