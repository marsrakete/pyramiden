import * as THREE from "three";
import { coneDimensions } from "./config.js";
/**
 * Erzeugt Kegel, Basisrand, Schnittebene und Schnittkurve.
 * @param {THREE.Scene} scene Szene für alle Modellobjekte.
 * @returns {{update: Function, framingObjects: THREE.Object3D[]}} Modellsteuerung und Körper für die Kameraeinrahmung.
 */
export function createEllipseModel(scene) {
  const H = coneDimensions.height,
    R = coneDimensions.radius;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(R, H, 128, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x4c91ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.7,
    }),
  );
  cone.rotation.x = Math.PI;
  cone.position.y = H / 2;
  scene.add(cone);

  // A grid/rim only at the actual finite base y=H, deliberately subdued.
  const basePts = basePoints(R, H);
  const baseRim = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(basePts),
    new THREE.LineBasicMaterial({
      color: 0x416da8,
      transparent: true,
      opacity: 0.45,
    }),
  );
  scene.add(baseRim);

  const planeGeom = new THREE.PlaneGeometry(9, 9);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0xb47b25,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const planeMesh = new THREE.Mesh(planeGeom, planeMat);
  scene.add(planeMesh);
  const curveMat = new THREE.LineBasicMaterial({ color: 0xffe16b });
  const curve = new THREE.LineLoop(new THREE.BufferGeometry(), curveMat);
  scene.add(curve);

  /**
   * Richtet die Fläche an der Ebenengleichung y = h + m*x aus.
   * @param {number} h Höhe am Mittelpunkt.
   * @param {number} m Steigung der Ebene.
   * @returns {void} Ergebnis der beschriebenen Operation.
   */
  function setPlaneFromEquation(h, m) {
    const ex = new THREE.Vector3(1, m, 0).normalize();
    const ez = new THREE.Vector3(0, 0, 1);
    const normal = new THREE.Vector3().crossVectors(ex, ez).normalize(); // (m,-1,0), right-handed basis
    const M = new THREE.Matrix4().makeBasis(ex, ez, normal);
    planeMesh.quaternion.setFromRotationMatrix(M);
    planeMesh.position.set(0, h, 0);
    // Compensate ex normalization so displayed plane still spans generously in x.
    planeMesh.scale.set(Math.sqrt(1 + m * m), 1, 1);
  }

  /**
   * Aktualisiert Ebene, Transparenz und Schnittkurve.
   * @param {number} height Höhe der Ebene.
   * @param {number} slope Steigung der Ebene.
   * @param {number} opacity Transparenzwert des Kegels.
   * @param {object|null} section Berechnete Schnittkurve oder null für einen offenen Schnitt.
   * @returns {void} Ergebnis der beschriebenen Operation.
   */
  function update(height, slope, opacity, section) {
    setPlaneFromEquation(height, slope);
    cone.material.opacity = opacity;
    const points = [];
    if (section) {
      for (const point of section.points) {
        points.push(new THREE.Vector3(...point));
      }
    }
    curve.geometry.dispose();
    curve.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
  return { update, framingObjects: [cone] };
}
/**
 * Berechnet die Punkte des geschlossenen Kegelbasisrandes.
 * @param {number} radius Radius des Grundkreises.
 * @param {number} height Höhe des Grundkreises.
 * @returns {THREE.Vector3[]} Ergebnis der beschriebenen Operation.
 */
function basePoints(radius, height) {
  const points = [];
  for (let index = 0; index <= 128; index++) {
    const angle = (index / 128) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        radius * Math.cos(angle),
        height,
        radius * Math.sin(angle),
      ),
    );
  }
  return points;
}
