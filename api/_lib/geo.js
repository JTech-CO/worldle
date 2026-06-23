// Great-circle geometry on a spherical Earth.
//
// The original game computed direction with a flat atan2(dLat, dLon) and never
// normalized longitude, so guesses across the antimeridian (e.g. Japan -> USA)
// could point the wrong way and distances were never shown. Everything here is
// proper spherical math instead.

const R_KM = 6371.0088; // mean Earth radius (IUGG)

// Half the Earth's circumference along a great circle: the maximum possible
// distance between two points. Used to turn distance into a proximity score.
export const MAX_DISTANCE_KM = Math.PI * R_KM; // ~20015 km

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Great-circle (haversine) distance in kilometres.
 * @returns {number} distance in km, rounded to the nearest km
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_KM * c);
}

/**
 * Initial bearing (forward azimuth) from point 1 to point 2, in degrees
 * clockwise from true north [0, 360). Handles the antimeridian correctly
 * because it works in trig space rather than on raw longitude deltas.
 */
export function bearingDeg(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

// 8-point compass, clockwise from north. Index = round(bearing / 45) % 8.
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const ARROWS = { N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖' };

/** Map a bearing in degrees to one of 8 compass points. */
export function compassFromBearing(deg) {
  return COMPASS[Math.round(deg / 45) % 8];
}

/** Arrow glyph for a compass point. */
export function arrowForCompass(compass) {
  return ARROWS[compass];
}

/**
 * Proximity as an integer percentage [0, 100], where 100 means an exact match
 * and the score falls off linearly with great-circle distance. Mirrors the
 * feedback model players know from Worldle/Globle.
 */
export function proximityPct(distance) {
  const pct = Math.round((1 - distance / MAX_DISTANCE_KM) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Round a distance to a deliberately coarse value so the hint stays approximate
 * (and the exact figure never leaves the server). e.g. 3327 -> 3000, 234 -> 200.
 */
export function coarseDistance(d) {
  if (d >= 1000) return Math.round(d / 1000) * 1000;
  if (d >= 100) return Math.round(d / 100) * 100;
  return Math.max(50, Math.round(d / 50) * 50);
}

/**
 * Full comparison of a guess against the answer. Proximity uses the exact
 * distance; the reported distanceKm is coarsened so the hint is approximate.
 * @returns {{ distanceKm:number, bearingDeg:number, compass:string, arrow:string, proximityPct:number, correct:boolean }}
 */
export function compare(guess, answer) {
  const correct = guess.id === answer.id;
  const distance = correct ? 0 : distanceKm(guess.lat, guess.lon, answer.lat, answer.lon);
  const bearing = correct ? 0 : bearingDeg(guess.lat, guess.lon, answer.lat, answer.lon);
  const compass = compassFromBearing(bearing);
  return {
    distanceKm: correct ? 0 : coarseDistance(distance),
    bearingDeg: Math.round(bearing),
    compass,
    arrow: correct ? '◎' : arrowForCompass(compass),
    proximityPct: proximityPct(distance),
    correct,
  };
}
