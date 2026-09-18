import * as THREE from "three";
import { squareFaces, triangleFaces } from "./config.js";
/**
 * Berechnet die Eckpunkte beider ungeklappten Pyramiden.
 * @param {object} p Positive Abmessungen w, dq, dt, hq, ht und Winkel angle in Grad.
 * @returns {{square: number[][], triangle: number[][]}} Ergebnis der beschriebenen Operation.
 */
export function vertices(p) {
  validateParameters(p);
  const x = p.w / 2;
  return {
    square: [
      [-x, 0, 0],
      [x, 0, 0],
      [x, 0, p.dq],
      [-x, 0, p.dq],
      [0, p.hq, p.dq / 2],
    ],
    triangle: [
      [-x, 0, 0],
      [x, 0, 0],
      [0, 0, -p.dt],
      [0, p.ht, -p.dt / 3],
    ],
  };
}
/**
 * Erzeugt eine unindizierte Dreiecksgeometrie mit Flächennormalen.
 * @param {number[][]} vertices Eckpunkte als XYZ-Koordinaten.
 * @param {number[][]} faces Dreiecke als Indizes der Eckpunkte.
 * @returns {THREE.BufferGeometry} Ergebnis der beschriebenen Operation.
 */
export function triGeom(vertices, faces) {
  if (!Array.isArray(vertices) || !Array.isArray(faces)) {
    throw new TypeError("Expected vertices and faces arrays");
  }
  for (const point of vertices) {
    if (
      !Array.isArray(point) ||
      point.length !== 3 ||
      !point.every(Number.isFinite)
    ) {
      throw new TypeError("Expected finite XYZ coordinates");
    }
  }
  for (const face of faces) {
    if (!Array.isArray(face) || face.length !== 3) {
      throw new TypeError("Expected triangular faces");
    }
    for (const index of face) {
      if (!Number.isInteger(index) || index < 0 || index >= vertices.length) {
        throw new RangeError("Invalid vertex index");
      }
    }
  }
  const pos = [];
  for (const face of faces) {
    for (const index of face) {
      pos.push(...vertices[index]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * Vereinigt beide Pyramidennetze im geklappten Zustand.
 * @param {object} p Abmessungen und Klappwinkel in Grad.
 * @returns {THREE.BufferGeometry} Ergebnis der beschriebenen Operation.
 */
export function transformedTriangleSoup(p) {
  if (!Number.isFinite(p?.angle)) {
    throw new TypeError("Expected a finite angle");
  }
  const points = vertices(p);
  const axis = new THREE.Vector3(1, 0, 0);
  const rotated = [];
  for (const point of points.triangle) {
    rotated.push(
      new THREE.Vector3(...point)
        .applyAxisAngle(axis, THREE.MathUtils.degToRad(p.angle))
        .toArray(),
    );
  }
  const faces = [...squareFaces];
  for (const face of triangleFaces) {
    faces.push(face.map(offsetTriangleIndex));
  }
  return triGeom([...points.square, ...rotated], faces);
}
/**
 * Verschiebt einen Dreiecksindex hinter die fünf Quadratpyramidenpunkte.
 * @param {number} index Lokaler Eckpunktindex.
 * @returns {number} Ergebnis der beschriebenen Operation.
 */
function offsetTriangleIndex(index) {
  return index + 5;
}
/**
 * Berechnet die feste Spitze der Quadratpyramide.
 * @param {object} p Abmessungen der Pyramiden.
 * @returns {THREE.Vector3} Ergebnis der beschriebenen Operation.
 */
export function apexQ(p) {
  validateParameters(p);
  return new THREE.Vector3(0, p.hq, p.dq / 2);
}
/**
 * Berechnet die um die Scharnierachse gedrehte Dreieckspitze.
 * @param {object} p Abmessungen und Standardwinkel.
 * @param {number} angleDeg Klappwinkel in Grad, standardmäßig p.angle.
 * @returns {THREE.Vector3} Ergebnis der beschriebenen Operation.
 */
export function apexT(p, angleDeg = p.angle) {
  validateParameters(p);
  if (!Number.isFinite(angleDeg)) {
    throw new TypeError("Expected a finite angle");
  }
  const v = new THREE.Vector3(0, p.ht, -p.dt / 3);
  v.applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    THREE.MathUtils.degToRad(angleDeg),
  );
  return v;
}
/**
 * Berechnet den Spitzenabstand bei einem gegebenen Klappwinkel.
 * @param {object} p Abmessungen der Pyramiden.
 * @param {number} a Klappwinkel in Grad.
 * @returns {number} Ergebnis der beschriebenen Operation.
 */
export function distanceAt(p, a) {
  return apexQ(p).distanceTo(apexT(p, a));
}
/**
 * Sucht den kleinsten Spitzenabstand zwischen 0 und 180 Grad.
 * @param {object} p Abmessungen der Pyramiden.
 * @returns {number[]} Bester Winkel in Grad und zugehöriger Spitzenabstand.
 */
export function bestMeetAngle(p) {
  // Eine grobe Suche grenzt das Minimum ein; Intervallteilung verfeinert es.
  let best = 0,
    bd = Infinity;
  for (let a = 0; a <= 180; a += 0.25) {
    let d = distanceAt(p, a);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  let lo = Math.max(0, best - 0.5),
    hi = Math.min(180, best + 0.5);
  for (let k = 0; k < 45; k++) {
    let m1 = lo + (hi - lo) / 3,
      m2 = hi - (hi - lo) / 3;
    if (distanceAt(p, m1) < distanceAt(p, m2)) {
      hi = m2;
    } else {
      lo = m1;
    }
  }
  return [(lo + hi) / 2, distanceAt(p, (lo + hi) / 2)];
}

/**
 * Lehnt fehlende, nicht endliche oder nicht positive Abmessungen ab.
 * @param {object} p Zu prüfende Abmessungen.
 * @returns {void} Wirft bei ungültigen Abmessungen einen TypeError.
 */
function validateParameters(p) {
  for (const key of ["w", "dq", "dt", "hq", "ht"]) {
    if (!Number.isFinite(p?.[key]) || p[key] <= 0) {
      throw new TypeError("Expected positive finite dimension: " + key);
    }
  }
}
