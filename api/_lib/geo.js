// Great-circle geometry on a spherical Earth. Proper spherical math so guesses
// across the antimeridian (e.g. Japan -> USA) point the right way.

const R_KM = 6371.0088; // mean Earth radius (IUGG)

// Max possible great-circle distance (half Earth's circumference); used to turn
// distance into a proximity score.
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
 * Initial bearing from point 1 to point 2, degrees clockwise from north [0,360).
 * Works in trig space so the antimeridian is handled correctly.
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

/** Proximity as an integer percentage [0,100]; 100 = exact, falls off linearly with distance. */
export function proximityPct(distance) {
  const pct = Math.round((1 - distance / MAX_DISTANCE_KM) * 100);
  return Math.max(0, Math.min(100, pct));
}

/** Coarsen a distance so the hint stays approximate and the exact figure never leaves the server. */
export function coarseDistance(d) {
  if (d >= 1000) return Math.round(d / 1000) * 1000;
  if (d >= 100) return Math.round(d / 100) * 100;
  return Math.max(50, Math.round(d / 50) * 50);
}

/**
 * Compare a guess against the answer. Proximity uses exact distance; reported distanceKm is coarsened.
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
