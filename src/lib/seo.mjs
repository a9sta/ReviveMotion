/**
 * 타이틀·디스크립션 정본.
 *
 * ── 왜 이 틀인가 ───────────────────────────────────────────────────────────
 * 경쟁사 두 갈래를 보고 정했다(2026-10-11 사용자 캡처 분석 · 자세한 것은
 * netlify-competitor-title-formula 메모리).
 *   A) netlify 계열 : 지역경로를 다 적고 동마다 코스어를 바꾼다. 하지만 **설명에
 *      지역어가 한 번도 안 나온다**.
 *   B) 도메인 계열   : 3토막 파이프 제목은 좋은데 **설명 둘째·셋째 문장이 글자까지 같다**.
 * 양쪽 약점을 둘 다 피한다 — 설명 첫머리에 지역경로를 두고, 가운데를 **그 구의
 * 실제 숫자**(행정동 개수·면적·가까운 구와의 거리)로 채워 150개가 전부 갈리게 한다.
 *
 * ★루네사(lunessa)와 제목 틀이 겹치면 안 된다. 루네사는
 *   `{구} 출장 {코스어} 마사지·홈타이 - 루네사 | {시도} {행동어}` 꼴이다.
 *   이쪽은 토막 순서와 연결어를 바꿨다 —
 *   `{구} 출장마사지 {코스어} 홈타이 | {시도} {구} 방문 {행동어} - 리바이브모션`.
 *   '마사지'는 제목에 **한 번만** 넣는다(스터핑 방지).
 * ★'여성전용마사지' 키워드는 넣지 않는다. 이 사이트는 업소를 싣지 않아 그 말을
 *   뒷받침할 자료가 없고, 단정하면 허위 표기가 된다.
 */
import { hash, km, km2 } from './util.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];

export const BRAND = '리바이브모션';
const KEY = '출장마사지·홈타이 방문 관리';

/** 제목 가운데에 끼우는 코스어 — 실제로 받는 여덟 가지에서만 돌린다. */
const COURSE_WORD = ['스웨디시', '딥티슈', '타이', '아로마', '스포츠', '림프', '건식', '경락'];
/** 구 제목 꼬리 행동어 */
const GU_ACT = ['예약 문의', '당일 접수', '심야 접수', '시각 안내', '출장 접수'];

export function courseWord(seed, slot = 0) {
  return at(hash(seed, 'cw'), COURSE_WORD, slot);
}

/* ── 제목 ─────────────────────────────────────────────────────────── */
export const title = {
  home: () => `${BRAND} 출장마사지 | 전국 15개 시도 시군구 홈타이·방문 관리 24시`,
  areaHub: (c) => `전국 시군구 ${c.gu}곳 출장마사지 지역 목록 | 홈타이 방문 관리 - ${BRAND}`,
  sido: (sd) => `${sd.name} 출장마사지·홈타이 | ${sd.name} 시군구 ${sd.gu.length}곳 방문 관리 - ${BRAND}`,
  gu: (sd, g) => {
    const h = hash(sd.name, g.name, 'title');
    return `${g.name} 출장마사지 ${at(h, COURSE_WORD, 0)} 홈타이 | ${sd.name} ${g.name} 방문 ${at(h, GU_ACT, 1)} - ${BRAND}`;
  },
  course: (c) => `${c.ko} 출장마사지 홈타이 | 압 ${c.pressure}·${c.min}분 ${c.price.toLocaleString('ko-KR')}원 - ${BRAND}`,
  sidoCourse: (sd, c) => `${sd.name} ${c.ko} 출장마사지 | ${sd.name} 홈타이 방문 ${at(hash(sd.name, c.slug), GU_ACT)} - ${BRAND}`,
  page: (t) => `${t} | ${BRAND} 출장마사지·홈타이`,
  post: (p) => `${p.title} | ${BRAND} 방문 관리 기록`,
};

