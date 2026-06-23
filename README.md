# worldle

매일 바뀌는 나라 한 곳을, **거리·방향·근접도** 힌트만으로 6번 안에 맞히는 지리 퍼즐.
Wordle에서 착안한 일일 퍼즐 형식이며, 배경에는 자전하는 **로우폴리 지구본**이 깔립니다.

> 지구본은 일부러 국경·해안선이 없는 저면(low-poly) 형태입니다. 보고 답을 읽어낼 수 없으므로 컨닝 방지가 됩니다. **정답과 좌표는 서버에만 존재**하고, 브라우저로는 절대 내려가지 않습니다.

---

## 구조

```
worldle/
├── api/                      # 서버리스 함수 (Vercel) — 정답·좌표는 여기서만
│   ├── _lib/
│   │   ├── countries.js      #   국가 데이터 단일 진실 공급원 (이름+좌표)
│   │   ├── geo.js            #   대권 거리·방위·근접도 계산
│   │   ├── daily.js          #   날짜 기반 결정론적 일일 정답 선정
│   │   ├── config.js         #   공용 설정(최대 시도 횟수 등)
│   │   └── http.js           #   JSON 응답 헬퍼
│   ├── puzzle.js             # GET  /api/puzzle    오늘 퍼즐 메타(정답 없음)
│   ├── countries.js          # GET  /api/countries 자동완성용 이름 목록(좌표 없음)
│   └── guess.js              # POST /api/guess     추측 채점(거리·방향·근접도)
├── public/                   # 정적 프런트엔드 (빌드 불필요)
│   ├── index.html
│   ├── css/                  # reset · tokens(디자인 토큰) · globe · game
│   ├── js/
│   │   ├── main.js           #   부트스트랩/배선
│   │   ├── api.js · state.js · i18n.js
│   │   ├── ui/               #   board · input(자동완성) · share
│   │   └── globe/globe.js    #   Three.js 로우폴리 지구본
│   └── assets/favicon.svg
├── scripts/dev-server.mjs    # 무의존성 로컬 서버 (정적 + /api 라우팅)
├── vercel.json               # 라우팅·보안 헤더
└── package.json              # type: module, 의존성 없음
```

설계 원칙: **함수(api)·스크립트(js)·스타일(css)을 역할별로 폴더링**, 빌드 단계 없음(바닐라 ES 모듈 + CDN).

---

## 로컬에서 실행

Node 18 이상이면 추가 설치 없이 됩니다.

```bash
npm run dev        # = node scripts/dev-server.mjs
# http://localhost:3000
```

이 개발 서버는 `public/`을 정적으로 서빙하고 `/api/*` 요청을 Vercel과 동일한 핸들러 파일로 라우팅합니다. Vercel CLI는 필요 없습니다.

---

## 게임 방식

- 매일 KST 자정에 전 세계 공통 정답 국가 1곳이 정해집니다(데이터베이스 없이 날짜로부터 결정론적 선정, 한 바퀴 도는 동안 중복 없음).
- 국가명을 추측하면 정답까지의 **거리(km)**, **8방위 화살표**, **근접도(%)**를 돌려줍니다.
- 6번 안에 맞히면 승리. 결과는 스포일러 없는 이모지 그리드로 공유할 수 있습니다.
- 진행 상황은 그날 한정으로 `localStorage`에 저장되어 새로고침해도 유지됩니다.

거리·방위는 평면이 아니라 **구면 대권(great-circle)** 기준이라, 태평양을 가로지르는 경우(예: 일본↔미국)에도 방향이 정확합니다.

---

## 배포 (Vercel)

1. 이 저장소를 GitHub에 올립니다.
2. [Vercel](https://vercel.com)에서 New Project → 이 저장소 Import.
3. 프레임워크 프리셋은 **Other**, 빌드 설정은 비워둡니다. Vercel이 `public/`을 정적 루트로, `api/`를 서버리스 함수로 자동 인식합니다.
4. **Settings → Environment Variables**에 `WORLDLE_SEED`를 추가합니다(아무 정수). 이 값이 일일 정답 순서를 결정하는 비밀 시드입니다 — 공개 저장소에는 다른 기본값만 들어 있으므로, 이 환경변수를 설정해야 소스만 보고 정답을 계산할 수 없습니다. 변경하면 그날 이후 정답 순서가 바뀌니 한 번 정하면 유지하세요.
5. 배포 후 Project → Settings → Domains에서 `worldle.kr`을 연결하고 DNS를 안내대로 설정합니다.

> `vercel.json`에는 `cleanUrls`와 기본 보안 헤더가 들어 있습니다. CDN(`cdn.jsdelivr.net`)에서 Three.js를 불러오므로, CSP를 추가한다면 `script-src`/`connect-src`에 해당 도메인을 허용해야 합니다.
>
> 로컬 개발에서는 `WORLDLE_SEED` 없이도 기본 시드로 동작합니다(운영과는 다른 순서).

---

## 데이터 수정

국가를 추가/수정하려면 `api/_lib/countries.js`의 `COUNTRIES` 배열만 고치면 됩니다.
각 항목은 `{ id, ko, en, lat, lon, aliases? }` 형식입니다. 좌표는 브라우저로 노출되지 않으며, 이름 목록은 `/api/countries`가 좌표를 제거하고 내려줍니다.

`aliases`는 검색 편의용 별칭(예: `미국` → `usa`, `america`)으로, 화면에는 표시되지 않습니다.

---

## 라이선스

개인 프로젝트. 원하는 대로 사용하세요.
