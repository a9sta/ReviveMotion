import { esc, hash, shuffle, km, km2, won, dirWord } from './util.mjs';
import { sec, telBtn } from './html.mjs';
import { ANCHOR, FAQ_POOL, STEP_SETS, NOTICE, SEC } from '../content/copy.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];

/* ── 예약 문의 띠 ──────────────────────────────────────────────────
   번호가 본문 어디에 나오든 '예약 문의'가 옆에 붙은 버튼으로만 나온다. */
export function telCta(cfg, place, seedKey) {
  const h = hash(seedKey, 'cta');
  const lines = [
    `${place} 쪽은 지금 움직일 수 있는 인원이 있는지 통화에서 바로 확인해 드립니다.`,
    `${place} 주소를 말씀하시면 몇 시 몇 분에 닿는지 숫자로 드립니다.`,
    `${place}에서 받으시려면 코스·시각·동 이름 세 가지만 정하면 됩니다.`,
    `${place} 접수는 이 번호 하나로 받습니다. 관리사 개인 번호는 쓰지 않습니다.`,
  ];
  return `<section class="cta" aria-label="${esc(place)} 예약 문의">
  <p class="cta-p">${esc(at(h, lines))}</p>
  ${telBtn(cfg, { size: 'l' })}
  <p class="cta-s">${esc(cfg.hours)} · ${esc(cfg.pay)} · 도착 ${esc(cfg.arrive)}</p>
</section>`;
}

/* ── 코스 ─────────────────────────────────────────────────────── */
export function courseGrid(courses, seedKey, place) {
  const h = hash(seedKey, 'cg');
  // 여덟 개 설명을 다 달면 어느 페이지나 같은 여덟 문장이 깔린다. 셋만 시드로 골라 단다.
  const withText = new Set(shuffle(courses.map((c) => c.slug), h).slice(0, 3));
  const list = courses.map((c) => {
    const line = at(hash(seedKey, c.slug), c.lines || [c.line]);
    return `<li class="cs">
    <a class="cs-a" href="/course/${c.slug}/">
      <span class="cs-k">${esc(c.ko)}</span>
      <span class="cs-m">${c.min}분 · ${won(c.price)}원</span>
      <span class="cs-p">압 ${esc(c.pressure)}</span>
    </a>
    ${withText.has(c.slug) ? `<p class="cs-d">${esc(line)}</p>` : ''}
  </li>`;
  }).join('');
  return sec('course', `${esc(place)}에서 고를 수 있는 코스`,
    `<ul class="cs-ul">${list}</ul>
     <p class="sc-tail">무엇을 고를지 모르겠으면 통화에서 불편한 자리만 말씀하셔도 됩니다. <a href="/course/">코스별 차이</a>와 <a href="/price/">요금표</a>를 따로 두었습니다.</p>`,
    at(h, SEC.courseSub, 1), '01');
}

/* ── 접수 흐름 ────────────────────────────────────────────────── */
export function stepList(seedKey) {
  const h = hash(seedKey, 'st');
  const steps = at(h, STEP_SETS);
  return sec('step', esc(at(h, SEC.stepTitle, 1)),
    `<ol class="st-ol">${steps.map((s, i) => `<li class="st"><span class="st-n">${i + 1}</span><div class="st-b"><h3 class="st-t">${esc(s.t)}</h3><p class="st-d">${esc(s.d)}</p></div></li>`).join('')}</ol>`,
    at(h, SEC.stepSub, 2), '02');
}

