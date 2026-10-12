/**
 * 행정동 경계(admdongkor, CC BY 4.0)에서 **yeomim.f.jieumweb.com 과 같은 지역**만 뽑아
 * data/regions.json 을 만든다. 이 사이트는 시군구 단위이므로 행정동은 페이지로 만들지 않고
 * 구 페이지 안의 '동네 목록'과 동 개수 집계로만 쓴다.
 *
 * 커버리지 원본은 data/_yeomim_coverage.tsv (yeomim DB tk_region 을 그대로 떠 온 것).
 * 다만 **그대로 쓰지 않는다** — 셋을 고친다. 고친 내역은 돌릴 때 화면에 찍는다.
 *   ① 모(시) 버킷 제거 — yeomim 에는 `경기/고양시` 와 `경기/고양시 덕양구` 가 함께 있다.
 *      둘은 같은 땅이라 구 페이지가 부모와 자식으로 두 번 생긴다(중복 신호). 구가 있는 시는
 *      구만 남긴다. 구가 없는 시(김포시 등)는 그대로 둔다.
 *   ② 바뀐 이름 반영 — 인천 `서구` 는 2026 개편으로 `서해구` 다. 경계 자료가 정본이다.
 *   ③ 빠진 구 보충 — yeomim 에 `부천시 오정구` 가 없다. 부천시를 다루면서 한 구만 빠진 것은
 *      이용자에게 구멍으로 보이므로 채운다.
 * ★광주·전남은 갈라 둔다. 경계 자료는 `전남광주통합특별시` 로 합쳐 두었지만, 행정 명칭이
 *   바뀌어도 검색어는 따라오지 않는다(한결 #115 때 합치기를 철회한 이유).
 *
 *   node scripts/build-regions.mjs [경로/HangJeongDong.geojson]
 */
import fs from 'node:fs';
import path from 'node:path';
import { adminSlug } from './romanize.mjs';

const VERSION = 'HangJeongDong_ver20260701';
const SRC = process.argv[2] || '/tmp/hjd.geojson';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'regions.json');
const COV = path.join(ROOT, 'data', '_yeomim_coverage.tsv');

/* 경계 자료의 시도명 → 이 사이트가 쓰는 짧은 이름 */
const SIDO = {
  서울: { full: '서울특별시', alias: '서울시', slug: 'seoul', iso: 'KR-11', src: '서울특별시' },
  부산: { full: '부산광역시', alias: '부산시', slug: 'busan', iso: 'KR-26', src: '부산광역시' },
  대구: { full: '대구광역시', alias: '대구시', slug: 'daegu', iso: 'KR-27', src: '대구광역시' },
  인천: { full: '인천광역시', alias: '인천시', slug: 'incheon', iso: 'KR-28', src: '인천광역시' },
  광주: { full: '광주광역시', alias: '광주시', slug: 'gwangju', iso: 'KR-29', src: '전남광주통합특별시' },
  대전: { full: '대전광역시', alias: '대전시', slug: 'daejeon', iso: 'KR-30', src: '대전광역시' },
  울산: { full: '울산광역시', alias: '울산시', slug: 'ulsan', iso: 'KR-31', src: '울산광역시' },
  경기: { full: '경기도', alias: '경기도', slug: 'gyeonggi', iso: 'KR-41', src: '경기도' },
  강원: { full: '강원특별자치도', alias: '강원도', slug: 'gangwon', iso: 'KR-42', src: '강원특별자치도' },
  충북: { full: '충청북도', alias: '충북', slug: 'chungbuk', iso: 'KR-43', src: '충청북도' },
  충남: { full: '충청남도', alias: '충남', slug: 'chungnam', iso: 'KR-44', src: '충청남도' },
  전북: { full: '전북특별자치도', alias: '전북', slug: 'jeonbuk', iso: 'KR-45', src: '전북특별자치도' },
  전남: { full: '전라남도', alias: '전남', slug: 'jeonnam', iso: 'KR-46', src: '전남광주통합특별시' },
  경북: { full: '경상북도', alias: '경북', slug: 'gyeongbuk', iso: 'KR-47', src: '경상북도' },
  경남: { full: '경상남도', alias: '경남', slug: 'gyeongnam', iso: 'KR-48', src: '경상남도' },
};
/* `전남광주통합특별시` 안에서 이 다섯은 광주, 나머지는 전남이다. */
const GWANGJU_GU = new Set(['광산구', '남구', '동구', '북구', '서구']);

