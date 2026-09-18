export const defaults = Object.freeze({
  w: 5,
  dq: 3,
  dt: 2,
  hq: 2,
  ht: 2.4,
  angle: 52.4,
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
