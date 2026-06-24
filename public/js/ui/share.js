// Spoiler-free Wordle-style share grid. Emoji are genre convention, not UI, so they stay.
import { t } from '../i18n.js';

const ARROW_EMOJI = {
  N: '⬆️', NE: '↗️', E: '➡️', SE: '↘️', S: '⬇️', SW: '↙️', W: '⬅️', NW: '↖️',
};

function proximityCells(pct) {
  const filled = Math.round(pct / 20);
  return '🟩'.repeat(filled) + '⬜'.repeat(5 - filled);
}

function guessLine(result) {
  if (result.correct) return '🟩🟩🟩🟩🟩🎯';
  return proximityCells(result.proximityPct) + (ARROW_EMOJI[result.compass] || '');
}

export function buildShareText(store) {
  const solved = store.status === 'won';
  const score = solved ? `${store.guesses.length}/${store.maxGuesses}` : `X/${store.maxGuesses}`;
  const lines = store.guesses.map(guessLine);
  const url = location.origin.replace(/\/$/, '');
  return [t('shareHeader', store.day, score), ...lines, url].join('\n');
}

// Prefers the native share sheet, falls back to clipboard.
export async function shareResult(store) {
  const text = buildShareText(store);
  try {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      await navigator.share({ text });
      return 'shared';
    }
  } catch {
    // cancelled or unavailable — fall through to copy
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
