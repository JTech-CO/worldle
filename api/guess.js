// POST /api/guess — score one guess against today's hidden answer. The answer's
// identity is sent ONLY at game over; coordinates never. Requested `day` must
// equal today's puzzle, blocking clients from probing future answers.

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
    // Client is on a stale/future puzzle — tell it to refresh.
    return sendJson(res, 409, { error: 'stale_puzzle', day: today });
  }

  const answer = answerFor(today);
  // Withhold exact bearing: exact distance + exact bearing from one guess would pin the
  // answer's coordinates. Exact distance still ships (core signal; trilateration is inherent).
  const { bearingDeg, ...result } = compare(guess, answer);
  void bearingDeg;

  // guessNumber is client-supplied (stateless function keeps no count); clamp to [1, MAX_GUESSES].
  // Answer revealed only on a correct or final guess. Best-effort: a client could still spoof it.
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
