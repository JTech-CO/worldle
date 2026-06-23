// GET /api/countries — names only, for autocomplete. Coordinates stay server-side.
import { publicList } from './_lib/countries.js';
import { sendJson, rejectMethod } from './_lib/http.js';

export default function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return;

  sendJson(
    res,
    200,
    { countries: publicList() },
    // Pure reference data; cache hard. A new deploy busts it via the URL/build.
    { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  );
}
