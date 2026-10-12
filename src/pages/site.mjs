import { layout, sec, telBtn, motionMark } from '../lib/html.mjs';
import { esc, hash, shuffle, won, km, km2 } from '../lib/util.mjs';
import { title, desc, clampDesc } from '../lib/seo.mjs';
import * as S from '../lib/schema.mjs';
import {
  courseGrid, stepList, factTable, faqBlock, noticeBlock,
  longtail, siteLinks, telCta,
} from '../lib/blocks.mjs';
import { POSTS } from '../content/posts.mjs';

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

/** 모든 구를 한 줄로 펴 둔 롱테일 풀 */
function allGu(regions) {
  const out = [];
  for (const r of regions) for (const g of r.gu) out.push({ label: `${r.name} ${g.name}`, href: `/${r.slug}/${g.slug}/` });
  return out;
}

/* ── 홈 ───────────────────────────────────────────────────────── */
export function homePage(ctx) {
  const { cfg, siteUrl, regions, counts, courses, latestPosts } = ctx;
  const path = '/';
  const url = `${siteUrl}/`;
  const seed = 'home';
  const minP = Math.min(...courses.map((c) => c.price));

  const hero = `<section class="hero" aria-label="${esc(cfg.brand.ko)} 접수 안내">
  <p class="hero-k">${esc(cfg.brand.slogan)}</p>
  <p class="hero-l">매장이 없습니다. 관리사가 ${esc(cfg.arrive)}에 이용자 주소로 갑니다. 시도 ${counts.sido}곳 · 시군구 ${counts.gu}곳 · 행정동 ${counts.dong}곳에서 받습니다.</p>
  ${telBtn(cfg, { size: 'l' })}
  <ul class="hero-sg">
    <li><strong>${esc(cfg.hours)}</strong>새벽에도 사람이 받습니다</li>
    <li><strong>${esc(cfg.pay)}</strong>끝난 뒤 그 자리에서 냅니다</li>
    <li><strong>${won(minP)}원부터</strong>심야 할증·교통비 없음</li>
  </ul>
</section>`;

  const sidoGrid = sec('sido', '지역을 고르십시오',
    `<ul class="sd-ul">${regions.map((r) => `<li class="sd">
      <a href="/${r.slug}/">
        <span class="sd-n">${esc(r.name)}</span>
        <span class="sd-m">시군구 ${r.gu.length} · 동 ${r.dongCount}</span>
      </a></li>`).join('')}</ul>
     <p class="sc-tail"><a href="/area/">시군구 ${counts.gu}곳 전체 목록</a>을 따로 두었습니다.</p>`,
    '시도를 누르면 그 안의 시군구가 넓이·동 개수와 함께 나옵니다.', '01');

  const { html: faqHtml, qa } = faqBlock(seed, faqCtx(ctx, '전국', '시군구'), 6, '05');

  const posts = sec('recent', '먼저 읽어 두면 좋은 것',
    `<ul class="po-ul">${POSTS.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((p) => `<li class="po">
      <a href="/magazine/${p.slug}/"><span class="po-t">${esc(p.title)}</span><time class="po-d" datetime="${p.date}">${p.date}</time></a>
      <p class="po-s">${esc(p.summary)}</p></li>`).join('')}</ul>`,
    '후기나 체험담은 싣지 않습니다. 받기 전에 알면 쓸모 있는 설명만 둡니다.', '06');

  const body = [
    hero,
    sidoGrid,
    courseGrid(courses, seed, '전국'),
    stepList(seed),
    sec('why', '이 사이트가 적어 두는 것',
      factTable([
        ['지역 단위', `시도 ${counts.sido} → 시군구 ${counts.gu}. 구마다 행정동 이름을 모두 적었습니다`],
        ['거리 기준', '행정동 경계 자료의 중심점 좌표로 구 사이 직선거리를 계산합니다'],
        ['안 적는 것', '후기·체험담·평점·사람 사진. 받은 적 없는 평가를 숫자로 만들지 않습니다'],
        ['접수 창구', `${esc(cfg.telNote)} 하나. 관리사 개인 번호를 쓰지 않습니다`],
        ['금액', `코스별 고정. ${won(minP)}원부터이며 지역에 따라 다르게 받지 않습니다`],
      ]),
      '무엇을 적고 무엇을 안 적는지 먼저 밝혀 두는 쪽이 고르실 때 편합니다.', '04'),
    faqHtml,
    posts,
    longtail(allGu(regions), seed, 30, '시군구 바로 가기', null, '07'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.home(),
      desc: clampDesc(desc.home()),
      h1: `${esc(cfg.brand.ko)} <span class="h1-s">출장마사지·홈타이 방문 관리</span>`,
      body,
      bodyClass: 'is-home',
      pageKind: 'home',
      jsonld: [
        S.service({
          siteUrl, url, cfg,
          name: `${cfg.brand.ko} 출장마사지·홈타이 방문 관리`,
          desc: clampDesc(desc.home()),
          areaServed: cfg.coverage.sido.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
          courses,
        }),
        S.itemList(`${url}#sidolist`, '받는 시도', regions.map((r) => ({ name: r.name, url: `${siteUrl}/${r.slug}/` }))),
        S.faqPage(url, qa),
      ],
    }),
  };
}

