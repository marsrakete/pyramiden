export const defaults = Object.freeze({
  w: 5,
  dq: 5,
  dt: Math.sqrt(75 / 4),
  hq: Math.sqrt(25 / 2),
  ht: Math.sqrt(50 / 3),
  angle: 52.4,
});
export const flatDefaults = Object.freeze({
  w: 5,
  dq: 5,
  dt: Math.sqrt(75 / 4),
  hq: Math.sqrt(25 / 2),
  ht: Math.sqrt(50 / 3),
  angle: 0,
});
export const squareFaces = [
  [0, 1, 2],
  [0, 2, 3],
  [0, 1, 4],
  [1, 2, 4],
  [2, 3, 4],
  [3, 0, 4],
];
export const triangleFaces = [
  [0, 2, 1],
  [0, 1, 3],
  [1, 2, 3],
  [2, 0, 3],
];
