// Bilingual strings (KO default, EN secondary). Values are either plain strings
// or functions for interpolation. Static markup is translated via data-i18n /
// data-i18n-attr attributes; dynamic strings are read with t().

const STRINGS = {
  ko: {
    langButton: 'EN',           // label shown on the toggle (the *other* language)
    langButtonLabel: '영어로 전환', // accessible name (names the language it switches to)
    htmlLang: 'ko',
    help: '도움말',
    inputPlaceholder: '국가명 입력',
    guess: '추측',
    share: '결과 공유',
    nextPuzzle: '다음 퍼즐까지',
    footnote: '거리·방향·근접도만으로 추리하세요.',
    howToTitle: '플레이 방법',
    howTo1: '매일 전 세계 공통으로 정답 국가 한 곳이 정해집니다.',
    howTo2: '국가명을 추측하면 정답까지의 거리, 방향, 근접도를 알려줍니다.',
    howTo3: '근접도 100%에 가까울수록 정답에 가깝습니다.',
    howTo4: '6번 안에 정답 국가를 맞히세요.',
    close: '닫기',

    meta: (day, date) => `일일 퍼즐 #${day} · ${date}`,
    attemptsLeft: (n) => `남은 시도 ${n}회`,
    notFound: '목록에 없는 국가입니다.',
    already: '이미 추측한 국가입니다.',
    correctName: '정답',
    win: (name, tries) => `정답! ${name} >> ${tries}번 만에 맞혔습니다!!`,
    lose: (name) => `아쉽네요. 정답은 ${name}였습니다.`,
    copied: '결과를 클립보드에 복사했어요.',
    copyFailed: '복사에 실패했어요. 직접 선택해 복사해 주세요.',
    shareHeader: (day, result) => `Worldle 일일 #${day} ${result}`,
    km: (n) => `약 ${n.toLocaleString('ko-KR')} km`,
    stale: '새 퍼즐이 시작됐어요. 새로고침합니다.',
    loadError: '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    langButton: '한국어',
    langButtonLabel: 'Switch to Korean',
    htmlLang: 'en',
    help: 'How to play',
    inputPlaceholder: 'Enter a country',
    guess: 'Guess',
    share: 'Share result',
    nextPuzzle: 'Next puzzle in',
    footnote: 'Reason from distance, direction and proximity.',
    howToTitle: 'How to play',
    howTo1: 'One answer country is chosen each day, the same for everyone.',
    howTo2: 'Each guess reveals the distance, direction and proximity to the answer.',
    howTo3: 'The closer proximity is to 100%, the nearer you are.',
    howTo4: 'Find the answer country within 6 guesses.',
    close: 'Close',

    meta: (day, date) => `Daily #${day} · ${date}`,
    attemptsLeft: (n) => `${n} ${n === 1 ? 'guess' : 'guesses'} left`,
    notFound: 'That country is not on the list.',
    already: 'You already guessed that country.',
    correctName: 'Correct',
    win: (name, tries) => `Correct! ${name} >> solved in ${tries}!!`,
    lose: (name) => `So close. The answer was ${name}.`,
    copied: 'Result copied to clipboard.',
    copyFailed: 'Copy failed. Please select and copy manually.',
    shareHeader: (day, result) => `Worldle Daily #${day} ${result}`,
    km: (n) => `~${n.toLocaleString('en-US')} km`,
    stale: 'A new puzzle has started. Reloading.',
    loadError: 'Could not load data. Please try again shortly.',
  },
};

let lang = 'ko';

export function getLang() { return lang; }

export function setLang(next) {
  lang = STRINGS[next] ? next : 'ko';
  document.documentElement.lang = STRINGS[lang].htmlLang;
  return lang;
}

export function toggleLang() {
  return setLang(lang === 'ko' ? 'en' : 'ko');
}

/** Read a string (or call an interpolating function) for the current language. */
export function t(key, ...args) {
  const v = STRINGS[lang][key];
  return typeof v === 'function' ? v(...args) : v ?? key;
}

/** Country display name in the current language. */
export function countryName(country) {
  return lang === 'ko' ? country.ko : country.en;
}

/** Apply translations to all [data-i18n] / [data-i18n-attr] nodes under root. */
export function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    // Format: "attr:key" (e.g. "placeholder:inputPlaceholder", "aria-label:help")
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}