/* ── 디스크립션 ───────────────────────────────────────────────────── */
/** 구 설명 가운데 문장 — 그 구에서만 나오는 숫자로 짠다. */
function guMiddle(sd, g, h) {
  const n0 = g.near[0], n1 = g.near[1];
  const frames = [
    () => `행정동 ${g.dongCount}곳 ${km2(g.area)}, ${n0.gu}까지 ${km(n0.km)}`,
    () => `${sd.name} ${g.dir}편이라 ${n0.gu}·${n1.gu}와 같은 권역`,
    () => `${n0.gu}(${km(n0.km)})·${n1.gu}(${km(n1.km)})와 맞물린 자리`,
    () => `행정동 ${g.dongCount}곳을 모두 받고 ${n0.gu} 경계까지 ${km(n0.km)}`,
    () => `${km2(g.area)}에 행정동 ${g.dongCount}곳, ${sd.name} 중심에서 ${km(g.kmFromCenter)}`,
    () => `${sd.name} ${g.dir}편 ${g.dongCount}개 동, 가까운 ${n0.gu}까지 ${km(n0.km)}`,
  ];
  return frames[parseInt(h.substr(6, 3), 16) % frames.length]();
}
const TAIL = [
  '안심번호로 접수하고 끝난 뒤 계산합니다',
  '값은 마치고 내며 24시간 받습니다',
  '선입금 없이 예약 문의 한 통으로 접수합니다',
  '심야 할증을 두지 않고 연중무휴 받습니다',
  '교통비를 따로 붙이지 않고 후불로 받습니다',
];

export const desc = {
  home: () =>
    '서울·부산·대구·인천·광주·대전·울산·경기·강원·충청·전라·경상 시군구 150곳 출장마사지·홈타이 방문 관리. 사는 시군구를 눌러 거리와 도착 시각을 먼저 확인하고, 안심번호로 접수해 끝난 뒤 계산합니다.',
  areaHub: (c) =>
    `출장마사지·홈타이를 받는 전국 시군구 ${c.gu}곳을 시도별로 펼쳐 두었습니다. 구마다 행정동 개수와 넓이, 가까운 구까지의 거리를 함께 적어 도착 시각이 왜 다른지 알 수 있게 했습니다.`,
  sido: (sd) =>
    `${sd.name} ${KEY} 안내. 시군구 ${sd.gu.length}곳·행정동 ${sd.dongCount}곳을 받으며 ${sd.gu[0].name}부터 ${sd.gu[sd.gu.length - 1].name}까지 같은 번호로 접수합니다. 후불·24시간.`,
  gu: (sd, g) => {
    const h = hash(sd.name, g.name, 'desc');
    return `${sd.name} ${g.name} ${KEY}. ${guMiddle(sd, g, h)}. ${TAIL[parseInt(h.substr(9, 3), 16) % TAIL.length]}.`;
  },
  course: (c) =>
    `${c.ko} 출장마사지 방문 안내. ${c.focus} 위주로 압은 ${c.pressure}, 속도는 ${c.tempo}입니다. ${c.min}분 ${c.price.toLocaleString('ko-KR')}원이며 전국 시군구 어디든 같은 값으로 받습니다.`,
  sidoCourse: (sd, c) =>
    `${sd.name} ${c.ko} ${KEY}. ${c.for} 고르는 코스로 ${c.focus}에 시간을 씁니다. ${sd.name} 시군구 ${sd.gu.length}곳 전부 ${c.min}분 ${c.price.toLocaleString('ko-KR')}원입니다.`,
  post: (p) => p.summary,
};

/** 설명이 예산을 넘기면 문장 단위로 자른다(어중간하게 끊기지 않게). */
export function clampDesc(s, limit = 155) {
  if (s.length <= limit) return s;
  const parts = s.split(/(?<=\.)\s+/);
  let out = '';
  for (const p of parts) {
    if ((out + p).length > limit) break;
    out += (out ? ' ' : '') + p;
  }
  return out || s.slice(0, limit - 1) + '…';
}