/* ── 지역 허브 — 시군구 전체를 한 쪽에 ─────────────────────────── */
export function areaHub(ctx) {
  const { cfg, siteUrl, regions, counts } = ctx;
  const path = '/area/';
  const url = `${siteUrl}${path}`;

  const groups = regions.map((r) => `<section class="ag" aria-labelledby="ag-${r.slug}">
  <h2 class="ag-h" id="ag-${r.slug}"><a href="/${r.slug}/">${esc(r.name)}</a>
    <span class="ag-m">시군구 ${r.gu.length} · 행정동 ${r.dongCount} · ${km2(r.area)}</span></h2>
  <ul class="ag-ul">${r.gu.map((g) => `<li><a href="/${r.slug}/${g.slug}/"><span class="ag-n">${esc(g.name)}</span><span class="ag-d">동 ${g.dongCount}</span></a></li>`).join('')}</ul>
</section>`).join('\n');

  const body = [
    `<div class="lead"><p>출장마사지·홈타이를 받는 시군구 ${counts.gu}곳입니다. 시도 ${counts.sido}곳에 걸쳐 있고 행정동으로 세면 ${counts.dong}곳입니다. 구 이름을 누르면 그 구의 행정동 목록과 가까운 시군구까지의 거리가 나옵니다.</p>
     <p>행정동마다 쪽을 따로 만들지 않았습니다. 내용이 비슷한 얇은 쪽이 2천 장 생기는 쪽보다, 구 페이지 하나에 그 구의 동 이름을 다 적어 두는 쪽이 찾기 쉽다고 봤습니다.</p></div>`,
    telCta(cfg, '전국', 'area'),
    `<div class="agw">${groups}</div>`,
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.areaHub(counts),
      desc: clampDesc(desc.areaHub(counts)),
      h1: `지역 목록 <span class="h1-s">시군구 ${counts.gu}곳 · 행정동 ${counts.dong}곳</span>`,
      body,
      pageKind: 'area',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '지역', url }],
      jsonld: [
        S.itemList(`${url}#list`, '받는 시군구', regions.flatMap((r) => r.gu.map((g) => ({ name: `${r.name} ${g.name}`, url: `${siteUrl}/${r.slug}/${g.slug}/` })))),
      ],
    }),
  };
}

