// Thin wrappers around the serverless endpoints. The browser only ever learns
// names (for autocomplete) and per-guess scores (from /api/guess) — never the
// answer or any coordinates, until the game ends.

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

/** Today's puzzle metadata: { day, date, maxGuesses, totalCountries }. */
export function fetchPuzzle() {
  return getJson('/api/puzzle');
}

/** The country list for autocomplete: [{ id, ko, en, aliases }]. */
export async function fetchCountries() {
  const { countries } = await getJson('/api/countries');
  return countries;
}

/**
 * Score a guess. Returns the comparison plus the guessed country's names, and
 * the answer's names only once the game is over.
 * @returns {Promise<object>}
 */
export async function postGuess({ guessId, day, guessNumber }) {
  const res = await fetch('/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guessId, day, guessNumber }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const err = new Error('stale_puzzle');
    err.code = 'stale_puzzle';
    err.day = data.day;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || `POST /api/guess -> ${res.status}`);
  return data;
}