/* yeomim 이름 → 경계 자료 이름 (②) */
const RENAME = { '인천|서구': '서해구' };
/* yeomim 에 없어서 채워 넣는 구 (③) */
const ADD = [['경기', '부천시오정구']];

/* ── 기하 ─────────────────────────────────────────────────── */
const R = 6371.0088;
const rad = (d) => (d * Math.PI) / 180;
function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
/** 링 하나의 부호 있는 면적과 1차 모멘트. 위도에 맞춰 경도를 축소한 평면 근사. */
function ringStats(ring, lat0) {
  const kx = Math.cos(rad(lat0)) * 111.32, ky = 110.574;
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const x1 = ring[i][0] * kx, y1 = ring[i][1] * ky;
    const x2 = ring[i + 1][0] * kx, y2 = ring[i + 1][1] * ky;
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  a /= 2;
  if (!a) return { area: 0, cx: 0, cy: 0 };
  return { area: a, cx: cx / (6 * a), cy: cy / (6 * a), kx, ky };
}
/** 폴리곤/멀티폴리곤의 면적(km²)과 무게중심(경위도). */
function shapeStats(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const lat0 = polys[0][0][0][1];
  let A = 0, X = 0, Y = 0, kx = 0, ky = 0;
  for (const poly of polys) {
    poly.forEach((ring, idx) => {
      const s = ringStats(ring, lat0);
      if (!s.area) return;
      kx = s.kx; ky = s.ky;
      const sign = idx === 0 ? 1 : -1;       // 첫 링은 바깥, 나머지는 구멍
      const w = sign * Math.abs(s.area);
      A += w; X += s.cx * w; Y += s.cy * w;
    });
  }
  if (!A) return null;
  return { area: Math.abs(A), lng: (X / A) / kx, lat: (Y / A) / ky };
}
const r6 = (v) => Math.round(v * 1e6) / 1e6;
/** 경계 자료는 `성남시수정구` 처럼 붙여 쓴다. 화면에는 띄어 쓴다. */
const pretty = (n) => n.replace(/^(.+?시)(.+구)$/, '$1 $2');

/* ── 커버리지 읽기 ─────────────────────────────────────────── */
const covRaw = fs.readFileSync(COV, 'utf8').trim().split('\n')
  .map((l) => l.split('\t')).map(([sido, gu]) => [sido, gu.replace(/\s+/g, '')]);

/* ── 경계 자료 집계: 시도|구 → 동 목록 ──────────────────────── */
const geo = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const buckets = new Map();                  // '서울|강남구' → [{dong, code, lat, lng, area}]
for (const ft of geo.features) {
  const p = ft.properties;
  let sido = null;
  for (const [short, m] of Object.entries(SIDO)) {
    if (m.src !== p.sidonm) continue;
    if (m.src === '전남광주통합특별시') {
      const isGj = GWANGJU_GU.has(p.sggnm);
      if ((short === '광주') !== isGj) continue;
    }
    sido = short; break;
  }
  if (!sido) continue;
  const st = shapeStats(ft.geometry);
  if (!st) continue;
  // adm_nm = '서울특별시 강남구 개포1동' — 마지막 토막이 행정동
  const dong = String(p.adm_nm).trim().split(/\s+/).pop();
  const k = `${sido}|${p.sggnm}`;
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push({ dong, code: p.adm_cd2, lat: r6(st.lat), lng: r6(st.lng), area: Math.round(st.area * 100) / 100 });
}

/* ── 커버리지 정리 ─────────────────────────────────────────── */
const have = new Set(buckets.keys());
const keep = [], dropped = [], renamed = [], missing = [];
for (const [sido, gu] of covRaw) {
  const rn = RENAME[`${sido}|${gu}`];
  const name = rn || gu;
  if (have.has(`${sido}|${name}`)) {
    if (rn) renamed.push(`${sido} ${gu} → ${name}`);
    keep.push([sido, name]);
    continue;
  }
  // 모(시) 버킷인가 — 이 이름으로 시작하는 구가 자료에 있으면 부모다
  const kids = [...have].filter((k) => k.startsWith(`${sido}|${gu}`) && k !== `${sido}|${gu}`);
  if (kids.length) { dropped.push(`${sido} ${gu} (자식 ${kids.length}구)`); continue; }
  missing.push(`${sido} ${gu}`);
}
for (const [sido, gu] of ADD) {
  if (have.has(`${sido}|${gu}`) && !keep.some(([s, g]) => s === sido && g === gu)) keep.push([sido, gu]);
}
const keepKeys = new Set(keep.map(([s, g]) => `${s}|${g}`));