/* ── 코스 허브 ────────────────────────────────────────────────── */
export function courseHub(ctx) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = '/course/';
  const url = `${siteUrl}${path}`;
  const oil = courses.filter((c) => !['dry', 'thai'].includes(c.slug));
  const dry = courses.filter((c) => ['dry', 'thai'].includes(c.slug));

  const table = sec('tbl', '여덟 코스 한 표로',
    `<div class="tw"><table class="tb-t">
    <caption>압 세기와 속도, 주로 손이 가는 자리를 함께 적었습니다.</caption>
    <thead><tr><th scope="col">코스</th><th scope="col">시간</th><th scope="col">금액</th><th scope="col">압</th><th scope="col">속도</th><th scope="col">주로 쓰는 자리</th></tr></thead>
    <tbody>${courses.map((c) => `<tr><th scope="row"><a href="/course/${c.slug}/">${esc(c.ko)}</a></th><td>${c.min}분</td><td>${won(c.price)}원</td><td>${esc(c.pressure)}</td><td>${esc(c.tempo)}</td><td>${esc(c.focus)}</td></tr>`).join('')}</tbody>
  </table></div>`, null, '01');

  const split = sec('split', '오일을 쓰느냐로 먼저 갈립니다',
    `<div class="sp2">
      <div class="sp"><h3>오일을 쓰는 코스 ${oil.length}가지</h3><ul class="sp-ul">${oil.map((c) => `<li><a href="/course/${c.slug}/">${esc(c.ko)}</a> — ${esc(c.for)}</li>`).join('')}</ul><p class="sp-n">샤워를 먼저 하시는 편이 낫고, 끝나고 한 번 더 씻으셔야 합니다.</p></div>
      <div class="sp"><h3>오일 없이 받는 코스 ${dry.length}가지</h3><ul class="sp-ul">${dry.map((c) => `<li><a href="/course/${c.slug}/">${esc(c.ko)}</a> — ${esc(c.for)}</li>`).join('')}</ul><p class="sp-n">옷을 입은 채로 받습니다. 끝나고 바로 나가셔야 할 때 고르십시오.</p></div>
    </div>`,
    '그다음은 압을 세게 할지, 한 자리에 몰아 쓸지입니다. 이 셋만 정하면 코스가 하나로 좁혀집니다.', '02');

  const { html: faqHtml, qa } = faqBlock('coursehub', faqCtx(ctx, '코스', '코스'), 4, '03');

  const body = [
    `<div class="lead"><p>여덟 가지입니다. 이름이 많아 보이지만 실제로 갈리는 기준은 셋뿐입니다 — 오일을 쓰는지, 압이 센지, 전신을 고르게 하는지 한 자리에 몰아 쓰는지.</p>
     <p>고르기 어려우면 통화에서 불편한 자리와 상태만 말씀하셔도 됩니다. 듣고 맞는 쪽을 권해 드리고, 받는 중에 바꿔 달라고 하셔도 맞춥니다.</p></div>`,
    table, split,
    telCta(cfg, '코스 상담', 'coursehub'),
    faqHtml,
    noticeBlock('coursehub', '04'),
    longtail(allGu(regions), 'coursehub', 20, '지역별로 보기', null, '05'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('코스 안내'),
      desc: '출장마사지 여덟 코스를 압 세기·시간·주로 쓰는 자리로 갈라 적었습니다. 오일을 쓰는 코스와 쓰지 않는 코스가 먼저 갈리고, 금액은 전 지역 같습니다.',
      h1: '코스 안내 <span class="h1-s">여덟 가지의 차이</span>',
      body,
      pageKind: 'coursehub',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '코스', url }],
      jsonld: [
        S.service({
          siteUrl, url, cfg, name: '출장마사지 코스',
          desc: '압 세기와 시간, 주로 쓰는 자리가 다른 여덟 코스',
          areaServed: cfg.coverage.sido.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
          courses,
        }),
        S.faqPage(url, qa),
      ],
    }),
  };
}

/* ── 요금표 ───────────────────────────────────────────────────── */
export function pricePage(ctx) {
  const { cfg, siteUrl, courses, regions, counts } = ctx;
  const path = '/price/';
  const url = `${siteUrl}${path}`;
  const minP = Math.min(...courses.map((c) => c.price));
  const maxP = Math.max(...courses.map((c) => c.price));

  const table = sec('tbl', '코스별 금액',
    `<div class="tw"><table class="tb-t">
    <caption>시도 ${counts.sido}곳·시군구 ${counts.gu}곳 어디든 같은 금액입니다.</caption>
    <thead><tr><th scope="col">코스</th><th scope="col">기본 시간</th><th scope="col">금액</th><th scope="col">10분당 환산</th></tr></thead>
    <tbody>${courses.map((c) => `<tr><th scope="row"><a href="/course/${c.slug}/">${esc(c.ko)}</a></th><td>${c.min}분</td><td>${won(c.price)}원</td><td>${won(Math.round(c.price / c.min * 10 / 100) * 100)}원</td></tr>`).join('')}</tbody>
  </table></div>`, null, '01');

  const nots = sec('nots', '붙지 않는 것',
    `<ul class="nt-ul">
      <li>출장비·교통비를 따로 받지 않습니다. ${esc(counts.gu)}개 시군구가 같은 값입니다.</li>
      <li>심야 할증이 없습니다. 새벽 세 시도 낮 세 시와 같습니다.</li>
      <li>예약금·보증금을 미리 받지 않습니다. 전액 ${esc(cfg.pay)}입니다.</li>
      <li>매트·오일·수건 같은 준비물 값을 따로 청구하지 않습니다.</li>
      <li>시간을 중간에 늘리면 늘어난 분량만 더합니다. 처음부터 다시 받지 않습니다.</li>
    </ul>`,
    `적어 둔 금액 밖에 더 드는 것이 없다는 뜻입니다. ${won(minP)}원에서 ${won(maxP)}원 사이입니다.`, '02');

  const { html: faqHtml, qa } = faqBlock('price', faqCtx(ctx, '요금', '코스'), 4, '03');

  const body = [
    `<div class="lead"><p>코스마다 기본 시간과 금액이 하나로 정해져 있습니다. 지역에 따라, 시간대에 따라 다르게 받지 않습니다 — ${won(minP)}원에서 ${won(maxP)}원 사이입니다.</p>
     <p>10분당 환산 금액을 같이 적었습니다. 시간이 다른 코스를 견줄 때 쓰시면 됩니다.</p></div>`,
    table, nots,
    telCta(cfg, '요금 문의', 'price'),
    faqHtml,
    longtail(allGu(regions), 'price', 18, '지역별 안내', null, '04'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('요금표'),
      desc: `출장마사지·홈타이 코스별 요금표. ${won(minP)}원에서 ${won(maxP)}원 사이이며, 출장비·심야 할증·예약금이 붙지 않습니다. 전 지역 같은 금액입니다.`,
      h1: `요금표 <span class="h1-s">${won(minP)}원 ~ ${won(maxP)}원 · 전 지역 같음</span>`,
      body,
      pageKind: 'price',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '요금표', url }],
      jsonld: [
        S.service({
          siteUrl, url, cfg, name: '출장마사지 요금',
          desc: '코스별 기본 시간과 금액',
          areaServed: cfg.coverage.sido.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
          courses,
        }),
        S.faqPage(url, qa),
      ],
    }),
  };
}

