// Serverless endpoint wrappers. Anti-cheat: browser learns names and per-guess scores only — never the answer or coordinates until game over.

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

export function fetchPuzzle() {
  return getJson('/api/puzzle');
}

export async function fetchCountries() {
  const { countries } = await getJson('/api/countries');
  return countries;
}

// Score a guess; answer names returned only once the game is over.
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
