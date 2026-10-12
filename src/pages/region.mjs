import { layout, sec, telBtn } from '../lib/html.mjs';
import { esc, hash, km, km2, won, withJosa, josa, dirWord, rankWord } from '../lib/util.mjs';
import { title, desc, clampDesc } from '../lib/seo.mjs';
import * as S from '../lib/schema.mjs';
import {
  courseGrid, stepList, factTable, faqBlock, noticeBlock,
  longtail, nearGu, dongList, guIndex, telCta,
} from '../lib/blocks.mjs';
import { GU_LEAD_A, GU_LEAD_B, GU_LEAD_C, GU_LEAD_A_FAR, GU_LEAD_C_FAR, SIDO_LEAD } from '../content/copy.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];

/** FAQ·리드 틀에 넘기는 값 꾸러미. 전부 계산해서 나온 사실이다. */
function guCtx(ctx, sd, g) {
  const { cfg, courses } = ctx;
  const cross = g.near.find((n) => !n.same);
  const rank = rankWord(g.areaRank, sd.gu.length) || `${g.areaRank}번째로 넓은`;
  // ★가장 가까운 '우리가 받는' 시군구가 30km 넘게 떨어졌으면 외딴 구다.
  //   이쪽에 '가까우니 같은 권역'이라고 쓰면 거짓이 된다.
  const far = g.near[0].km > 30;
  return {
    sido: sd.name, sidoFull: sd.full, gu: g.name,
    josa_eun: josa(g.name, '은/는'), josa_i: josa(g.name, '이/가'),
    dir: g.dir, dir0: dirWord(g.dir),
    dongCount: g.dongCount, area: g.area, spanKm: g.spanKm, kc: g.kmFromCenter,
    rankPhrase: rank,
    n0: g.near[0].gu, n1: g.near[1].gu, n2: g.near[2].gu,
    k0: g.near[0].km, k1: g.near[1].km, k2: g.near[2].km,
    crossSido: cross ? cross.sido : null, crossGu: cross ? cross.gu : null, crossKm: cross ? cross.km : null,
    // FAQ 공통
    place: `${sd.name} ${g.name}`, unit: '시군구',
    hours: cfg.hours, pay: cfg.pay, arrive: cfg.arrive,
    tel: cfg.tel, telLabel: cfg.telLabel, telNote: cfg.telNote,
    minPrice: won(Math.min(...courses.map((c) => c.price))),
    nearList: g.near.slice(0, 3).map((n) => n.gu).join('·'),
    far,
  };
}

/* ── 시군구 페이지 — 이 사이트에서 가장 깊은 쪽 ───────────────── */
export function guPage(ctx, sd, g) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/${sd.slug}/${g.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `${sd.name}/${g.name}`;
  const h = hash(seed, 'gu');
  const c = guCtx(ctx, sd, g);

  const lead = `<div class="lead">
  <p>${at(h, c.far ? GU_LEAD_A_FAR : GU_LEAD_A, 0)(c)}</p>
  <p>${at(h, GU_LEAD_B, 1)(c)}</p>
  <p>${at(h, c.far ? GU_LEAD_C_FAR : GU_LEAD_C, 2)(c)}</p>
</div>`;

  const facts = sec('fact', `${esc(g.name)} 한눈에`,
    factTable([
      ['시도', `<a href="/${sd.slug}/">${esc(sd.full)}</a>`],
      ['시군구', esc(g.name)],
      ['행정동', `${g.dongCount}곳`],
      ['넓이', `${km2(g.area)} · ${esc(sd.name)}에서 ${esc(c.rankPhrase)} 축`],
      ['시도 중심에서', `${km(g.kmFromCenter)} ${esc(dirWord(g.dir))}`],
      ['구 안 최대 거리', g.spanKm ? `${km(g.spanKm)} (가장 먼 두 동 사이)` : '행정동 1곳'],
      [c.far ? '가까운 접수 지역' : '가까운 시군구', g.near.slice(0, 3).map((n) => `${esc(n.gu)} ${km(n.km)}`).join(' · ')],
      ['접수', `${esc(cfg.hours)} · ${esc(cfg.pay)} · 도착 ${esc(cfg.arrive)}`],
    ]),
    '행정동 경계 자료의 중심점 좌표와 면적을 계산해 적은 값입니다. 지어낸 숫자가 아닙니다.', '00');

  const { html: faqHtml, qa } = faqBlock(seed, c, 5, '05');

  // 다른 시도의 구 — 깊은 쪽끼리 이어 고아 페이지를 막는다
  const pool = [];
  for (const r of regions) for (const x of r.gu) {
    if (r.slug === sd.slug) continue;
    pool.push({ label: `${r.name} ${x.name}`, href: `/${r.slug}/${x.slug}/` });
  }

  const body = [
    lead,
    facts,
    telCta(cfg, `${sd.name} ${g.name}`, seed),
    courseGrid(courses, seed, g.name),
    dongList(g, seed, '02'),
    nearGu(sd, g, seed, '03', c.far),
    stepList(seed),
    faqHtml,
    noticeBlock(seed, '06'),
    guIndex(sd, seed, g.slug, '07'),
    longtail(pool, seed, 24, '다른 시도에서도 받습니다', null, '08'),
  ].join('\n');

  const areaServed = S.place(`${url}#place`, `${sd.full} ${g.name}`,
    { lat: g.lat, lng: g.lng },
    { area: g.area, containedIn: { '@type': 'AdministrativeArea', name: sd.full } });

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.gu(sd, g),
      desc: clampDesc(desc.gu(sd, g)),
      h1: `${esc(sd.name)} ${esc(g.name)} <span class="h1-s">출장마사지·홈타이 방문 관리</span>`,
      body,
      pageKind: 'gu',
      geo: { iso: sd.iso, placename: `${sd.full} ${g.name}`, lat: g.lat, lng: g.lng },
      crumbs: [
        { name: '처음', url: `${siteUrl}/` },
        { name: '지역', url: `${siteUrl}/area/` },
        { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
        { name: g.name, url },
      ],
      jsonld: [
        areaServed,
        S.service({
          siteUrl, url, cfg,
          name: `${sd.name} ${g.name} 출장마사지·홈타이 방문 관리`,
          desc: clampDesc(desc.gu(sd, g)),
          areaServed: { '@id': `${url}#place` },
          courses,
        }),
        S.faqPage(url, qa),
      ],
    }),
  };
}

