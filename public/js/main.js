// App bootstrap: load data, wire the UI, run the daily game loop.
import { fetchPuzzle, fetchCountries, postGuess } from './api.js';
import { createGameStore } from './state.js';
import { renderBoard } from './ui/board.js';
import { createCombobox } from './ui/input.js';
import { shareResult } from './ui/share.js';
import { setLang, toggleLang, applyStaticI18n, t, countryName } from './i18n.js';

const el = (id) => document.getElementById(id);

const dom = {
  board: el('guess-board'),
  form: el('guess-form'),
  input: el('guess-input'),
  submit: el('guess-submit'),
  suggestions: el('suggestions'),
  message: el('message'),
  meta: el('puzzle-meta'),
  endgame: el('endgame'),
  endgameTitle: el('endgame-title'),
  shareBtn: el('share-btn'),
  countdown: el('countdown'),
  langToggle: el('lang-toggle'),
  helpToggle: el('help-toggle'),
  helpDialog: el('help-dialog'),
};

let store = null;
let combo = null;

function setMessage(text, kind = '') {
  dom.message.textContent = text;
  dom.message.className = `message${kind ? ` is-${kind}` : ''}`;
}

function answerName() {
  const withAnswer = store.guesses.find((g) => g.answer);
  return withAnswer ? countryName(withAnswer.answer) : '';
}

function renderMeta() {
  dom.meta.textContent = t('meta', store.day, store.date);
}

function renderStatus() {
  if (store.status === 'won') {
    setMessage(t('win', answerName(), store.guesses.length), 'win');
  } else if (store.status === 'lost') {
    setMessage(t('lose', answerName()), 'error');
  } else {
    setMessage(t('attemptsLeft', store.attemptsLeft));
  }
}

function renderEndgame() {
  if (!store.isOver) {
    dom.endgame.hidden = true;
    return;
  }
  dom.endgame.hidden = false;
  dom.endgameTitle.textContent =
    store.status === 'won'
      ? t('win', answerName(), store.guesses.length)
      : t('lose', answerName());
  combo.setDisabled(true);
  dom.submit.disabled = true;
}

function renderAll(animateIndex = -1) {
  renderMeta();
  renderBoard(dom.board, store, animateIndex);
  renderStatus();
  renderEndgame();
}

async function submitGuess(country) {
  if (!country || store.isOver) return;
  if (store.hasGuessed(country.id)) {
    setMessage(t('already'), 'error');
    return;
  }
  dom.submit.disabled = true;
  try {
    const result = await postGuess({
      guessId: country.id,
      day: store.day,
      guessNumber: store.guesses.length + 1,
    });
    const count = store.addGuess(result);
    combo.clear();
    renderAll(count - 1);
    if (!store.isOver) {
      dom.submit.disabled = false;
      combo.focus();
    } else {
      // renderEndgame just disabled the focused input; move focus to the result
      // region so keyboard/SR users aren't dropped to <body>.
      dom.endgame.focus();
    }
  } catch (err) {
    if (err.code === 'stale_puzzle') {
      setMessage(t('stale'), 'error');
      setTimeout(() => location.reload(), 1200);
      return;
    }
    setMessage(t('loadError'), 'error');
    dom.submit.disabled = false;
  }
}

function onSubmit(e) {
  e.preventDefault();
  if (store.isOver) return;
  if (combo.isComposing()) return; // a Hangul-commit Enter can still reach native submit
  const country = combo.resolveInput();
  if (!country) {
    setMessage(t('notFound'), 'error');
    return;
  }
  submitGuess(country);
}

function refreshLanguage() {
  applyStaticI18n();
  dom.langToggle.textContent = t('langButton');
  dom.langToggle.setAttribute('aria-label', t('langButtonLabel'));
  renderAll();
}

// ---------- Countdown to the next puzzle (KST midnight) ----------
function msUntilNextKstMidnight() {
  const now = Date.now();
  const KST = 9 * 3600 * 1000;
  const kstDay = Math.floor((now + KST) / 86_400_000);
  return (kstDay + 1) * 86_400_000 - KST - now;
}

function startCountdown() {
  function tick() {
    const ms = msUntilNextKstMidnight();
    if (ms <= 0) { location.reload(); return; }
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    dom.countdown.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
}

function wireChrome() {
  dom.langToggle.addEventListener('click', () => { toggleLang(); refreshLanguage(); });
  dom.helpToggle.addEventListener('click', () => dom.helpDialog.showModal());
  dom.shareBtn.addEventListener('click', async () => {
    const outcome = await shareResult(store);
    if (outcome === 'copied') setMessage(t('copied'), 'win');
    else if (outcome === 'failed') setMessage(t('copyFailed'), 'error');
  });
  dom.form.addEventListener('submit', onSubmit);
}

// Satellite "warp": a black circle grows from (x,y) to fill the screen (~1s),
// one full-screen flash pulse, then navigate away.
function warpFromSatellite(x, y) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const maxR = Math.ceil(Math.hypot(Math.max(x, W - x), Math.max(y, H - y)));
  const start = `circle(0px at ${x}px ${y}px)`;
  const end = `circle(${maxR}px at ${x}px ${y}px)`;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;pointer-events:none;'
    + 'transition:clip-path 0.75s ease-in,-webkit-clip-path 0.75s ease-in;';
  ov.style.clipPath = start;
  ov.style.webkitClipPath = start;
  document.body.appendChild(ov);
  void ov.offsetWidth; // reflow so the transition runs
  ov.style.clipPath = end;
  ov.style.webkitClipPath = end;

  setTimeout(() => {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#fff;opacity:0;'
      + 'pointer-events:none;transition:opacity 170ms ease-out;';
    document.body.appendChild(flash);
    void flash.offsetWidth;
    flash.style.opacity = '0.5';
    setTimeout(() => { flash.style.opacity = '0'; }, 170);
    setTimeout(() => { window.location.href = 'https://jtech-co.github.io/'; }, 380);
  }, 750);
}

async function startGlobe() {
  try {
    const { initGlobe } = await import('./globe/globe.js');
    initGlobe(el('globe-canvas'), { onWarp: warpFromSatellite });
  } catch {
    // WebGL or CDN unavailable — the CSS backdrop remains. Game is unaffected.
  }
}

async function main() {
  setLang(navigator.language?.startsWith('en') ? 'en' : 'ko');
  applyStaticI18n();
  dom.langToggle.textContent = t('langButton');
  dom.langToggle.setAttribute('aria-label', t('langButtonLabel'));
  startGlobe();

  let puzzle;
  let countries;
  try {
    [puzzle, countries] = await Promise.all([fetchPuzzle(), fetchCountries()]);
  } catch {
    setMessage(t('loadError'), 'error');
    dom.submit.disabled = true;
    return;
  }

  store = createGameStore(puzzle);
  combo = createCombobox({ input: dom.input, list: dom.suggestions });
  combo.setCountries(countries);
  combo.onPick(submitGuess);

  wireChrome();
  renderAll();
  startCountdown();

  if (!store.isOver) combo.focus();
}

main();