/* ── 구 묶기 ──────────────────────────────────────────────── */
const guAll = [];
for (const k of keepKeys) {
  const [sido, name] = k.split('|');
  const dongs = buckets.get(k);
  let A = 0, X = 0, Y = 0;
  for (const d of dongs) { A += d.area; X += d.lng * d.area; Y += d.lat * d.area; }
  // 구 안에서 가장 멀리 떨어진 두 동 사이 거리 — "같은 구라도 끝과 끝은 다르다"를
  // 숫자로 말하기 위한 값. 동이 하나면 0 이다.
  let span = 0;
  for (let i = 0; i < dongs.length; i++)
    for (let j = i + 1; j < dongs.length; j++) {
      const v = haversine(dongs[i], dongs[j]);
      if (v > span) span = v;
    }
  guAll.push({
    sido, name: pretty(name), raw: name,
    slug: adminSlug(pretty(name)),
    lat: r6(Y / A), lng: r6(X / A),
    area: Math.round(A * 10) / 10,
    spanKm: Math.round(span * 10) / 10,
    dong: dongs.map((d) => d.dong).sort((a, b) => a.localeCompare(b, 'ko')),
    dongCount: dongs.length,
  });
}

/* 가까운 구 — 시도 경계를 넘어도 거리가 가까우면 같은 동선이다. */
for (const g of guAll) {
  g.near = guAll
    .filter((o) => o !== g)
    .map((o) => ({ sido: o.sido, sidoSlug: SIDO[o.sido].slug, gu: o.name, slug: o.slug, km: Math.round(haversine(g, o) * 10) / 10, same: o.sido === g.sido }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 6);
}

/* 시도 묶기 */
const order = Object.keys(SIDO);
const sido = [];
for (const name of order) {
  const gus = guAll.filter((g) => g.sido === name);
  if (!gus.length) continue;
  let A = 0, X = 0, Y = 0;
  for (const g of gus) { A += g.area; X += g.lng * g.area; Y += g.lat * g.area; }
  const c = { lat: Y / A, lng: X / A };
  // 시도 안에서의 방위와 면적 순위 — 구마다 다른 사실을 하나씩 주기 위한 값
  const byArea = gus.slice().sort((a, b) => b.area - a.area);
  for (const g of gus) {
    const dy = g.lat - c.lat, dx = g.lng - c.lng;
    const ns = dy > 0.03 ? '북' : dy < -0.03 ? '남' : '';
    const ew = dx > 0.03 ? '동' : dx < -0.03 ? '서' : '';
    g.dir = (ns + ew) || '중앙';
    g.areaRank = byArea.indexOf(g) + 1;
    g.kmFromCenter = Math.round(haversine(c, g) * 10) / 10;
    delete g.sido;
  }
  gus.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  sido.push({
    name, full: SIDO[name].full, alias: SIDO[name].alias, slug: SIDO[name].slug, iso: SIDO[name].iso,
    lat: r6(c.lat), lng: r6(c.lng), area: Math.round(A * 10) / 10,
    dongCount: gus.reduce((s, g) => s + g.dongCount, 0),
    gu: gus,
  });
}

const out = {
  version: VERSION,
  source: 'admdongkor (https://github.com/vuski/admdongkor) · CC BY 4.0 · 원자료 국가공간정보포털 행정동 경계',
  built: new Date().toISOString().slice(0, 10),
  coverageFrom: 'yeomim.f.jieumweb.com tk_region (모(시) 버킷 제거·개편 명칭 반영·누락 1구 보충)',
  counts: { sido: sido.length, gu: guAll.length, dong: guAll.reduce((s, g) => s + g.dongCount, 0) },
  sido,
};
fs.writeFileSync(OUT, JSON.stringify(out));

console.log(`시도 ${out.counts.sido} · 시군구 ${out.counts.gu} · 행정동 ${out.counts.dong}`);
console.log(`\n① 모(시) 버킷 제거 ${dropped.length}건\n   ${dropped.join(' · ')}`);
console.log(`② 개편 명칭 반영 ${renamed.length}건\n   ${renamed.join(' · ')}`);
console.log(`③ 누락 보충 ${ADD.length}건\n   ${ADD.map((a) => a.join(' ')).join(' · ')}`);
if (missing.length) console.log(`★자료에 없는 이름 ${missing.length}건 — 확인 필요\n   ${missing.join(' · ')}`);
for (const s of sido) console.log(`   ${s.name} 구 ${s.gu.length} · 동 ${s.dongCount}`);
