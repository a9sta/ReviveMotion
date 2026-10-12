/**
 * 정적 사이트 빌드. 외부 의존성 없이 Node 표준 라이브러리만 쓴다.
 *   node src/build.mjs   →  dist/
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, won } from './lib/util.mjs';
import { guPage, sidoPage } from './pages/region.mjs';
import { coursePage, sidoCoursePage } from './pages/course.mjs';
import {
  homePage, areaHub, guidePage, pricePage, courseHub, companyPage,
  termsPage, privacyPage, magazineIndex, postPage, notFound,
} from './pages/site.mjs';
import { POSTS } from './content/posts.mjs';
import { writeAssets } from './assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const cfg = read('data/site.config.json');
const courses = read('data/courses.json');
const data = read('data/regions.json');

// Netlify 가 넣어 주는 주소를 먼저 쓴다(배포 미리보기에서도 canonical 이 맞게 나온다).
const siteUrl = (process.env.SITE_URL || process.env.URL || cfg.siteUrl).replace(/\/+$/, '');
const updated = new Date().toISOString().slice(0, 10);

const regions = data.sido;
const counts = data.counts;

const latestPosts = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3).map((p) => ({ ...p, path: `/magazine/${p.slug}/` }));

const ctx = { cfg, siteUrl, updated, regions, counts, courses, data, latestPosts };

/* ── 페이지 생성 ──────────────────────────────────────────────
   ★구 × 코스는 만들지 않는다. 150 × 8 = 1,200쪽이 되는데 구가 달라져도 코스
     설명이 같아서 전부 얇은 조합 페이지가 된다(doorway-thin-combo 규칙).
   ★행정동도 쪽을 내지 않는다. 2,228쪽이 생기지만 내용이 구 페이지의 쪼갠 판에
     그친다. 대신 구 페이지 안에 동 이름을 모두 적어 검색어는 받는다. */
const pages = [];
pages.push(homePage(ctx));
pages.push(areaHub(ctx));
pages.push(guidePage(ctx), pricePage(ctx), courseHub(ctx), companyPage(ctx), termsPage(ctx), privacyPage(ctx));
pages.push(magazineIndex(ctx));
for (const p of POSTS) pages.push(postPage(ctx, p));
for (const c of courses) pages.push(coursePage(ctx, c));
for (const sd of regions) {
  pages.push(sidoPage(ctx, sd));
  for (const c of courses) pages.push(sidoCoursePage(ctx, sd, c));
  for (const g of sd.gu) pages.push(guPage(ctx, sd, g));
}
pages.push(notFound(ctx));

/* 같은 주소가 두 번 생기지 않았는지 — 조용히 덮어써지면 찾기 어렵다. */
{
  const seen = new Map();
  for (const p of pages) seen.set(p.path, (seen.get(p.path) || 0) + 1);
  const dup = [...seen].filter(([, n]) => n > 1);
  if (dup.length) {
    console.error('★주소 중복:', dup.map(([p, n]) => `${p}×${n}`).join(', '));
    process.exit(1);
  }
}

/* ── 쓰기 ────────────────────────────────────────────────── */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

/* ── 페이지별 '진짜 수정일' ───────────────────────────────────
   빌드할 때마다 전 페이지 lastmod 를 오늘로 찍으면 "매일 전 쪽이 바뀌었다"는
   거짓 신호가 된다(네이버 스팸 정책에 걸리는 종류다). 날짜 자리를 @@LM@@ 토큰으로
   비워 둔 채 본문 해시를 내고, **해시가 지난 빌드와 같으면 그때 날짜를 그대로 쓴다.**
   그래서 실제로 글이 바뀐 쪽만 날짜가 올라간다. 기록은 data/lastmod.json. */
const LM_FILE = path.join(ROOT, 'data', 'lastmod.json');
let lmPrev = {};
try { lmPrev = JSON.parse(fs.readFileSync(LM_FILE, 'utf8')); } catch { lmPrev = {}; }
const lmNext = {};
for (const pg of pages) {
  const h = crypto.createHash('md5').update(pg.html).digest('hex').slice(0, 16);
  const prev = lmPrev[pg.path];
  let date;
  if (prev && prev.h === h) date = prev.d;                       // 안 바뀐 쪽 — 날짜 유지
  else if (!prev) {                                              // 첫 등장
    const m = pg.path.match(/^\/magazine\/([^/]+)\/$/);
    const post = m && POSTS.find((x) => x.slug === m[1]);
    date = post ? post.date : updated;                           // 글은 발행일로 심는다
  } else date = updated;                                         // 내용이 바뀌었다
  lmNext[pg.path] = { h, d: date };
  pg.lastmod = date;
  pg.html = pg.html.split('@@LM@@').join(date);
}
fs.writeFileSync(LM_FILE, JSON.stringify(lmNext));
const changedToday = pages.filter((p) => p.lastmod === updated).length;

