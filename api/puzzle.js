// GET /api/puzzle — metadata for today's puzzle. Never includes the answer.
import { COUNTRIES } from './_lib/countries.js';
import { dayNumber, dateStringFor } from './_lib/daily.js';
import { sendJson, rejectMethod } from './_lib/http.js';
import { MAX_GUESSES } from './_lib/config.js';

export default function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return;

  const day = dayNumber();
  sendJson(
    res,
    200,
    {
      day,
      date: dateStringFor(day),
      maxGuesses: MAX_GUESSES,
      totalCountries: COUNTRIES.length,
    },
    // Safe to cache: the answer is not in this response.
    { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  );
}
