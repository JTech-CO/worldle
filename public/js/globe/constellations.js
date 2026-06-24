// Real summer-sky constellations, an easter egg at true J2000 [RA°, Dec°] positions.
export const CONSTELLATIONS = [
  {
    name: 'Lyra',
    stars: [
      [279.23, 38.78], // Vega
      [281.19, 37.61], // ζ
      [283.63, 36.90], // δ
      [284.74, 32.69], // γ Sulafat
      [282.52, 33.36], // β Sheliak
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
  },
  {
    name: 'Cygnus',
    stars: [
      [310.36, 45.28], // Deneb
      [305.56, 40.27], // Sadr γ
      [292.68, 27.96], // Albireo β
      [296.24, 45.13], // δ
      [311.55, 33.97], // Gienah ε
    ],
    lines: [[0, 1], [1, 2], [1, 3], [1, 4]],
  },
  {
    name: 'Aquila',
    stars: [
      [297.70, 8.87],  // Altair
      [296.56, 10.61], // Tarazed γ
      [298.83, 6.41],  // Alshain β
      [286.36, 3.12],  // δ
      [302.83, -0.82], // θ
      [286.56, -4.88], // λ
    ],
    lines: [[1, 0], [0, 2], [0, 3], [3, 5], [0, 4]],
  },
  {
    name: 'Scorpius',
    stars: [
      [241.36, -19.81], // β Graffias
      [240.08, -22.62], // δ Dschubba
      [239.71, -26.11], // π
      [247.35, -26.43], // α Antares
      [248.97, -28.22], // τ
      [252.54, -34.29], // ε
      [252.97, -38.05], // μ
      [253.65, -42.36], // ζ
      [258.04, -43.24], // η
      [264.33, -42.99], // θ Sargas
      [266.90, -40.13], // ι
      [263.40, -37.10], // λ Shaula
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]],
  },
  {
    name: 'Sagittarius',
    stars: [
      [271.45, -30.42], // γ Alnasl
      [275.25, -29.83], // δ Kaus Media
      [276.04, -34.38], // ε Kaus Australis
      [276.99, -25.42], // λ Kaus Borealis
      [281.41, -26.99], // φ
      [283.82, -26.30], // σ Nunki
      [286.74, -27.67], // τ
      [285.65, -29.88], // ζ Ascella
    ],
    lines: [[0, 1], [0, 2], [2, 7], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [5, 7]],
  },
];

/** Equatorial RA/Dec (degrees) to a 3D point at radius R. */
export function raDecToVec3(ra, dec, R) {
  const rr = (ra * Math.PI) / 180;
  const dd = (dec * Math.PI) / 180;
  return [
    R * Math.cos(dd) * Math.cos(rr),
    R * Math.sin(dd),
    R * Math.cos(dd) * Math.sin(rr),
  ];
}