/* ── 이용안내 ─────────────────────────────────────────────────── */
export function guidePage(ctx) {
  const { cfg, siteUrl, regions, counts, courses } = ctx;
  const path = '/guide/';
  const url = `${siteUrl}${path}`;
  const { html: faqHtml, qa } = faqBlock('guide', faqCtx(ctx, '이용', '시군구'), 6, '04');

  const refuse = sec('refuse', '접수를 돌려 드리는 경우',
    `<ul class="nt-ul">
      <li>술을 드신 상태일 때. 혈압이 오르고 본인 몸 상태를 가늠하기 어려워집니다.</li>
      <li>열이 있거나 다친 자리가 아직 부어 있을 때. 눌러서 나빠지는 종류입니다.</li>
      <li>코스 밖의 요구를 하실 때. 그 자리에서 중단하고 돌아갑니다.</li>
      <li>관리사 사진을 찍거나 개인 연락처를 요구하실 때.</li>
      <li>주소가 통화 내용과 다를 때. 확인되면 다시 잡습니다.</li>
    </ul>`,
    '돌려 드리는 기준을 미리 적어 둡니다. 현장에서 실랑이할 일을 줄이는 쪽이 서로 낫습니다.', '03');

  const body = [
    `<div class="lead"><p>접수부터 정산까지 전부 전화 한 통으로 끝납니다. 이 쪽에 적어 둔 것 말고 따로 요구하는 절차가 없습니다.</p>
     <p>받는 지역은 시도 ${counts.sido}곳·시군구 ${counts.gu}곳입니다. 코스는 여덟 가지이고 금액은 지역에 상관없이 같습니다.</p></div>`,
    sec('fact', '한눈에', factTable([
      ['접수', `${telBtn(cfg, { size: 's' })} <span class="fx-n">버튼이 그대로 통화로 이어집니다</span>`],
      ['받는 시간', esc(cfg.hours)],
      ['도착', `${esc(cfg.arrive)} (주소를 들은 뒤 다시 못 박아 드립니다)`],
      ['결제', `${esc(cfg.pay)} · 선입금·예약금 없음`],
      ['지역', `시도 ${counts.sido} · 시군구 ${counts.gu} · 행정동 ${counts.dong}`],
      ['코스', `${courses.length}가지 · ${won(Math.min(...courses.map((c) => c.price)))}원부터`],
      ['변경·취소', '출발 전이면 다시 잡습니다. 위약금 없음'],
    ]), null, '00'),
    telCta(cfg, '이용 문의', 'guide'),
    stepList('guide'),
    refuse,
    faqHtml,
    noticeBlock('guide', '05'),
    longtail(allGu(regions), 'guide', 18, '지역별 안내', null, '06'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('이용안내'),
      desc: '출장마사지 접수부터 정산까지의 절차와, 접수를 돌려 드리는 경우를 적어 두었습니다. 전화 한 통으로 코스·시각·주소만 정하면 되고 선입금이 없습니다.',
      h1: '이용안내 <span class="h1-s">접수 · 도착 · 정산 · 변경</span>',
      body,
      pageKind: 'guide',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '이용안내', url }],
      jsonld: [S.faqPage(url, qa)],
    }),
  };
}