/* ── 시도 페이지 ──────────────────────────────────────────────── */
export function sidoPage(ctx, sd) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/${sd.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = sd.name;
  const h = hash(seed, 'sd');
  const byArea = sd.gu.slice().sort((a, b) => b.area - a.area);

  const c = {
    sido: sd.name, full: sd.full, guCount: sd.gu.length, dongCount: sd.dongCount,
    biggest: byArea[0].name, smallest: byArea[byArea.length - 1].name,
    place: sd.name, unit: '시도',
    hours: cfg.hours, pay: cfg.pay, arrive: cfg.arrive,
    tel: cfg.tel, telLabel: cfg.telLabel, telNote: cfg.telNote,
    minPrice: won(Math.min(...courses.map((x) => x.price))),
    nearList: sd.gu.slice(0, 3).map((x) => x.name).join('·'),
  };

  const lead = `<div class="lead"><p>${at(h, SIDO_LEAD, 0)(c)}</p></div>`;

  const facts = sec('fact', `${esc(sd.name)} 한눈에`,
    factTable([
      ['행정 명칭', esc(sd.full)],
      ['시군구', `${sd.gu.length}곳`],
      ['행정동', `${sd.dongCount}곳`],
      ['받는 넓이', km2(sd.area)],
      ['가장 넓은 구', `<a href="/${sd.slug}/${byArea[0].slug}/">${esc(byArea[0].name)}</a> ${km2(byArea[0].area)}`],
      ['가장 작은 구', `<a href="/${sd.slug}/${byArea[byArea.length - 1].slug}/">${esc(byArea[byArea.length - 1].name)}</a> ${km2(byArea[byArea.length - 1].area)}`],
      ['접수', `${esc(cfg.hours)} · ${esc(cfg.pay)}`],
    ]), null, '00');

  const { html: faqHtml, qa } = faqBlock(seed, c, 4, '04');

  const csLinks = sec('sidocourse', `${esc(sd.name)} 코스별 안내`,
    `<ul class="lt-ul">${courses.map((x) => `<li><a href="/${sd.slug}/course/${x.slug}/">${esc(sd.name)} ${esc(x.ko)} 출장마사지</a></li>`).join('')}</ul>`,
    `코스마다 압과 시간이 다릅니다. ${esc(sd.name)} 안에서는 어느 구든 같은 금액입니다.`, '03');

  const pool = [];
  for (const r of regions) for (const x of r.gu) {
    if (r.slug === sd.slug) continue;
    pool.push({ label: `${r.name} ${x.name}`, href: `/${r.slug}/${x.slug}/` });
  }

  const body = [
    lead,
    facts,
    telCta(cfg, sd.name, seed),
    guIndex(sd, seed, null, '01'),
    courseGrid(courses, seed, sd.name),
    csLinks,
    stepList(seed),
    faqHtml,
    longtail(pool, seed, 20, '다른 시도', null, '05'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.sido(sd),
      desc: clampDesc(desc.sido(sd)),
      h1: `${esc(sd.name)} <span class="h1-s">출장마사지·홈타이 방문 관리</span>`,
      body,
      pageKind: 'sido',
      geo: { iso: sd.iso, placename: sd.full, lat: sd.lat, lng: sd.lng },
      crumbs: [
        { name: '처음', url: `${siteUrl}/` },
        { name: '지역', url: `${siteUrl}/area/` },
        { name: sd.name, url },
      ],
      jsonld: [
        S.place(`${url}#place`, sd.full, { lat: sd.lat, lng: sd.lng }, { area: sd.area, alternateName: sd.alias }),
        S.service({
          siteUrl, url, cfg,
          name: `${sd.name} 출장마사지·홈타이 방문 관리`,
          desc: clampDesc(desc.sido(sd)),
          areaServed: { '@id': `${url}#place` },
          courses,
        }),
        S.itemList(`${url}#gulist`, `${sd.name} 시군구`, sd.gu.map((g) => ({ name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` }))),
        S.faqPage(url, qa),
      ],
    }),
  };
}
