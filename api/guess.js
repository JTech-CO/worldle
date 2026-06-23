// POST /api/guess — score one guess against today's hidden answer.
//
// Request body: { guessId: string, day: number, guessNumber?: number }
// Response:     { correct, distanceKm, compass, arrow, proximityPct,
//                 guess: { id, ko, en }, answer? }
//
// The answer's identity is included ONLY when the game is over (a correct guess
// or the final allowed guess). Coordinates are never sent. The requested `day`
// must equal today's puzzle, which stops clients from probing future answers.

import { COUNTRY_BY_ID } from './_lib/countries.js';
import { dayNumber, answerFor } from './_lib/daily.js';
import { compare } from './_lib/geo.js';
import { sendJson, rejectMethod, readJsonBody } from './_lib/http.js';
import { MAX_GUESSES } from './_lib/config.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;

  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, { error: 'invalid_body' });
  }

  const guess = COUNTRY_BY_ID.get(String(body.guessId ?? ''));
  if (!guess) {
    return sendJson(res, 400, { error: 'unknown_country' });
  }

  const today = dayNumber();
  if (body.day !== undefined && Number(body.day) !== today) {
    // The client is on a different (stale or future) puzzle — tell it to refresh.
    return sendJson(res, 409, { error: 'stale_puzzle', day: today });
  }

  const answer = answerFor(today);
  // Withhold the exact bearing: the client only needs the 8-point compass/arrow, and a
  // single guess returning both exact distance AND exact bearing would pin the answer's
  // coordinates outright. Exact distance still ships — that is the core gameplay signal
  // and trilateration from distances alone is inherent to the genre.
  const { bearingDeg, ...result } = compare(guess, answer);
  void bearingDeg;

  // guessNumber is client-supplied (this stateless function keeps no count), so clamp it
  // to [1, MAX_GUESSES]. The answer is revealed only on a correct guess or the final one.
  // Best-effort only: a determined client could still send guessNumber = MAX_GUESSES.
  const raw = Number(body.guessNumber);
  const guessNumber = Number.isInteger(raw) && raw >= 1 && raw <= MAX_GUESSES ? raw : 1;
  const gameOver = result.correct || guessNumber >= MAX_GUESSES;

  sendJson(
    res,
    200,
    {
      ...result,
      day: today,
      guess: { id: guess.id, ko: guess.ko, en: guess.en },
      ...(gameOver ? { answer: { id: answer.id, ko: answer.ko, en: answer.en } } : {}),
    },
    { 'Cache-Control': 'no-store' },
  );
}