/* ── 회사소개 ─────────────────────────────────────────────────── */
export function companyPage(ctx) {
  const { cfg, siteUrl, counts, data, courses } = ctx;
  const path = '/company/';
  const url = `${siteUrl}${path}`;
  const b = cfg.business;

  const body = [
    `<div class="lead"><p>${esc(cfg.brand.ko)}(${esc(cfg.brand.en)})는 매장을 두지 않고 관리사가 이용자 주소로 가는 방문 관리 사업입니다. 받는 곳은 시도 ${counts.sido}곳·시군구 ${counts.gu}곳입니다.</p>
     <p>이 쪽에는 운영에서 지키는 선과 사이트에 적은 자료의 출처를 적어 둡니다.</p></div>`,
    sec('rule', '운영에서 지키는 선',
      `<ol class="rl-ol">
        <li><h3>받은 적 없는 평가를 만들지 않습니다</h3><p>후기·체험담·별점을 싣지 않고, 구조화 데이터에도 평점을 넣지 않습니다. 검색 결과에 별이 붙으면 눈에 띄는 것은 알지만, 없는 평가를 숫자로 만드는 일이 됩니다.</p></li>
        <li><h3>사람 사진을 쓰지 않습니다</h3><p>관리사 사진도, 생성한 인물 이미지도 쓰지 않습니다. 사진으로 기대를 만들어 두고 다른 사람이 가는 일을 아예 없애는 쪽을 택했습니다.</p></li>
        <li><h3>접수 창구를 하나로 둡니다</h3><p>${esc(cfg.telNote)} 하나로만 받습니다. 번호는 이 쪽의 예약 문의 버튼에 적어 두었고, 관리사 개인 번호는 주고받지 않습니다. 다른 번호로 온 연락은 저희가 아닙니다.</p></li>
        <li><h3>효과를 부풀리지 않습니다</h3><p>질병을 고치는 의료 행위가 아닙니다. 눌러서 나빠지는 몸 상태가 분명히 있어, 그런 경우에는 접수를 돌려 드립니다.</p></li>
        <li><h3>값을 지역에 따라 바꾸지 않습니다</h3><p>코스별 고정이고 출장비·심야 할증이 없습니다. ${won(Math.min(...courses.map((c) => c.price)))}원부터입니다.</p></li>
      </ol>`, null, '01'),
    sec('src', '자료 출처와 만드는 방식',
      factTable([
        ['지역 자료', esc(data.source)],
        ['자료 판', esc(data.version)],
        ['커버리지 기준', esc(data.coverageFrom)],
        ['계산한 값', '구 중심점 좌표 · 면적 · 구 사이 직선거리 · 시도 중심에서의 방위와 거리'],
        ['만든 날', esc(data.built)],
        ['문장 작성', 'AI 도구의 도움을 받아 쓰고 사람이 확인했습니다. 지역 숫자는 위 자료에서 계산해 끼웁니다'],
        ['안 쓰는 것', '후기 · 체험담 · 평점 · 사람 사진 · 지어낸 주소'],
      ]),
      '숫자를 어디서 가져왔는지 밝혀 두는 쪽이 믿을 만한지 가리기 쉽습니다.', '02'),
    b.owner || b.regNo || b.address ? sec('biz', '사업자 정보', factTable([
      b.name ? ['상호', esc(b.name)] : null,
      b.owner ? ['대표', esc(b.owner)] : null,
      b.regNo ? ['사업자등록번호', esc(b.regNo)] : null,
      b.address ? ['주소', esc(b.address)] : null,
      b.privacyOfficer ? ['개인정보 책임자', esc(b.privacyOfficer)] : null,
      b.email ? ['전자우편', esc(b.email)] : null,
    ].filter(Boolean)), null, '03') : sec('biz', '사업자 정보',
      '<p class="bz-n">확인되는 대로 이 자리에 상호·대표·사업자등록번호·주소·개인정보 책임자를 적습니다. 확정되지 않은 내용을 미리 적어 두지 않습니다.</p>', null, '03'),
    telCta(cfg, '문의', 'company'),
    siteLinks(ctx, 'company'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('회사소개'),
      desc: `${cfg.brand.ko}가 운영에서 지키는 선과 사이트에 쓴 지역 자료의 출처를 적어 두었습니다. 후기·평점·사람 사진을 쓰지 않는 이유도 함께 밝혀 둡니다.`,
      h1: '회사소개 <span class="h1-s">지키는 선과 자료 출처</span>',
      body,
      pageKind: 'company',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '회사소개', url }],
    }),
  };
}

