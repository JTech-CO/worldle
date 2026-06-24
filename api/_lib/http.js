// Framework-free HTTP helpers so the same handlers run under Vercel and scripts/dev-server.mjs.

/** Send a JSON response with status and optional headers. */
export function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(payload);
}

/** Guard the HTTP method; returns true if the request was rejected. */
export function rejectMethod(req, res, allowed) {
  if (req.method === allowed) return false;
  sendJson(res, 405, { error: 'method_not_allowed', allowed }, { Allow: allowed });
  return true;
}

/** Read and JSON-parse a request body (Node stream). Resolves null on bad JSON. */
export function readJsonBody(req) {
  return new Promise((resolve) => {
    // Vercel may pre-parse the body for us.
    if (req.body !== undefined) {
      if (typeof req.body === 'string') {
        try { resolve(JSON.parse(req.body)); } catch { resolve(null); }
      } else {
        resolve(req.body);
      }
      return;
    }
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve(null); }
    });
    req.on('error', () => resolve(null));
  });
}
