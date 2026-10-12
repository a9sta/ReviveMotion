# 문구를 고칠 때

## 어디를 고치면 무엇이 바뀌는가

| 고칠 곳 | 영향 범위 |
|---|---|
| `src/content/copy.mjs` `GU_LEAD_A/B/C` | 구 페이지 150쪽의 리드 세 문단. 틀 10 × 7 × 6 = 420조합 |
| `src/content/copy.mjs` `SIDO_LEAD` | 시도 15쪽 |
| `src/content/copy.mjs` `FAQ_POOL` | 전 계층. 쪽마다 시드로 4~6개를 골라 답변까지 갈아 끼운다 |
| `src/content/copy.mjs` `NOTICE` | 주의 구역. 12개 중 4개를 시드로 고른다 |
| `src/content/copy.mjs` `SEC` | 구역 제목·부제 |
| `src/content/copy.mjs` `ANCHOR` | 롱테일 링크 글자. **한 틀로 전부 찍으면 구 페이지끼리 겹친다** |
| `src/content/copy.mjs` `STEP_SETS` | 접수 흐름. 세 벌을 돌려 쓴다 |
| `src/lib/seo.mjs` | 타이틀·디스크립션. 여기만 바꿔도 310쪽 전부 바뀐다 |
| `data/courses.json` | 코스 이름·금액·압·속도·부위·설명 |
| `src/content/posts.mjs` | 기록 글 |

## 틀을 새로 쓸 때 지킬 것

**① 그 구에서만 나오는 값을 끼운다.**
쓸 수 있는 값은 `src/pages/region.mjs` 의 `guCtx()` 가 넘긴다 —
`dongCount` · `area` · `spanKm`(구 안 최대 거리) · `kc`(시도 중심에서의 거리) ·
`dir`(방위) · `rankPhrase`(면적 순위) · `n0~n2`·`k0~k2`(가까운 구 셋과 각 거리) ·
`crossSido`·`crossGu`·`crossKm`(시도를 넘는 가장 가까운 구).
숫자나 지명이 하나도 안 들어간 틀은 150쪽에 똑같이 깔린다.

**② 조사를 직접 쓰지 않는다.**
`withJosa(word, '은/는')` 를 쓴다. `구`로 끝나는 이름과 `군`·`시`로 끝나는 이름의
받침이 달라 직접 쓰면 비문이 나온다.

**③ 쓰기 전에 대조한다.**
```
# 후보 문장을 한 줄에 하나씩 넣고
cat cands.txt | python3 /root/msg-daily/phrase-check.py
```
tk 엔진 126사와 대조한다. **루네사(Netlify)는 이 코퍼스에 없으므로** 따로 본다 —
렌더된 `dist` 를 문장 단위로 견주고, 지명·숫자를 가린 **골격**도 견준다.
단어만 바꾼 문장은 완전일치 검사를 통과하고 골격 검사에서 터진다.

## 쓰지 않는 표현

- 후기·체험담·"고객님들이 많이 찾는" 같은 지어낸 사회적 증거
- 평점·별점·만족도 숫자
- "치료", "교정", "완화됩니다" 같은 의료 효과 단정 — 의료 행위가 아니다
- "전 업소 여성 전용" 류의 단정 — 뒷받침할 자료가 없다
- 전화번호 숫자를 산문에 적는 것 — `telBtn()` 버튼 안에서만 보여 준다
