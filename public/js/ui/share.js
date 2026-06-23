// Build a spoiler-free, Wordle-style share grid and copy it. Emoji here are the
// genre convention for a shareable result (not decorative UI), so they stay.
import { t } from '../i18n.js';

const ARROW_EMOJI = {
  N: '⬆️', NE: '↗️', E: '➡️', SE: '↘️', S: '⬇️', SW: '↙️', W: '⬅️', NW: '↖️',
};

// 5-cell proximity bar per guess, filled from proximity %.
function proximityCells(pct) {
  const filled = Math.round(pct / 20);
  return '🟩'.repeat(filled) + '⬜'.repeat(5 - filled);
}

function guessLine(result) {
  if (result.correct) return '🟩🟩🟩🟩🟩🎯';
  return proximityCells(result.proximityPct) + (ARROW_EMOJI[result.compass] || '');
}

/** The shareable text block. */
export function buildShareText(store) {
  const solved = store.status === 'won';
  const score = solved ? `${store.guesses.length}/${store.maxGuesses}` : `X/${store.maxGuesses}`;
  const lines = store.guesses.map(guessLine);
  const url = location.origin.replace(/\/$/, '');
  return [t('shareHeader', store.day, score), ...lines, url].join('\n');
}

/**
 * Share the result. Prefers the native share sheet, falls back to clipboard.
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
export async function shareResult(store) {
  const text = buildShareText(store);
  try {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      await navigator.share({ text });
      return 'shared';
    }
  } catch {
    // user cancelled or share unavailable — fall through to copy
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