for (const pg of pages) {
  const out = pg.path.endsWith('.html') ? path.join(DIST, pg.path) : path.join(DIST, pg.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pg.html);
}

/* ── 사이트맵 ────────────────────────────────────────────── */
const indexable = pages.filter((p) => !p.path.endsWith('.html'));
function urlset(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map((p) => `<url><loc>${siteUrl}${p.path}</loc><lastmod>${p.lastmod}</lastmod><changefreq>${p.path === '/' ? 'daily' : 'weekly'}</changefreq><priority>${p.path === '/' ? '1.0' : p.path.split('/').length <= 3 ? '0.8' : '0.6'}</priority></url>`).join('\n')}
</urlset>`;
}
const sidoSlugs = regions.map((r) => r.slug);
const shards = {
  core: indexable.filter((p) => !sidoSlugs.some((s) => p.path.startsWith(`/${s}/`))),
};
for (const sd of regions) shards[sd.slug] = indexable.filter((p) => p.path.startsWith(`/${sd.slug}/`));
for (const [k, list] of Object.entries(shards)) fs.writeFileSync(path.join(DIST, `sitemap-${k}.xml`), urlset(list));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(shards).map((k) => `<sitemap><loc>${siteUrl}/sitemap-${k}.xml</loc><lastmod>${updated}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);

/* ── sitemap-latest.xml ───────────────────────────────────
   최근 14일 안에 **실제로 바뀐** 쪽만 담는다. 두 가지로 쓰인다.
     · 수집기에 "여기부터 보라"고 좁혀 주는 쪽지(robots.txt 에 따로 건다)
     · IndexNow 통보 스크립트가 /sitemap-latest.xml 을 **먼저** 읽는다 →
       바뀐 주소가 회차 상한(사이트당 500)을 먼저 가져가므로 가장 빨리 나간다.
   전체 사이트맵과 겹쳐도 규격상 문제없다. */
const DAY = 86400000;
const latest = indexable
  .filter((p) => Date.now() - Date.parse(`${p.lastmod}T00:00:00Z`) <= 14 * DAY)
  .sort((a, b) => b.lastmod.localeCompare(a.lastmod) || a.path.length - b.path.length);
const latestList = latest.length ? latest.slice(0, 2000) : indexable.filter((p) => p.path === '/');
fs.writeFileSync(path.join(DIST, 'sitemap-latest.xml'), urlset(latestList));

/* ── RSS ─────────────────────────────────────────────────── */
const newest = POSTS.map((x) => x.date).sort().pop();
const rfc = (d) => new Date(`${d}T09:00:00+09:00`).toUTCString();
const rssItems = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date)).map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${siteUrl}/magazine/${p.slug}/</link>
    <guid isPermaLink="true">${siteUrl}/magazine/${p.slug}/</guid>
    <pubDate>${rfc(p.date)}</pubDate>
    <description>${esc(p.summary)}</description>
  </item>`).join('\n');
fs.writeFileSync(path.join(DIST, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(cfg.rssTitle)}</title>
  <link>${siteUrl}/magazine/</link>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  <description>${esc(cfg.brand.ko)} 출장마사지·홈타이 방문 관리 안내 글</description>
  <language>ko-KR</language>
  <copyright>© ${updated.slice(0, 4)} ${esc(cfg.brand.ko)}</copyright>
  <category>생활·건강</category>
  <generator>revivemotion-ssg</generator>
  <docs>https://www.rssboard.org/rss-specification</docs>
  <ttl>60</ttl>
  <pubDate>${rfc(newest)}</pubDate>
  <!-- ★글이 바뀐 시각을 쓴다. 빌드 시각(new Date())을 쓰면 같은 내용인데도 파일이
       매번 달라져 '같은 주소 = 같은 응답' 이 깨진다. -->
  <lastBuildDate>${rfc(newest)}</lastBuildDate>
${rssItems}
</channel>
</rss>`);

/* ── robots.txt ──────────────────────────────────────────────
   ★Yeti 그룹을 따로 두면 Yeti 는 `*` 그룹을 **통째로 무시한다** — 규칙을 같이 적는다.
   ★Crawl-delay 는 적지 않는다(적는 순간 네이버가 그만큼 쉬엄쉬엄 긁는다).
   ★사이트맵 색인만 걸지 않고 자식 사이트맵까지 한 줄씩 건다. 색인 파일을 덜
     파고드는 수집기가 있어서, 줄을 늘려 두는 쪽이 늦게 발견될 위험을 없앤다. */
const sitemapLines = [
  `${siteUrl}/sitemap.xml`,
  `${siteUrl}/sitemap-latest.xml`,
  ...Object.keys(shards).map((k) => `${siteUrl}/sitemap-${k}.xml`),
].map((u) => `Sitemap: ${u}`).join('\n');
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: Yeti
Allow: /
Disallow: /404.html

