import { esc } from './util.mjs';
import * as S from './schema.mjs';

export const ASSET_V = '1';

/**
 * 공통 레이아웃.
 *  head  — SEO·GEO 메타 + JSON-LD
 *  푸터  — 네이버 C랭크 4신호(출처·최신성·수집 경로·정보량) + AI 고지
 *
 * ★전화번호는 **반드시 telBtn() 으로만** 찍는다. 번호만 덩그러니 적힌 자리가
 *   생기면 안 되기 때문이다(사용자 지시: 안심번호 옆에 '예약 문의'를 항상 적고
 *   버튼으로 만든다). 번호를 직접 문자열로 쓰는 곳이 없어야 한다 — 검사도구가
 *   그걸 본다(scripts/check.mjs 의 '맨 번호' 항목).
 */
export function layout(ctx, opts) {
  const { cfg, siteUrl, updated, latestPosts } = ctx;
  const {
    path, title, desc, h1, body, jsonld = [], geo, crumbs = [],
    noindex = false, bodyClass = '', pageKind = '',
  } = opts;
  const url = `${siteUrl}${path}`;
  const graph = S.graph([
    S.organization(cfg, siteUrl),
    S.website(cfg, siteUrl),
    crumbs.length ? S.breadcrumb(url, crumbs) : null,
    S.webpage({ url, siteUrl, title, desc, breadcrumbId: crumbs.length ? `${url}#crumb` : null }),
    ...jsonld,
  ]);

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${cfg.naverVerification ? `<meta name="naver-site-verification" content="${esc(cfg.naverVerification)}"/>` : ''}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1'}">
<meta name="format-detection" content="telephone=yes">
<meta name="author" content="${esc(cfg.brand.ko)}">
${geo ? `<meta name="geo.region" content="${esc(geo.iso)}">
<meta name="geo.placename" content="${esc(geo.placename)}">
<meta name="geo.position" content="${geo.lat};${geo.lng}">
<meta name="ICBM" content="${geo.lat}, ${geo.lng}">` : '<meta name="geo.region" content="KR">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.brand.ko)} 출장마사지">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${siteUrl}/assets/og.svg">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<link rel="alternate" type="application/rss+xml" title="${esc(cfg.rssTitle)}" href="${siteUrl}/rss.xml">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/revive.css?v=${ASSET_V}">
<script type="application/ld+json">${graph}</script>
</head>
<body class="${bodyClass}" data-kind="${pageKind}">
<a class="skip" href="#main">본문으로 건너뛰기</a>
${header(ctx, path)}
${crumbs.length > 1 ? crumbHtml(crumbs) : ''}
<main id="main">
<h1 class="pg-h1">${h1}</h1>
${body}
</main>
${footer(ctx, latestPosts)}
${callbar(cfg)}
<script src="/assets/revive.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

/* ── 전화 버튼 ─────────────────────────────────────────────────────
   안심번호 옆에 '예약 문의'가 **늘 붙어 있어야 한다**. 버튼 모양이지만
   `<a href="tel:">` 로 둔다 — <button> 으로 만들면 자바스크립트 없이는
   아무 일도 일어나지 않고, 눌렀을 때 바로 통화로 넘어가야 하기 때문이다.
   size: s(머리띠) · m(본문) · l(대문) */
export function telBtn(cfg, { size = 'm', note = true, block = false } = {}) {
  return `<a class="tb tb-${size}${block ? ' tb-b' : ''}" href="tel:${cfg.telRaw}">
  <span class="tb-ic" aria-hidden="true">${phoneMark()}</span>
  <span class="tb-tx"><span class="tb-k">${esc(cfg.telLabel)}</span><span class="tb-n">${esc(cfg.tel)}</span></span>
  ${note ? `<span class="tb-s">${esc(cfg.telNote)}</span>` : ''}
</a>`;
}

function header(ctx, path) {
  const { cfg, regions } = ctx;
  const on = (p) => (path === p || (p !== '/' && path.startsWith(p)) ? ' aria-current="page"' : '');
  return `<header class="hd">
  <div class="hd-in">
    <a class="bi" href="/" aria-label="${esc(cfg.brand.ko)} 처음으로">
      ${motionMark()}<span class="bi-t"><span class="bi-ko">${esc(cfg.brand.ko)}</span><span class="bi-en">${esc(cfg.brand.en)}</span></span>
    </a>
    <nav class="gnb" aria-label="주요 메뉴">
      <a href="/area/"${on('/area/')}>지역</a>
      <a href="/course/"${on('/course/')}>코스</a>
      <a href="/price/"${on('/price/')}>요금</a>
      <a href="/guide/"${on('/guide/')}>이용안내</a>
      <a href="/magazine/"${on('/magazine/')}>기록</a>
    </nav>
    ${telBtn(cfg, { size: 's', note: false })}
  </div>
</header>`;
}

function crumbHtml(crumbs) {
  return `<nav class="crumb" aria-label="현재 위치"><ol>${crumbs
    .map((c, i) => (i === crumbs.length - 1
      ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
      : `<li><a href="${c.url.replace(/^https?:\/\/[^/]+/, '')}">${esc(c.name)}</a></li>`))
    .join('')}</ol></nav>`;
}

/** 푸터 = 네이버 C랭크 4신호 + AI 고지 */
function footer(ctx, latestPosts = []) {
  const { cfg, regions, counts, data } = ctx;
  const b = cfg.business;
  const biz = [
    b.name ? `상호 ${esc(b.name)}` : '',
    b.owner ? `대표 ${esc(b.owner)}` : '',
    b.regNo ? `사업자등록번호 ${esc(b.regNo)}` : '',
    b.address ? `주소 ${esc(b.address)}` : '',
    b.privacyOfficer ? `개인정보 책임자 ${esc(b.privacyOfficer)}` : '',
    b.email ? `문의 ${esc(b.email)}` : '',
  ].filter(Boolean).join(' · ');

  return `<footer class="ft">
  <div class="ft-in">
    <section class="ft-col ft-col-w">
      <h2 class="ft-h">${esc(cfg.brand.ko)}</h2>
      <p class="ft-p">매장을 두지 않고 관리사가 이용자 주소로 갑니다. 시도 ${counts.sido}곳 · 시군구 ${counts.gu}곳에서 접수하며, 받는 번호는 아래 하나뿐입니다.</p>
      ${telBtn(cfg, { size: 'm' })}
      <p class="ft-h2">${esc(cfg.hours)} · ${esc(cfg.pay)} · 선입금 없음</p>
      ${biz ? `<p class="ft-biz">${biz}</p>` : '<p class="ft-biz ft-dim">사업자 정보는 확인되는 대로 이 자리에 적습니다.</p>'}
    </section>
    <nav class="ft-col" aria-label="지역 바로가기">
      <h2 class="ft-h">지역</h2>
      <ul class="ft-ul ft-ul-g">${regions.map((r) => `<li><a href="/${r.slug}/">${r.name}</a></li>`).join('')}</ul>
      <p class="ft-note"><a href="/area/">전체 시군구 ${counts.gu}곳</a> · 행정동 ${counts.dong}곳</p>
    </nav>
    <nav class="ft-col" aria-label="안내 문서">
      <h2 class="ft-h">안내</h2>
      <ul class="ft-ul">
        <li><a href="/guide/">이용안내</a></li>
        <li><a href="/price/">요금표</a></li>
        <li><a href="/course/">코스</a></li>
        <li><a href="/company/">회사소개</a></li>
        <li><a href="/terms/">이용약관</a></li>
        <li><a href="/privacy/">개인정보처리방침</a></li>
      </ul>
    </nav>
    <nav class="ft-col" aria-label="최근 글과 수집 경로">
      <h2 class="ft-h">최근 기록</h2>
      <ul class="ft-ul ft-ul-p">${latestPosts.slice(0, 3).map((p) => `<li><a href="${p.path}">${esc(p.title)}</a><time datetime="${p.date}">${p.date}</time></li>`).join('')}</ul>
      <ul class="ft-ul ft-feed">
        <li><a href="/rss.xml">RSS</a></li>
        <li><a href="/sitemap.xml">사이트맵</a></li>
        <li><a href="/llms.txt">llms.txt</a></li>
      </ul>
      <p class="ft-note">마지막 갱신 <time datetime="@@LM@@">@@LM@@</time></p>
    </nav>
  </div>
  <div class="ft-bar">
    <p class="ft-ai">이 사이트의 지역 문장은 공개 행정동 경계 자료(중심점 좌표·면적·구 사이 실거리)를 계산해 <strong>AI 도구의 도움을 받아 쓰고</strong> 사람이 확인했습니다. 후기나 체험담은 싣지 않고, 사람 사진도 쓰지 않습니다. 경계 자료 출처: ${esc(data.source)}</p>
    <p class="ft-cr">© ${esc(ctx.updated.slice(0, 4))} ${esc(cfg.brand.ko)}. 질병을 치료하는 의료 행위가 아니며, 성적 서비스를 제공하지 않습니다.</p>
  </div>
</footer>`;
}

/** 모바일 하단 고정 바 — 여기도 '예약 문의'가 번호 옆에 붙는다. */
function callbar(cfg) {
  return `<div class="cbar">
  ${telBtn(cfg, { size: 'l', note: true, block: true })}
  <span class="cbar-s">${esc(cfg.hours)} · ${esc(cfg.pay)}</span>
</div>`;
}

/** 로고 — 움직임이 되살아나는 결. 달(루네사)과 겹치지 않는 모양이어야 한다. */
export function motionMark() {
  return `<svg class="mk" viewBox="0 0 28 24" aria-hidden="true" focusable="false"><path d="M3 18.5c3.4-9 7.4-13.5 12-13.5 3.1 0 5.4 1.6 7 4.8" fill="none" stroke-width="2.4" stroke-linecap="round"/><path d="M8.5 20.5c2.6-6.3 5.4-9.4 8.5-9.4 1.9 0 3.4.9 4.5 2.7" fill="none" stroke-width="1.6" stroke-linecap="round" opacity=".55"/><circle cx="24.2" cy="7.4" r="2.1"/></svg>`;
}
function phoneMark() {
  return `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4.2 1.6 6 1.2l1.5 3.3-1.6 1.2c.6 1.7 2 3.1 3.7 3.7l1.2-1.6 3.3 1.5-.4 1.8c-.2.8-.9 1.3-1.7 1.2C7.6 11.8 4.1 8.3 3 3.3c-.1-.8.4-1.5 1.2-1.7Z"/></svg>`;
}

/** 섹션 틀 — 왼쪽 눈금과 순번을 세우는 골격(루네사의 둥근 점머리와 다르다). */
export function sec(id, h2, inner, sub, n) {
  return `<section class="sc" id="${id}" aria-labelledby="${id}-h">
  <div class="sc-hd">${n ? `<span class="sc-n" aria-hidden="true">${n}</span>` : ''}<h2 id="${id}-h">${h2}</h2>${sub ? `<p class="sc-sub">${sub}</p>` : ''}</div>
  ${inner}
</section>`;
}
