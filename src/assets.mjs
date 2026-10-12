/**
 * CSS·JS·SVG 를 dist/assets 에 떨어뜨린다. 외부 글꼴·외부 스크립트를 쓰지 않는다
 * (CSP 를 self 로 좁혀 둘 수 있고, 수집기가 기다릴 것이 없어진다).
 *
 * ★디자인 골격은 루네사와 겹치지 않아야 한다. 루네사는 '짙은 남색 바탕 + 금색 +
 *   둥근 알약 버튼 + 둥근 점 머리표'다. 이쪽은 '뼈색 종이 + 짙은 청록 + 녹슨 주황 +
 *   각진 판(라운드 0) + 왼쪽 눈금 레일 + 굵은 순번 숫자'로 간다.
 */
import fs from 'node:fs';
import path from 'node:path';

const INK = '#123A3C';        // 짙은 청록
const INK2 = '#0C2A2B';
const ACC = '#C2552B';        // 녹슨 주황
const ACC2 = '#9E4220';
const PAPER = '#F7F5F0';      // 뼈색
const CARD = '#FFFFFF';
const TEXT = '#21282A';
const DIM = '#5C6A6B';
const LINE = '#DAD4C8';
const LINE2 = '#EFEBE2';

const CSS = `:root{--ink:${INK};--ink2:${INK2};--acc:${ACC};--acc2:${ACC2};--paper:${PAPER};--card:${CARD};
--text:${TEXT};--dim:${DIM};--line:${LINE};--line2:${LINE2};--wrap:1140px}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--text);word-break:keep-all;line-height:1.75;
font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",system-ui,sans-serif;font-size:16px}
img,svg{max-width:100%}
h1,h2,h3{line-height:1.38;letter-spacing:-.01em}
a{color:var(--ink)}
ul,ol{margin:0;padding:0;list-style:none}
.skip{position:absolute;left:-9999px;top:0;z-index:99;background:var(--acc);color:#fff;padding:.6rem 1rem;font-weight:800}
.skip:focus{left:0}
:focus-visible{outline:2px solid var(--acc);outline-offset:2px}

/* ── 전화 버튼 — 어디서나 '예약 문의' + 번호가 함께 ───────────── */
.tb{display:inline-flex;align-items:center;gap:.6rem;text-decoration:none;background:var(--acc);color:#fff;
border:0;border-bottom:3px solid var(--acc2);padding:.62rem .95rem;font-weight:800;
font-variant-numeric:tabular-nums;transition:background .12s}
.tb:hover{background:var(--acc2)}
.tb-ic{display:flex;align-items:center}
.tb-ic svg{fill:currentColor;display:block}
.tb-tx{display:flex;align-items:baseline;gap:.5rem;min-width:0}
.tb-k{font-size:.84rem;letter-spacing:.02em;background:rgba(255,255,255,.2);padding:.1rem .4rem;font-weight:800;white-space:nowrap}
.tb-n{font-size:1.02rem;letter-spacing:.01em;white-space:nowrap}
.tb-s{font-size:.7rem;opacity:.86;border-left:1px solid rgba(255,255,255,.4);padding-left:.55rem;white-space:nowrap}
.tb-s::before{content:"";display:inline-block;width:.42rem;height:.42rem;background:#fff;margin-right:.3rem;
border-radius:50%;vertical-align:.04em}
.tb-s{font-weight:700}
.tb-l{padding:.82rem 1.2rem}
.tb-l .tb-n{font-size:1.2rem}
.tb-l .tb-k{font-size:.9rem}
.tb-s2{}
.tb-b{display:flex;width:100%;justify-content:center}

/* ── 머리띠 ─────────────────────────────────────────────────── */
.hd{background:var(--ink);color:#fff;position:sticky;top:0;z-index:30;border-bottom:3px solid var(--acc)}
.hd-in{max-width:var(--wrap);margin:0 auto;padding:.5rem 1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.bi{display:flex;align-items:center;gap:.5rem;text-decoration:none;color:#fff;flex:none}
.mk{width:28px;height:24px;flex:none;stroke:var(--acc);fill:var(--acc)}
.bi-t{display:flex;flex-direction:column;line-height:1.1}
.bi-ko{font-weight:800;font-size:1.02rem;letter-spacing:-.02em}
.bi-en{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:#9BB6B2;font-weight:700}
.gnb{display:flex;gap:.12rem;flex:1 1 auto;flex-wrap:wrap}
.gnb a{padding:.38rem .6rem;font-size:.9rem;text-decoration:none;color:#CFE0DD;font-weight:600}
.gnb a:hover{color:#fff;background:rgba(255,255,255,.1)}
.gnb a[aria-current]{color:var(--ink);background:#fff;font-weight:800}
.hd .tb{display:none}

/* ── 갈피 ───────────────────────────────────────────────────── */
.crumb{max-width:var(--wrap);margin:0 auto;padding:.7rem 1rem 0;font-size:.79rem;color:var(--dim)}
.crumb ol{display:flex;flex-wrap:wrap;gap:.3rem}
.crumb li+li::before{content:"/";margin-right:.32rem;color:var(--line)}
.crumb a{text-decoration:none;color:var(--dim)}
.crumb a:hover{color:var(--acc);text-decoration:underline}

main{max-width:var(--wrap);margin:0 auto;padding:1.1rem 1rem 5.2rem}

/* ── 제목 ───────────────────────────────────────────────────── */
.pg-h1{font-size:clamp(1.42rem,4.4vw,2.08rem);margin:.5rem 0 1.1rem;font-weight:800;
padding-left:.9rem;border-left:6px solid var(--acc)}
.h1-s{display:block;font-size:.58em;font-weight:700;color:var(--dim);margin-top:.3em;letter-spacing:-.01em}

.lead{margin:0 0 1.7rem;max-width:66rem}
.lead p{margin:0 0 .8rem;font-size:1.02rem}
.lead p:first-child{font-weight:600}

/* ── 대문 ───────────────────────────────────────────────────── */
.hero{background:var(--ink);color:#EAF1F0;padding:1.5rem 1.25rem;margin:0 0 1.8rem;
border-left:6px solid var(--acc);position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;
border:18px solid rgba(255,255,255,.045);border-radius:50%}
.hero-k{margin:0 0 .5rem;color:var(--acc);font-weight:800;font-size:1.06rem;letter-spacing:-.01em}
.hero-l{margin:0 0 1.1rem;max-width:46rem;color:#D6E3E1}
.hero-sg{display:flex;flex-wrap:wrap;gap:.1rem 1.6rem;margin:1.2rem 0 0;font-size:.86rem;color:#A9C2BF}
.hero-sg li{display:flex;flex-direction:column;padding:.4rem 0}
.hero-sg strong{color:#fff;font-size:.98rem;font-weight:800}

/* ── 예약 문의 띠 ────────────────────────────────────────────── */
.cta{background:var(--card);border:1px solid var(--line);border-left:6px solid var(--ink);
padding:1.1rem 1.15rem;margin:0 0 1.8rem;display:flex;flex-direction:column;align-items:flex-start;gap:.7rem}
.cta-p{margin:0;font-weight:600;max-width:52rem}
.cta-s{margin:0;font-size:.82rem;color:var(--dim);font-weight:600}

/* ── 구역 ───────────────────────────────────────────────────── */
.sc{margin:0 0 2.1rem}
.sc-hd{margin:0 0 1rem;border-bottom:2px solid var(--ink);padding-bottom:.5rem;position:relative}
.sc-n{display:inline-block;font-size:.72rem;font-weight:800;color:#fff;background:var(--ink);
padding:.1rem .38rem;margin-right:.5rem;letter-spacing:.06em;vertical-align:.22em;
font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.sc-hd h2{display:inline;font-size:clamp(1.08rem,2.6vw,1.3rem);margin:0;font-weight:800}
.sc-sub{margin:.45rem 0 0;font-size:.85rem;color:var(--dim)}
.sc-tail{margin:.9rem 0 0;font-size:.88rem;color:var(--dim)}
.sc-tail a,.sc-sub a{color:var(--acc2);font-weight:700}

/* ── 사실 표 ────────────────────────────────────────────────── */
.fx-dl{margin:0;border-top:1px solid var(--line)}
.fx-row{display:grid;grid-template-columns:8.6rem 1fr;gap:.6rem;padding:.6rem .2rem;
border-bottom:1px solid var(--line2)}
.fx-row dt{margin:0;font-weight:700;color:var(--dim);font-size:.86rem}
.fx-row dd{margin:0}
.fx-row a{color:var(--acc2);font-weight:700}
.fx-row dd .tb{margin:.1rem .5rem .25rem 0}
.fx-n{font-size:.85rem;color:var(--dim)}

/* ── 코스 ───────────────────────────────────────────────────── */
.cs-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:.7rem}
.cs{background:var(--card);border:1px solid var(--line);padding:.8rem .85rem}
.cs-a{display:grid;gap:.1rem;text-decoration:none}
.cs-k{font-weight:800;font-size:1.04rem}
.cs-m{font-size:.84rem;color:var(--acc2);font-weight:700;font-variant-numeric:tabular-nums}
.cs-p{font-size:.76rem;color:var(--dim)}
.cs-d{margin:.55rem 0 0;font-size:.85rem;color:var(--dim);border-top:1px dashed var(--line);padding-top:.5rem}

/* ── 순서 ───────────────────────────────────────────────────── */
.st-ol{display:grid;gap:.1rem;border-left:2px solid var(--line)}
.st{display:flex;gap:.85rem;padding:.7rem 0 .7rem 1rem;position:relative}
.st-n{flex:none;width:1.65rem;height:1.65rem;display:grid;place-items:center;background:var(--ink);
color:#fff;font-weight:800;font-size:.86rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
margin-left:-1.82rem}
.st-b{min-width:0}
.st-t{margin:0 0 .18rem;font-size:1rem;font-weight:800}
.st-d{margin:0;font-size:.9rem;color:var(--dim)}

/* ── 지역 ───────────────────────────────────────────────────── */
.sd-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.55rem}
.sd a{display:grid;gap:.05rem;background:var(--card);border:1px solid var(--line);padding:.7rem .75rem;text-decoration:none}
.sd a:hover{border-color:var(--acc);box-shadow:inset 3px 0 0 var(--acc)}
.sd-n{font-weight:800;font-size:1.04rem}
.sd-m{font-size:.76rem;color:var(--dim);font-variant-numeric:tabular-nums}

.gx-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:.4rem}
.gx-ul a{display:grid;gap:.02rem;padding:.52rem .6rem;text-decoration:none;background:var(--card);
border:1px solid var(--line2)}
.gx-ul a:hover{border-color:var(--acc);background:#fff}
.gx-ul .on a{border-color:var(--ink);box-shadow:inset 3px 0 0 var(--ink);font-weight:800}
.gx-n{font-weight:700;font-size:.93rem}
.gx-m{font-size:.73rem;color:var(--dim);font-variant-numeric:tabular-nums}

/* ── 행정동 이름 ─────────────────────────────────────────────── */
.dg-ul{display:flex;flex-wrap:wrap;gap:.3rem}
.dg-ul li{font-size:.85rem;background:var(--card);border:1px solid var(--line2);padding:.24rem .52rem;color:var(--text)}

/* ── 가까운 구 ──────────────────────────────────────────────── */
.nr-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(188px,1fr));gap:.45rem}
.nr-ul a{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:.1rem .5rem;
background:var(--card);border:1px solid var(--line);padding:.56rem .7rem;text-decoration:none}
.nr-ul a:hover{border-color:var(--acc)}
.nr-g{font-weight:700;font-size:.94rem}
.nr-k{font-size:.84rem;font-weight:800;color:var(--acc2);font-variant-numeric:tabular-nums;grid-row:1/3}
.nr-s{font-size:.73rem;color:var(--dim)}

/* ── 롱테일 ─────────────────────────────────────────────────── */
.lt-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(192px,1fr));gap:.3rem}
.lt-ul a{display:block;padding:.44rem .3rem;font-size:.88rem;text-decoration:none;color:var(--text);
border-bottom:1px solid var(--line2)}
.lt-ul a:hover{color:var(--acc2);border-bottom-color:var(--acc)}

/* ── FAQ ────────────────────────────────────────────────────── */
.fq{padding:.85rem 0;border-bottom:1px solid var(--line2)}
.fq-q{margin:0 0 .3rem;font-size:1rem;font-weight:800;padding-left:1.35rem;position:relative}
.fq-q::before{content:"Q";position:absolute;left:0;top:0;color:var(--acc);font-weight:800;
font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.fq-a{margin:0;color:var(--dim);font-size:.93rem;padding-left:1.35rem}

/* ── 주의 ───────────────────────────────────────────────────── */
.nt-ul{display:grid;gap:.5rem}
.nt-ul li{padding:.1rem 0 .1rem .95rem;border-left:3px solid var(--line);font-size:.92rem;color:var(--dim)}
.nt-ul li:hover{border-left-color:var(--acc)}

/* ── 표 ─────────────────────────────────────────────────────── */
.tw{overflow-x:auto;border:1px solid var(--line);background:var(--card)}
.tb-t{width:100%;border-collapse:collapse;font-size:.9rem;min-width:33rem}
.tb-t caption{text-align:left;padding:.6rem .7rem;font-size:.82rem;color:var(--dim);border-bottom:1px solid var(--line2)}
.tb-t th,.tb-t td{padding:.52rem .7rem;text-align:left;border-bottom:1px solid var(--line2)}
.tb-t thead th{background:var(--ink);color:#fff;font-size:.8rem;font-weight:700;letter-spacing:.01em}
.tb-t tbody th{font-weight:800}
.tb-t tbody th a{color:var(--acc2)}
.tb-t td{font-variant-numeric:tabular-nums}

/* ── 둘로 나눈 판 ────────────────────────────────────────────── */
.sp2{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:.8rem}
.sp{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--ink);padding:.9rem}
.sp h3{margin:0 0 .5rem;font-size:1rem;font-weight:800}
.sp-ul{display:grid;gap:.34rem;font-size:.9rem}
.sp-ul a{font-weight:700;color:var(--acc2)}
.sp-n{margin:.7rem 0 0;font-size:.82rem;color:var(--dim);border-top:1px dashed var(--line);padding-top:.5rem}

/* ── 코스 비교 ──────────────────────────────────────────────── */
.cp-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:.6rem}
.cp{background:var(--card);border:1px solid var(--line);padding:.72rem .8rem}
.cp a{display:grid;gap:.04rem;text-decoration:none}
.cp-k{font-weight:800}
.cp-m{font-size:.79rem;color:var(--acc2);font-weight:700;font-variant-numeric:tabular-nums}
.cp-d{margin:.45rem 0 0;font-size:.84rem;color:var(--dim)}

/* ── 지역 허브 ──────────────────────────────────────────────── */
.agw{display:grid;gap:1.4rem}
.ag-h{margin:0 0 .6rem;font-size:1.1rem;font-weight:800;border-bottom:2px solid var(--ink);padding-bottom:.4rem;
display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap}
.ag-h a{text-decoration:none}
.ag-m{font-size:.76rem;color:var(--dim);font-weight:600;font-variant-numeric:tabular-nums}
.ag-ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.26rem}
.ag-ul a{display:flex;justify-content:space-between;align-items:baseline;gap:.4rem;padding:.38rem .5rem;
text-decoration:none;border-bottom:1px solid var(--line2);font-size:.88rem}
.ag-ul a:hover{background:var(--card);border-bottom-color:var(--acc)}
.ag-n{font-weight:600}
.ag-d{font-size:.73rem;color:var(--dim);font-variant-numeric:tabular-nums;flex:none}

/* ── 글 ─────────────────────────────────────────────────────── */
.po-ul{display:grid;gap:.1rem}
.po{padding:.75rem 0;border-bottom:1px solid var(--line2)}
.po a{display:flex;justify-content:space-between;align-items:baseline;gap:.8rem;text-decoration:none;flex-wrap:wrap}
.po-t{font-weight:800;font-size:1rem}
.po-d{font-size:.76rem;color:var(--dim);font-variant-numeric:tabular-nums;flex:none}
.po-s{margin:.22rem 0 0;font-size:.88rem;color:var(--dim)}
.ar-meta{margin:0 0 .6rem;font-size:.8rem;color:var(--dim);font-weight:700}
.ar-sum{margin:0 0 1.3rem;font-size:1.04rem;font-weight:600;border-left:6px solid var(--acc);padding-left:.9rem}
.ar{max-width:46rem;margin:0 0 2rem}
.ar p{margin:0 0 1rem}
.ar-h3{margin:1.7rem 0 .6rem;font-size:1.06rem;font-weight:800;padding-bottom:.3rem;border-bottom:1px solid var(--line)}
.ar-ul{display:grid;gap:.42rem;margin:0 0 1.1rem}
.ar-ul li{padding-left:1.1rem;position:relative}
.ar-ul li::before{content:"—";position:absolute;left:0;color:var(--acc);font-weight:800}

/* ── 조문 ───────────────────────────────────────────────────── */
.doc{max-width:50rem;margin:0 0 1.4rem}
.art{padding:.85rem 0;border-bottom:1px solid var(--line2)}
.art-h{margin:0 0 .35rem;font-size:.98rem;font-weight:800;color:var(--ink)}
.art-p{margin:0;font-size:.92rem;color:var(--dim)}
.doc-f{font-size:.82rem;color:var(--dim);font-weight:700;margin:0 0 2rem}
.bz-n{margin:0;color:var(--dim);font-size:.92rem}
.rl-ol{display:grid;gap:.1rem;counter-reset:rl}
.rl-ol li{padding:.8rem 0 .8rem 2.3rem;border-bottom:1px solid var(--line2);position:relative;counter-increment:rl}
.rl-ol li::before{content:counter(rl,decimal-leading-zero);position:absolute;left:0;top:.9rem;
font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;color:var(--acc);font-size:.84rem}
.rl-ol h3{margin:0 0 .25rem;font-size:1rem;font-weight:800}
.rl-ol p{margin:0;font-size:.9rem;color:var(--dim)}

/* ── 바닥 ───────────────────────────────────────────────────── */
.ft{background:var(--ink2);color:#C3D5D2;margin-top:2rem}
.ft-in{max-width:var(--wrap);margin:0 auto;padding:2rem 1rem 1.4rem;
display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:1.6rem}
.ft-col-w{grid-column:span 1}
.ft-h{margin:0 0 .7rem;font-size:.82rem;font-weight:800;color:#fff;letter-spacing:.1em;text-transform:uppercase;
padding-bottom:.4rem;border-bottom:1px solid rgba(255,255,255,.17)}
.ft-p{margin:0 0 .85rem;font-size:.86rem}
.ft .tb{margin:0 0 .5rem}
.ft-h2{margin:0 0 .7rem;font-size:.78rem;color:#8FABA8;font-weight:700}
.ft-biz{margin:0;font-size:.75rem;color:#8FABA8}
.ft-dim{opacity:.72}
.ft-ul{display:grid;gap:.34rem;font-size:.87rem}
.ft-ul a{color:#C3D5D2;text-decoration:none}
.ft-ul a:hover{color:#fff;text-decoration:underline}
.ft-ul-g{grid-template-columns:repeat(3,1fr)}
.ft-ul-p li{display:grid}
.ft-ul-p time{font-size:.72rem;color:#7E9996;font-variant-numeric:tabular-nums}
.ft-feed{grid-auto-flow:column;justify-content:start;gap:.9rem;margin-top:.8rem;
padding-top:.7rem;border-top:1px solid rgba(255,255,255,.14)}
.ft-feed a{font-size:.78rem;font-weight:700;color:#9FBBB7}
.ft-note{margin:.7rem 0 0;font-size:.74rem;color:#7E9996}
.ft-note a{color:#9FBBB7}
.ft-bar{border-top:1px solid rgba(255,255,255,.13)}
.ft-bar>p{max-width:var(--wrap);margin:0 auto;padding:.8rem 1rem;font-size:.74rem;color:#7E9996;line-height:1.7}
.ft-ai strong{color:#B6CCC9}
.ft-cr{border-top:1px solid rgba(255,255,255,.08)}

/* ── 모바일 고정 바 ─────────────────────────────────────────── */
.cbar{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--ink);
border-top:3px solid var(--acc);padding:.5rem .7rem calc(.5rem + env(safe-area-inset-bottom));
display:grid;gap:.26rem;justify-items:center}
.cbar .tb{width:100%;justify-content:center}
.cbar-s{font-size:.7rem;color:#9FBBB7;font-weight:700}

@media (min-width:720px){
  .hd .tb{display:inline-flex}
  .cbar{display:none}
  main{padding-bottom:3rem}
  .hero{padding:2rem 1.8rem}
  .ft-col-w{grid-column:span 2}
  .fx-row{grid-template-columns:11rem 1fr}
}
@media (max-width:719px){
  .gnb{order:3;flex-basis:100%;border-top:1px solid rgba(255,255,255,.12);padding-top:.35rem;margin-top:.2rem}
  .ft-ul-g{grid-template-columns:repeat(2,1fr)}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
@media print{.hd,.cbar,.crumb,.lt-ul{display:none}body{background:#fff}}
`;