User-agent: Yeti-Mobile
Allow: /
Disallow: /404.html

User-agent: *
Allow: /
Disallow: /404.html

${sitemapLines}
`);

/* ── llms.txt ────────────────────────────────────────────── */
fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${cfg.brand.ko} (${cfg.brand.en})

> 시도 ${counts.sido}곳·시군구 ${counts.gu}곳을 대상으로 하는 출장마사지·홈타이 방문 관리 안내 사이트. 매장이 없고 관리사가 이용자 주소로 방문한다. 지역 페이지는 **시군구 단위**까지만 있고, 행정동은 구 페이지 안에 이름으로 적어 둔다.

## 사실 요약
- 지역: ${regions.map((r) => `${r.name}(시군구 ${r.gu.length}·행정동 ${r.dongCount})`).join(', ')}
- 접수: ${cfg.telNote} ${cfg.tel} — 화면에서는 '${cfg.telLabel}' 버튼으로만 노출한다. 다른 경로로는 접수하지 않는다.
- 운영: ${cfg.hours} · 도착 ${cfg.arrive}
- 결제: ${cfg.pay}. 예약금·보증금·교통비 선입금 없음. 심야 할증 없음. 위약금 없음.
- 코스와 요금: ${courses.map((c) => `${c.ko} ${c.min}분 ${won(c.price)}원(압 ${c.pressure})`).join(' / ')}
- 거리 산정: 행정동 경계 중심점 좌표로 구 사이 직선거리를 계산한다. 행정구역보다 실제 거리로 배차한다.
- 제공하지 않는 것: 성적 서비스, 의료 행위, 후기·체험담·평점 게시, 인물 사진.

## 주요 문서
- [이용안내](${siteUrl}/guide/): 접수·도착·정산·변경, 접수를 돌려 드리는 경우
- [요금표](${siteUrl}/price/): 코스별 기본 시간과 금액, 붙지 않는 것
- [코스 안내](${siteUrl}/course/): 여덟 코스를 압·속도·부위로 비교
- [지역 목록](${siteUrl}/area/): 시군구 ${counts.gu}곳 전체
- [회사소개](${siteUrl}/company/): 운영에서 지키는 선과 자료 출처
${regions.map((r) => `- [${r.name}](${siteUrl}/${r.slug}/): 시군구 ${r.gu.length}곳`).join('\n')}

## 자료 출처
시군구·행정동 이름·경계·중심점 좌표·면적: ${data.source} (${data.version})
커버리지 기준: ${data.coverageFrom}

## 전체 주소 목록
${siteUrl}/sitemap.xml
`);

/* ── _headers · _redirects ──────────────────────────────────
   netlify.toml 은 깃 연동 빌드에서만 읽힌다. zip 을 직접 올리는 배포에서도
   같은 규칙이 걸리도록 publish 폴더 안에 파일로도 떨어뜨린다. */
fs.writeFileSync(path.join(DIST, '_headers'), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/sitemap.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/sitemap-*.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/rss.xml
  Content-Type: application/rss+xml; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/robots.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/llms.txt
  Content-Type: text/plain; charset=utf-8
/*.txt
  Content-Type: text/plain; charset=utf-8
`);

fs.writeFileSync(path.join(DIST, '_redirects'), `/index.html   /   301!
`);

fs.writeFileSync(path.join(DIST, 'site.webmanifest'), JSON.stringify({
  name: `${cfg.brand.ko} 출장마사지`, short_name: cfg.brand.ko,
  description: `시도 ${counts.sido}곳·시군구 ${counts.gu}곳 출장마사지·홈타이 방문 관리`,
  start_url: '/', display: 'standalone', background_color: '#123A3C', theme_color: '#123A3C',
  lang: 'ko-KR', icons: [{ src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2));

/* IndexNow(네이버 웹페이지 수집 요청) 키 파일 — 루트에 그대로 떨어져야 통보가 받아들여진다.
   ★키는 사이트마다 달라야 한다(남의 키를 함께 쓰면 403 이 떨어진다). */
if (cfg.indexNowKey) fs.writeFileSync(path.join(DIST, `${cfg.indexNowKey}.txt`), cfg.indexNowKey);

writeAssets(DIST, cfg);

const bytes = (function size(dir) {
  let t = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    t += e.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return t;
})(DIST);

console.log(`빌드 완료 · 페이지 ${pages.length} · 사이트맵 ${indexable.length} URL · ${(bytes / 1024 / 1024).toFixed(1)}MB`);
console.log(`  시도 ${counts.sido} · 시군구 ${counts.gu} · 행정동 ${counts.dong}(구 페이지 안에 이름으로) · 기준 주소 ${siteUrl}`);
console.log(`  오늘 날짜가 찍힌 쪽 ${changedToday} / ${pages.length} · 최근 14일 ${latestList.length}쪽을 sitemap-latest 에`);