/* ── 이용약관 ─────────────────────────────────────────────────── */
export function termsPage(ctx) {
  const { cfg, siteUrl, counts } = ctx;
  const path = '/terms/';
  const url = `${siteUrl}${path}`;
  const arts = [
    ['제1조 (목적)', `이 약관은 ${cfg.brand.ko}(이하 "회사")가 제공하는 방문 관리 서비스의 이용 조건과 절차, 회사와 이용자의 권리·의무를 정하는 것을 목적으로 합니다.`],
    ['제2조 (계약의 성립)', `서비스 계약은 이용자가 회사가 이 사이트에 표기한 ${cfg.telNote}로 ${cfg.telLabel}를 하고, 회사가 코스·시각·방문지를 확인해 수락한 때에 성립합니다. 회사는 그 번호 밖의 경로로 접수를 받지 않습니다.`],
    ['제3조 (서비스의 내용)', `회사는 이용자가 지정한 주소를 관리사가 방문하여 사전에 정한 코스의 신체 관리를 제공합니다. 회사는 의료기관이 아니며, 서비스는 질병의 진단·치료·처방을 포함하지 않습니다.`],
    ['제4조 (이용 요금과 결제)', `요금은 코스별로 정해져 있으며 회사의 요금표에 따릅니다. 결제는 ${cfg.pay}로 서비스 종료 후 현장에서 이루어집니다. 회사는 예약금·보증금·교통비를 사전에 청구하지 않으며, 지역이나 시간대에 따라 요금을 달리 적용하지 않습니다.`],
    ['제5조 (예약의 변경과 취소)', '이용자는 관리사가 출발하기 전까지 예약을 변경하거나 취소할 수 있으며, 이에 대한 위약금은 없습니다. 관리사가 이미 출발한 뒤의 취소에 관하여는 회사가 이동 경과를 알린 뒤 이용자와 협의하여 정합니다.'],
    ['제6조 (서비스 제공의 거절)', '회사는 다음 각 호에 해당하는 경우 서비스 제공을 거절하거나 중단할 수 있습니다. ① 이용자가 음주 상태인 경우 ② 발열, 급성 염증, 치료 중인 외상 등으로 관리가 신체에 해로울 수 있는 경우 ③ 이용자가 코스에 포함되지 않은 행위를 요구하는 경우 ④ 관리사의 신체를 촬영하거나 개인 연락처를 요구하는 경우 ⑤ 접수한 방문지와 실제 방문지가 달라 서비스 제공이 어려운 경우.'],
    ['제7조 (성적 서비스의 배제)', '회사는 어떠한 경우에도 성적 서비스를 제공하지 않으며, 이용자의 그러한 요구를 수락하지 않습니다. 제6조 제3호에 따라 서비스는 즉시 중단되고, 그때까지 제공된 부분에 대한 요금은 청구될 수 있습니다.'],
    ['제8조 (이용자의 의무)', '이용자는 접수 시 방문지 주소와 출입 방법을 사실대로 알려야 하며, 관리에 영향을 줄 수 있는 신체 상태(수술 이력, 치료 중인 부위, 임신 여부 등)를 미리 알려야 합니다. 이를 알리지 않아 발생한 결과에 대하여 회사는 책임을 지지 않습니다.'],
    ['제9조 (회사의 의무)', `회사는 안내한 시각과 코스에 따라 서비스를 제공하기 위해 노력하며, 지연이 예상되는 경우 이용자에게 알립니다. 회사는 관리사의 개인 연락처를 이용자에게 제공하지 않고, 이용자의 연락처를 관리사에게 노출하지 않습니다.`],
    ['제10조 (서비스 제공 지역)', `회사의 서비스 제공 지역은 시도 ${counts.sido}곳, 시군구 ${counts.gu}곳입니다. 제공 지역은 회사의 사정에 따라 변경될 수 있으며, 변경 시 이 사이트의 지역 목록에 반영합니다.`],
    ['제11조 (손해배상)', '회사 또는 관리사의 고의 또는 과실로 이용자에게 손해가 발생한 경우 회사는 관련 법령에 따라 배상합니다. 다만 이용자가 제8조의 고지 의무를 이행하지 않아 발생한 손해는 그 범위에서 제외됩니다.'],
    ['제12조 (약관의 변경)', '회사는 이 약관을 변경할 수 있으며, 변경된 약관은 이 쪽에 게시한 때부터 적용됩니다. 변경 전에 성립한 계약에는 종전 약관을 적용합니다.'],
    ['제13조 (분쟁의 해결)', '이 약관과 관련한 분쟁은 대한민국 법령에 따르며, 협의가 이루어지지 않는 경우 관할 법원에 따릅니다.'],
  ];
  const body = [
    `<div class="lead"><p>${esc(cfg.brand.ko)} 방문 관리 서비스의 이용약관입니다. 접수 전에 읽어 두시면 현장에서 다툴 일이 줄어듭니다.</p></div>`,
    `<div class="doc">${arts.map(([h, p], i) => `<section class="art"><h2 class="art-h">${esc(h)}</h2><p class="art-p">${esc(p)}</p></section>`).join('')}</div>`,
    `<p class="doc-f">시행일 ${esc(ctx.data.built)}</p>`,
    siteLinks(ctx, 'terms'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('이용약관'),
      desc: `${cfg.brand.ko} 방문 관리 서비스 이용약관. 계약 성립과 결제, 예약 변경·취소, 서비스 제공을 거절하는 경우를 조문으로 적어 두었습니다.`,
      h1: '이용약관',
      body,
      pageKind: 'terms',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '이용약관', url }],
    }),
  };
}

