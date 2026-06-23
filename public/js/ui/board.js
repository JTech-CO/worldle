// Renders the guess board: one row per guess, padded with empty rows up to
// maxGuesses so the layout height is stable from the start.
import { countryName, t } from '../i18n.js';

const NEAR = 80; // proximity % thresholds for the single-hue meter color
const MID = 40;

function proximityClass(pct) {
  if (pct >= NEAR) return 'is-near';
  if (pct >= MID) return 'is-mid';
  return 'is-far';
}

function filledRow(result, justAdded) {
  const li = document.createElement('li');
  li.className = 'guess-row is-filled';
  if (result.correct) {
    li.classList.add('is-correct');
  } else {
    li.classList.add(proximityClass(result.proximityPct));
  }
  if (!justAdded) li.style.animation = 'none';

  const name = document.createElement('span');
  name.className = 'g-name';
  name.textContent = countryName(result.guess);

  const dist = document.createElement('span');
  dist.className = 'g-dist';
  dist.textContent = result.correct ? t('correctName') : t('km', result.distanceKm);

  const arrow = document.createElement('span');
  arrow.className = 'g-arrow';
  arrow.textContent = result.arrow;
  arrow.setAttribute('aria-label', result.correct ? t('correctName') : result.compass);

  const prox = document.createElement('span');
  prox.className = 'g-prox';
  prox.textContent = `${result.proximityPct}%`;

  const meter = document.createElement('span');
  meter.className = 'g-meter';
  meter.style.setProperty('--p', `${result.proximityPct}%`);

  li.append(name, dist, arrow, prox, meter);
  return li;
}

function emptyRow() {
  const li = document.createElement('li');
  li.className = 'guess-row is-empty';
  li.setAttribute('aria-hidden', 'true');
  return li;
}

/**
 * Render the whole board.
 * @param {HTMLElement} boardEl
 * @param {{ guesses: object[], maxGuesses: number }} store
 * @param {number} [animateIndex] index of a row to animate in (the newest)
 */
export function renderBoard(boardEl, store, animateIndex = -1) {
  boardEl.replaceChildren();
  for (let i = 0; i < store.maxGuesses; i++) {
    if (i < store.guesses.length) {
      boardEl.appendChild(filledRow(store.guesses[i], i === animateIndex));
    } else {
      boardEl.appendChild(emptyRow());
    }
  }
}
