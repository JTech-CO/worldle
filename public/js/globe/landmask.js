// A deliberately coarse land/ocean mask for tinting the low-poly globe. It is an
// APPROXIMATION made of lat/lon boxes — enough to read as continents on a small
// rotating sphere, but far too rough to identify any country (the globe stays a
// non-hint). Orientation is arbitrary since the globe is purely decorative.

// Each region: [latMin, latMax, lonMin, lonMax] in degrees, lon in [-180, 180].
const LAND = [
  // North America
  [24, 50, -125, -66], [49, 70, -141, -60], [8, 24, -110, -83],
  [54, 71, -168, -141], // Alaska
  [60, 83, -73, -12],   // Greenland
  // South America
  [-5, 12, -80, -50], [-35, -5, -75, -44], [-55, -35, -74, -62],
  // Europe
  [36, 60, -10, 30], [55, 71, 5, 41],
  // Africa
  [8, 37, -17, 36], [-35, 8, 8, 42], [-26, -12, 43, 51], // + Madagascar
  // Asia
  [45, 78, 40, 180], [28, 53, 60, 140], [8, 28, 68, 122],
  [12, 40, 35, 62],     // Middle East
  [-10, 8, 95, 141],    // Maritime SE Asia
  // Oceania
  [-39, -11, 113, 154],
  // Antarctica
  [-90, -64, -180, 180],
];

/** Rough land test. true = land, false = ocean. */
export function isLand(lat, lon) {
  for (let i = 0; i < LAND.length; i++) {
    const [a, b, c, d] = LAND[i];
    if (lat >= a && lat <= b && lon >= c && lon <= d) return true;
  }
  return false;
}