const JS = `/* 외부 의존성 없음. 하는 일은 둘뿐이다.
   ① 긴 지역 목록에서 지금 보고 있는 구로 스크롤을 맞춘다
   ② 전화 버튼이 눌렸을 때 같은 버튼이 여러 번 눌리는 것을 막는다
   서버가 내려준 HTML 을 바꾸지 않는다 — 같은 주소면 같은 HTML 이어야 한다. */
(function () {
  'use strict';
  var cur = document.querySelector('.gx-ul .on');
  if (cur && cur.scrollIntoView) {
    try { cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
  }
  var busy = false;
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.tb') : null;
    if (!a) return;
    if (busy) { e.preventDefault(); return; }
    busy = true;
    setTimeout(function () { busy = false; }, 1200);
  }, false);
})();
`;

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${INK}"/><g fill="none" stroke="${ACC}" stroke-linecap="round"><path d="M5 23c4-11 8.8-16.4 14.2-16.4 3.6 0 6.3 1.9 8.2 5.7" stroke-width="3"/><path d="M11 25.5c3-7.4 6.4-11 10-11 2.2 0 4 1.1 5.3 3.2" stroke-width="2" opacity=".55"/></g><circle cx="26" cy="7.6" r="2.6" fill="${ACC}"/></svg>`;

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 72"><rect width="320" height="72" fill="${INK}"/><g fill="none" stroke="${ACC}" stroke-linecap="round"><path d="M14 54c9-24 19.5-36 31.5-36 8 0 14 4.2 18.2 12.6" stroke-width="5"/><path d="M27 59c6.6-16.4 14.2-24.4 22.2-24.4 4.9 0 8.9 2.4 11.8 7.1" stroke-width="3.2" opacity=".55"/></g><circle cx="60" cy="20" r="5.6" fill="${ACC}"/><text x="86" y="40" font-family="Pretendard,'Apple SD Gothic Neo',sans-serif" font-size="27" font-weight="800" fill="#ffffff">리바이브모션</text><text x="86" y="57" font-family="Pretendard,sans-serif" font-size="11" font-weight="700" letter-spacing="3.4" fill="#9BB6B2">REVIVEMOTION</text></svg>`;