/* ── 개인정보처리방침 ─────────────────────────────────────────── */
export function privacyPage(ctx) {
  const { cfg, siteUrl } = ctx;
  const path = '/privacy/';
  const url = `${siteUrl}${path}`;
  const b = cfg.business;
  const arts = [
    ['1. 수집하는 항목', `${cfg.telLabel} 과정에서 받는 항목은 세 가지입니다. ① 연락처(통화 번호) ② 방문지 주소와 출입 방법 ③ 관리에 필요한 신체 상태(이용자가 스스로 알린 범위). 이 밖의 항목은 받지 않으며, 주민등록번호는 어떤 경우에도 받지 않습니다.`],
    ['2. 수집하는 방법', `이 사이트에 표기한 ${cfg.telNote} 통화로만 받습니다. 이 사이트에는 회원가입·게시판·댓글·문의 양식이 없고, 이용자가 입력하는 칸이 없습니다.`],
    ['3. 이용 목적', '예약 접수와 관리사 배정, 방문 시각 안내, 요금 정산, 그리고 재접수 시 이전 조건 확인에만 씁니다. 광고나 홍보 목적으로는 쓰지 않습니다.'],
    ['4. 보유 기간', '예약 기록은 접수일부터 6개월간 보관한 뒤 지웁니다. 이용자가 그 전에 삭제를 요구하면 지체 없이 지웁니다. 다만 요금 분쟁이 진행 중인 건은 그 종결까지 보관합니다.'],
    ['5. 제3자 제공과 처리 위탁', '수집한 정보를 제3자에게 제공하지 않습니다. 방문할 관리사에게는 그날 그 건의 방문지 주소와 관리에 필요한 범위만 전달하며, 이용자의 통화 번호는 전달하지 않습니다.'],
    ['6. 안심번호', `접수에 쓰는 번호는 안심번호입니다. 이용자와 관리사 양쪽의 실제 번호가 서로에게 남지 않도록 중간에서 연결합니다. 이 때문에 관리사가 이용자에게 직접 연락할 수 없으며, 모든 연락은 회사의 ${cfg.telNote}를 거쳐서만 이루어집니다.`],
    ['7. 쿠키와 접속 기록', '이 사이트는 쿠키를 심지 않고 외부 분석 도구를 넣지 않습니다. 정적 파일만 내려보내며, 웹 서버의 기본 접속 기록(접속 시각·요청 주소) 외에는 남기지 않습니다.'],
    ['8. 이용자의 권리', '이용자는 자신의 정보에 대해 열람·정정·삭제·처리정지를 요구할 수 있습니다. 접수 번호로 연락하시면 본인 확인 후 처리합니다.'],
    ['9. 안전 조치', '예약 기록은 접근 권한을 가진 담당자만 볼 수 있도록 두고, 보유 기간이 지난 기록은 복구할 수 없는 방법으로 지웁니다.'],
    ['10. 책임자와 변경 고지', b.privacyOfficer
      ? `개인정보 보호 책임자는 ${b.privacyOfficer}입니다. 이 방침이 바뀌면 이 쪽에 게시하고, 게시한 때부터 적용합니다.`
      : '개인정보 보호 책임자는 확정되는 대로 이 쪽에 적습니다. 그때까지는 접수 번호로 문의하시면 처리합니다. 이 방침이 바뀌면 이 쪽에 게시하고, 게시한 때부터 적용합니다.'],
  ];
  const body = [
    `<div class="lead"><p>이 사이트는 이용자가 직접 입력하는 칸이 없습니다. 받는 정보는 모두 통화에서 들은 것이고, 그 범위와 보관 기간을 아래에 적어 둡니다.</p></div>`,
    `<div class="doc">${arts.map(([h, p]) => `<section class="art"><h2 class="art-h">${esc(h)}</h2><p class="art-p">${esc(p)}</p></section>`).join('')}</div>`,
    `<p class="doc-f">시행일 ${esc(ctx.data.built)}</p>`,
    siteLinks(ctx, 'privacy'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('개인정보처리방침'),
      desc: '통화에서 받는 항목과 이용 목적, 보유 기간, 안심번호 처리 방식을 적어 두었습니다. 회원가입·게시판·쿠키·외부 분석 도구가 없습니다.',
      h1: '개인정보처리방침',
      body,
      pageKind: 'privacy',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '개인정보처리방침', url }],
    }),
  };
}

