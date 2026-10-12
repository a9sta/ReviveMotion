import { layout, sec } from '../lib/html.mjs';
import { esc, hash, won, km2 } from '../lib/util.mjs';
import { title, desc, clampDesc } from '../lib/seo.mjs';
import * as S from '../lib/schema.mjs';
import { stepList, factTable, faqBlock, noticeBlock, longtail, telCta } from '../lib/blocks.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];

function faqCtx(ctx, place, unit) {
  const { cfg, courses } = ctx;
  return {
    place, unit,
    hours: cfg.hours, pay: cfg.pay, arrive: cfg.arrive,
    tel: cfg.tel, telLabel: cfg.telLabel, telNote: cfg.telNote,
    minPrice: won(Math.min(...courses.map((c) => c.price))),
    nearList: '옆 시군구',
  };
}

/* ── 코스 한 가지 ─────────────────────────────────────────────── */
export function coursePage(ctx, c) {
  const { cfg, siteUrl, courses, regions, counts } = ctx;
  const path = `/course/${c.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `course/${c.slug}`;
  const h = hash(seed);

  const lead = `<div class="lead">
  <p>${esc(c.lines[0])}</p>
  <p>${esc(c.for)} 고르시면 맞습니다. 손이 주로 가는 자리는 ${esc(c.focus)}이고, 압은 ${esc(c.pressure)}, 속도는 ${esc(c.tempo)}로 둡니다.</p>
  <p>${esc(c.lines[2] || c.lines[1])}</p>
</div>`;

  const facts = sec('fact', `${esc(c.ko)} 기본값`,
    factTable([
      ['기본 시간', `${c.min}분`],
      ['금액', `${won(c.price)}원 (전 지역 같음)`],
      ['압 세기', esc(c.pressure)],
      ['속도', esc(c.tempo)],
      ['주로 쓰는 자리', esc(c.focus)],
      ['오일', c.slug === 'dry' || c.slug === 'thai' ? '쓰지 않습니다' : '씁니다 (샤워 먼저 권합니다)'],
      ['받는 시간', `${esc(cfg.hours)} · ${esc(cfg.pay)}`],
    ]),
    '심야 할증과 출장비를 따로 붙이지 않습니다. 시간을 늘리면 늘어난 분량만 더합니다.', '00');

  const others = courses.filter((x) => x.slug !== c.slug);
  const compare = sec('compare', '다른 코스와 무엇이 다릅니까',
    `<ul class="cp-ul">${others.map((x) => `<li class="cp">
      <a href="/course/${x.slug}/"><span class="cp-k">${esc(x.ko)}</span><span class="cp-m">${x.min}분 ${won(x.price)}원 · 압 ${esc(x.pressure)}</span></a>
      <p class="cp-d">${esc(x.for)} 고르는 쪽입니다.</p>
    </li>`).join('')}</ul>`,
    `${esc(c.ko)}와 견줘 보실 수 있게 압과 시간을 같이 적었습니다.`, '01');

  const sidoLinks = sec('bysido', `시도별 ${esc(c.ko)} 안내`,
    `<ul class="lt-ul">${regions.map((r) => `<li><a href="/${r.slug}/course/${c.slug}/">${esc(r.name)} ${esc(c.ko)} 출장마사지</a></li>`).join('')}</ul>`,
    `시도 ${counts.sido}곳 어디든 ${won(c.price)}원 같은 값입니다.`, '02');

  const { html: faqHtml, qa } = faqBlock(seed, faqCtx(ctx, c.ko, '코스'), 4, '04');

  const pool = [];
  for (const r of regions) for (const g of r.gu) pool.push({ label: `${r.name} ${g.name}`, href: `/${r.slug}/${g.slug}/` });

  const body = [
    lead, facts,
    telCta(cfg, c.ko, seed),
    compare, sidoLinks, stepList(seed), faqHtml,
    noticeBlock(seed, '05'),
    longtail(pool, seed, 20, `${esc(c.ko)}를 받을 수 있는 곳`, null, '06'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.course(c),
      desc: clampDesc(desc.course(c)),
      h1: `${esc(c.ko)} <span class="h1-s">출장마사지·홈타이 ${c.min}분 ${won(c.price)}원</span>`,
      body,
      pageKind: 'course',
      crumbs: [
        { name: '처음', url: `${siteUrl}/` },
        { name: '코스', url: `${siteUrl}/course/` },
        { name: c.ko, url },
      ],
      jsonld: [
        S.service({
          siteUrl, url, cfg,
          name: `${c.ko} 출장마사지·홈타이`,
          desc: clampDesc(desc.course(c)),
          areaServed: cfg.coverage.sido.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
          courses: [c],
        }),
        S.faqPage(url, qa),
      ],
    }),
  };
}

/* ── 시도 × 코스 ──────────────────────────────────────────────────
   구 × 코스는 만들지 않는다. 150 × 8 = 1,200쪽이 되는데 구마다 코스 설명이
   같으므로 전부 얇은 조합 페이지가 된다(doorway-thin-combo 규칙). 시도 단위까지만
   내려가고, 구 페이지에서는 코스 목록으로 잇는다. */
export function sidoCoursePage(ctx, sd, c) {
  const { cfg, siteUrl, courses } = ctx;
  const path = `/${sd.slug}/course/${c.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `${sd.slug}/${c.slug}`;
  const h = hash(seed);
  const byArea = sd.gu.slice().sort((a, b) => b.area - a.area);

  const opens = [
    `${sd.name}에서 ${c.ko}를 받으시려면 ${cfg.telLabel} 번호로 접수하시면 됩니다. 시군구 ${sd.gu.length}곳 전부 ${c.min}분 ${won(c.price)}원 한 가지 값입니다.`,
    `${sd.name} 안 어느 구에서든 ${c.ko}는 같은 값입니다. ${c.min}분 ${won(c.price)}원이고, 멀다고 교통비를 붙이지 않습니다.`,
    `${c.ko}는 ${c.focus}에 시간을 몰아 쓰는 코스입니다. ${sd.name} 시군구 ${sd.gu.length}곳에서 같은 구성으로 받습니다.`,
  ];

  const lead = `<div class="lead">
  <p>${esc(at(h, opens, 0))}</p>
  <p>${esc(c.line)}</p>
  <p>압은 ${esc(c.pressure)}, 속도는 ${esc(c.tempo)}로 둡니다. ${esc(c.for)} 고르시면 맞고, 받는 중에 세기를 바꿔 달라고 하셔도 됩니다.</p>
</div>`;

  const facts = sec('fact', `${esc(sd.name)} ${esc(c.ko)} 기본값`,
    factTable([
      ['지역', `<a href="/${sd.slug}/">${esc(sd.full)}</a> 시군구 ${sd.gu.length}곳`],
      ['코스', `<a href="/course/${c.slug}/">${esc(c.ko)}</a> ${c.min}분`],
      ['금액', `${won(c.price)}원`],
      ['압 · 속도', `${esc(c.pressure)} · ${esc(c.tempo)}`],
      ['주로 쓰는 자리', esc(c.focus)],
      ['접수', `${esc(cfg.hours)} · ${esc(cfg.pay)} · 도착 ${esc(cfg.arrive)}`],
    ]), null, '00');

  const guLinks = sec('gulist', `${esc(sd.name)} 시군구에서 ${esc(c.ko)}`,
    `<ul class="lt-ul">${sd.gu.map((g) => `<li><a href="/${sd.slug}/${g.slug}/">${esc(g.name)} ${esc(c.ko)} 방문</a></li>`).join('')}</ul>`,
    `구 페이지에 그 구의 행정동 목록과 가까운 구까지의 거리를 적어 두었습니다.`, '01');

  const otherCourse = sec('oc', `${esc(sd.name)}에서 고를 수 있는 다른 코스`,
    `<ul class="lt-ul">${courses.filter((x) => x.slug !== c.slug).map((x) => `<li><a href="/${sd.slug}/course/${x.slug}/">${esc(sd.name)} ${esc(x.ko)} ${x.min}분</a></li>`).join('')}</ul>`,
    null, '02');

  const { html: faqHtml, qa } = faqBlock(seed, {
    place: `${sd.name} ${c.ko}`, unit: '시도',
    hours: cfg.hours, pay: cfg.pay, arrive: cfg.arrive,
    tel: cfg.tel, telLabel: cfg.telLabel, telNote: cfg.telNote,
    minPrice: won(Math.min(...courses.map((x) => x.price))),
    nearList: byArea.slice(0, 3).map((g) => g.name).join('·'),
  }, 4, '04');

  // 시군구가 한두 곳뿐인 시도(강원·광주)는 위 목록만으로 본문 링크가 너무 적다.
  // 다른 시도의 같은 코스로 이어 붙여 어느 쪽도 막힌 쪽이 되지 않게 한다.
  const crossPool = [];
  for (const r of ctx.regions) {
    if (r.slug === sd.slug) continue;
    crossPool.push({ label: `${r.name} ${c.ko}`, href: `/${r.slug}/course/${c.slug}/` });
    for (const g of r.gu) crossPool.push({ label: `${r.name} ${g.name}`, href: `/${r.slug}/${g.slug}/` });
  }

  const body = [
    lead, facts,
    telCta(cfg, `${sd.name} ${c.ko}`, seed),
    guLinks, otherCourse, stepList(seed), faqHtml,
    noticeBlock(seed, '05'),
    longtail(crossPool, seed, 24, `다른 시도에서 받는 ${esc(c.ko)}`, null, '06'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.sidoCourse(sd, c),
      desc: clampDesc(desc.sidoCourse(sd, c)),
      h1: `${esc(sd.name)} ${esc(c.ko)} <span class="h1-s">출장마사지 ${c.min}분 ${won(c.price)}원</span>`,
      body,
      pageKind: 'sidocourse',
      geo: { iso: sd.iso, placename: sd.full, lat: sd.lat, lng: sd.lng },
      crumbs: [
        { name: '처음', url: `${siteUrl}/` },
        { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
        { name: c.ko, url },
      ],
      jsonld: [
        S.service({
          siteUrl, url, cfg,
          name: `${sd.name} ${c.ko} 출장마사지·홈타이`,
          desc: clampDesc(desc.sidoCourse(sd, c)),
          areaServed: { '@type': 'AdministrativeArea', name: sd.full },
          courses: [c],
        }),
        S.faqPage(url, qa),
      ],
    }),
  };
}
