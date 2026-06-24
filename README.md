# Worldle

> **매일 바뀌는 나라 한 곳을 거리·방향·근접도 힌트만으로 6번 안에 맞히는 지리 퍼즐**

🌐 **Live**: https://worldle.kr · **Repository**: https://github.com/JTech-CO/worldle

## 1. 소개 (Introduction)

Worldle은 Wordle에서 착안한 **일일 지리 퍼즐** 웹 애플리케이션입니다.
매일 KST 자정에 전 세계 공통 정답 국가 한 곳이 정해지고, 플레이어는 국가명을 추측해 정답까지의
**거리·방향·근접도** 힌트를 받아 6번 안에 맞힙니다.

정답과 좌표는 **서버에만 존재**해 소스 보기로 컨닝할 수 없으며, 배경에는 자전하는
**로우폴리 지구본과 우주 풍경**이 깔립니다.

**주요 기능**
- **일일 퍼즐**: KST 자정 기준 전 세계 공통 정답 1개 (DB 없이 날짜로부터 결정론적 선정)
- **추리 힌트**: 구면 대권(great-circle) 거리 · 8방위 화살표 · 근접도 % (거리는 근사값으로 표시)
- **컨닝 방지**: 정답·좌표는 서버리스 함수에만 두고, 브라우저에는 국가명과 채점 결과만 전달
- **우주 배경 (Three.js)**: 실제 랜드마스크 기반 로우폴리 지구본, 반짝이는 별, 실제 여름 별자리, 달·인공위성 (드래그로 회전)
- **편의 기능**: 한국어/English 전환, 국가명 자동완성, 결과 공유, 진행 상황 자동 저장

## 2. 기술 스택 (Tech Stack)

- **Frontend**: Vanilla JavaScript (ES Modules, 빌드 단계 없음), HTML, CSS
- **3D / Graphics**: Three.js (CDN importmap)
- **Backend**: Vercel Serverless Functions (Node.js, ESM)
- **State**: 브라우저 `localStorage` (일자별 진행 저장)
- **Deployment**: Vercel (worldle.kr)

## 3. 설치 및 실행 (Quick Start)

**요구 사항**: Node.js 18 이상 (개발 서버의 자동 재시작은 20+ 권장) · 외부 의존성 없음

1. **설치 (Install)**
   ```bash
   git clone https://github.com/JTech-CO/worldle.git
   cd worldle
   # 외부 의존성이 없어 npm install 은 필요하지 않습니다
   ```

2. **환경 변수 (Environment)**
   일일 정답의 순서를 결정하는 비밀 시드입니다. **운영(Vercel)** 에서 환경 변수로 설정하면
   공개된 소스만으로는 정답을 계산할 수 없습니다.
   ```bash
   WORLDLE_SEED=<임의의 정수>
   ```
   로컬 개발에서는 설정하지 않아도 기본 시드로 동작합니다(운영과는 다른 순서).

3. **실행 (Run)**
   ```bash
   npm run dev      # = node --watch scripts/dev-server.mjs
   # http://localhost:3000
   ```
   의존성 없는 로컬 서버가 `public/`을 정적으로 서빙하고 `/api/*`를 Vercel과 동일한 핸들러로 라우팅합니다.

## 4. 폴더 구조 (Structure)

```text
worldle/
├── api/                    # 서버리스 함수 — 정답·좌표는 서버에만
│   ├── _lib/               #   countries · geo(거리·방위) · daily(일일 선정) · http
│   ├── puzzle.js           #   GET  오늘 퍼즐 메타
│   ├── countries.js        #   GET  자동완성용 이름 목록 (좌표 제외)
│   └── guess.js            #   POST 추측 채점 (거리·방향·근접도)
├── public/                 # 정적 프런트엔드 (빌드 불필요)
│   ├── css/                #   tokens · game · globe 스타일
│   ├── js/                 #   main · api · state · i18n · ui/* · globe/*
│   └── assets/             #   favicon, 랜드마스크 이미지
├── scripts/dev-server.mjs  # 의존성 없는 로컬 개발 서버
├── vercel.json             # 라우팅·보안 헤더
└── package.json
```

## 5. 정보 (Info)

- **License**: 개인 프로젝트 (자유 사용)
- **Contact**: GitHub [@JTech-CO](https://github.com/JTech-CO) · https://jtech-co.github.io