const OG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${INK}"/><rect x="0" y="0" width="1200" height="14" fill="${ACC}"/><g fill="none" stroke="${ACC}" stroke-linecap="round" opacity=".3"><path d="M-40 520c150-330 330-500 530-500 130 0 232 58 304 174" stroke-width="30"/><path d="M160 590c110-220 240-330 372-330 82 0 148 36 198 108" stroke-width="18"/></g><circle cx="834" cy="20" r="34" fill="${ACC}" opacity=".5"/><text x="80" y="300" font-family="Pretendard,'Apple SD Gothic Neo',sans-serif" font-size="82" font-weight="800" fill="#ffffff">리바이브모션</text><text x="80" y="372" font-family="Pretendard,sans-serif" font-size="27" font-weight="700" letter-spacing="9" fill="#9BB6B2">REVIVEMOTION</text><text x="80" y="452" font-family="Pretendard,'Apple SD Gothic Neo',sans-serif" font-size="34" font-weight="700" fill="#D6E3E1">출장마사지 · 홈타이 방문 관리</text><text x="80" y="508" font-family="Pretendard,'Apple SD Gothic Neo',sans-serif" font-size="27" font-weight="600" fill="#9BB6B2">시도 15곳 · 시군구 150곳 · 24시간 연중무휴 · 후불제</text></svg>`;

export function writeAssets(dist, cfg) {
  const dir = path.join(dist, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'revive.css'), CSS);
  fs.writeFileSync(path.join(dir, 'revive.js'), JS);
  fs.writeFileSync(path.join(dir, 'favicon.svg'), FAVICON);
  fs.writeFileSync(path.join(dir, 'logo.svg'), LOGO);
  fs.writeFileSync(path.join(dir, 'og.svg'), OG);
}