/* ── 기록 목록 ────────────────────────────────────────────────── */
export function magazineIndex(ctx) {
  const { cfg, siteUrl, regions } = ctx;
  const path = '/magazine/';
  const url = `${siteUrl}${path}`;
  const sorted = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));

  const body = [
    `<div class="lead"><p>받기 전에 알면 쓸모 있는 설명만 둡니다. 후기나 체험담은 싣지 않습니다 — 지어낸 경험을 적는 것은 검색 정책에도 걸리고, 고르실 때 도움도 안 됩니다.</p>
     <p>글 ${sorted.length}편이 있고 <a href="/rss.xml">RSS</a>로도 받으실 수 있습니다.</p></div>`,
    sec('list', '전체 글',
      `<ul class="po-ul po-ul-f">${sorted.map((p) => `<li class="po">
        <a href="/magazine/${p.slug}/"><span class="po-t">${esc(p.title)}</span><time class="po-d" datetime="${p.date}">${p.date}</time></a>
        <p class="po-s">${esc(p.summary)}</p></li>`).join('')}</ul>`, null, '01'),
    telCta(cfg, '문의', 'magazine'),
    siteLinks(ctx, 'magazine'),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.page('기록'),
      desc: `출장마사지를 받기 전에 알아 두면 좋은 설명 ${sorted.length}편. 안심번호·압 세기·코스 고르는 기준·공간 준비처럼 통화에서 자주 나오는 것만 적었습니다.`,
      h1: '기록 <span class="h1-s">받기 전에 알아 둘 것</span>',
      body,
      pageKind: 'magazine',
      crumbs: [{ name: '처음', url: `${siteUrl}/` }, { name: '기록', url }],
      jsonld: [S.itemList(`${url}#list`, '기록', sorted.map((p) => ({ name: p.title, url: `${siteUrl}/magazine/${p.slug}/` })))],
    }),
  };
}

/* ── 글 한 편 ─────────────────────────────────────────────────── */
export function postPage(ctx, p) {
  const { cfg, siteUrl, regions } = ctx;
  const path = `/magazine/${p.slug}/`;
  const url = `${siteUrl}${path}`;
  const sorted = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
  const others = sorted.filter((x) => x.slug !== p.slug).slice(0, 4);

  const bodyHtml = p.body.map((b) => {
    if (typeof b === 'string') return `<p>${esc(b)}</p>`;
    if (b[0] === 'h3') return `<h3 class="ar-h3">${esc(b[1])}</h3>`;
    if (b[0] === 'ul') return `<ul class="ar-ul">${b[1].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return '';
  }).join('\n');

  const body = [
    `<p class="ar-meta"><time datetime="${p.date}">${p.date}</time> · ${esc(cfg.brand.ko)} 기록</p>`,
    `<p class="ar-sum">${esc(p.summary)}</p>`,
    `<article class="ar">${bodyHtml}</article>`,
    telCta(cfg, '문의', `post/${p.slug}`),
    sec('more', '다른 글',
      `<ul class="po-ul">${others.map((x) => `<li class="po"><a href="/magazine/${x.slug}/"><span class="po-t">${esc(x.title)}</span><time class="po-d" datetime="${x.date}">${x.date}</time></a><p class="po-s">${esc(x.summary)}</p></li>`).join('')}</ul>`,
      null, '01'),
    siteLinks(ctx, `post/${p.slug}`),
  ].join('\n');

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.post(p),
      desc: clampDesc(desc.post(p)),
      h1: esc(p.title),
      body,
      pageKind: 'post',
      crumbs: [
        { name: '처음', url: `${siteUrl}/` },
        { name: '기록', url: `${siteUrl}/magazine/` },
        { name: p.title, url },
      ],
      jsonld: [S.article({ url, siteUrl, title: p.title, desc: p.summary, date: p.date, cfg })],
    }),
  };
}

/* ── 404 ──────────────────────────────────────────────────────── */
export function notFound(ctx) {
  const { cfg, siteUrl, regions, counts } = ctx;
  const path = '/404.html';
  const body = [
    `<div class="lead"><p>찾으시는 쪽이 없습니다. 주소가 바뀌었거나 잘못 눌리신 것 같습니다.</p>
     <p>지역은 시도 ${counts.sido}곳 → 시군구 ${counts.gu}곳 두 단계입니다. 아래에서 찾아 들어가시면 됩니다.</p></div>`,
    sec('sido', '지역',
      `<ul class="sd-ul">${regions.map((r) => `<li class="sd"><a href="/${r.slug}/"><span class="sd-n">${esc(r.name)}</span><span class="sd-m">시군구 ${r.gu.length}</span></a></li>`).join('')}</ul>`,
      null, '01'),
    siteLinks(ctx, '404'),
    telCta(cfg, '문의', '404'),
  ].join('\n');
  return {
    path,
    html: layout(ctx, {
      path: '/404.html',
      title: title.page('찾으시는 쪽이 없습니다'),
      desc: '주소가 바뀌었거나 잘못 눌린 것 같습니다. 지역 목록에서 다시 찾아 주십시오.',
      h1: '쪽을 찾지 못했습니다',
      body,
      noindex: true,
      pageKind: '404',
    }),
  };
}