/* ── 빠른 정보 표 ─────────────────────────────────────────────── */
export function factTable(rows) {
  return `<dl class="fx-dl">${rows.map((r) => `<div class="fx-row"><dt>${esc(r[0])}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>`;
}

/* ── FAQ ─────────────────────────────────────────────────────── */
export function faqBlock(seedKey, c, n = 5, num = '03') {
  const h = hash(seedKey, 'faq');
  const idx = shuffle(FAQ_POOL.map((_, i) => i), h).slice(0, n);
  const qa = idx.map((i) => {
    const item = FAQ_POOL[i];
    const av = item.a[parseInt(hash(seedKey, 'av', i).substr(0, 3), 16) % item.a.length];
    return { q: item.q(c), a: av(c) };
  });
  const html = sec('faq', esc(at(h, SEC.faqTitle, 3)),
    qa.map((x) => `<div class="fq"><h3 class="fq-q">${esc(x.q)}</h3><p class="fq-a">${esc(x.a)}</p></div>`).join(''),
    at(h, SEC.faqSub, 4), num);
  return { html, qa };
}

/* ── 안내/주의 ────────────────────────────────────────────────── */
export function noticeBlock(seedKey, num) {
  const h = hash(seedKey, 'nt');
  const items = shuffle(NOTICE, h).slice(0, 4);
  return sec('notice', esc(at(h, SEC.noticeTitle, 5)),
    `<ul class="nt-ul">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`, null, num);
}

/* ── 롱테일 링크 격자 ─────────────────────────────────────────── */
export function longtail(pool, seedKey, n, heading, sub, num) {
  const h = hash(seedKey, 'lt');
  const picked = shuffle(pool, h).slice(0, n);
  const items = picked.map((p) => {
    const frame = ANCHOR[parseInt(hash(seedKey, p.label).substr(0, 3), 16) % ANCHOR.length];
    return `<li><a href="${p.href}">${esc(frame(p.label))}</a></li>`;
  }).join('');
  return sec('longtail', heading, `<ul class="lt-ul">${items}</ul>`, sub || at(h, SEC.ltSub, 6), num);
}

/* ── 가까운 구 ────────────────────────────────────────────────── */
export function nearGu(sd, g, seedKey, num) {
  const items = g.near.map((n) => `<li>
    <a href="/${n.sidoSlug}/${n.slug}/">
      <span class="nr-g">${esc(n.gu)}</span>
      <span class="nr-s">${n.same ? `같은 ${esc(sd.name)}` : esc(n.sido)}</span>
      <span class="nr-k">${km(n.km)}</span>
    </a></li>`).join('');
  return sec('near', `${esc(g.name)}에서 가까운 시군구`,
    `<ul class="nr-ul">${items}</ul>`,
    at(hash(seedKey, 'nr'), SEC.nearSub), num);
}

/* ── 구 안의 행정동 목록 ──────────────────────────────────────────
   페이지로는 만들지 않는다(동마다 쪽을 내면 얇은 쪽 2,228장이 된다).
   대신 이름을 그대로 적어 이용자가 자기 동이 들어가는지 바로 보게 한다. */
export function dongList(g, seedKey, num) {
  const items = g.dong.map((d) => `<li>${esc(d)}</li>`).join('');
  return sec('dong', `${esc(g.name)} 행정동 ${g.dongCount}곳`,
    `<ul class="dg-ul">${items}</ul>`,
    at(hash(seedKey, 'dg'), SEC.dongSub), num);
}

/* ── 시도 안의 구 목록 ────────────────────────────────────────── */
export function guIndex(sd, seedKey, currentSlug, num) {
  const items = sd.gu.map((g) => `<li${g.slug === currentSlug ? ' class="on"' : ''}>
    <a href="/${sd.slug}/${g.slug}/"${g.slug === currentSlug ? ' aria-current="page"' : ''}>
      <span class="gx-n">${esc(g.name)}</span>
      <span class="gx-m">동 ${g.dongCount} · ${km2(g.area)}</span>
    </a></li>`).join('');
  return sec('guidx', `${esc(sd.name)} 시군구 ${sd.gu.length}곳`,
    `<ul class="gx-ul">${items}</ul>`,
    at(hash(seedKey, 'gi'), SEC.guIdxSub), num);
}

/* ── 아래쪽 안내 링크 (글·약관 등 얕은 페이지용) ─────────────── */
export function siteLinks(ctx, seedKey) {
  const { regions } = ctx;
  const h = hash(seedKey, 'sl');
  const all = [];
  for (const r of regions) for (const g of r.gu) all.push({ r, g });
  const spots = shuffle(all, h).slice(0, 10);
  return sec('also', '이어서 볼 곳',
    `<ul class="lt-ul">
      <li><a href="/area/">전체 지역</a></li>
      <li><a href="/guide/">이용안내</a></li>
      <li><a href="/price/">요금표</a></li>
      <li><a href="/course/">코스 안내</a></li>
      <li><a href="/magazine/">기록</a></li>
      ${regions.map((r) => `<li><a href="/${r.slug}/">${esc(r.name)}</a></li>`).join('')}
      ${spots.map((x) => `<li><a href="/${x.r.slug}/${x.g.slug}/">${esc(x.r.name)} ${esc(x.g.name)}</a></li>`).join('')}
    </ul>`,
    '지역은 시도 → 시군구 두 단계입니다. 행정동은 구 페이지 안에 이름으로 적어 두었습니다.');
}
