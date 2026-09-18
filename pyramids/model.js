import * as THREE from "three";
import { triGeom, vertices, transformedTriangleSoup } from "./geometry.js";
import { squareFaces, triangleFaces } from "./config.js";
import { clearGroup } from "../shared/resources.js";
/**
 * Erzeugt die Gruppen für einzelne Pyramiden, Gesamtkörper und Scharnier.
 * @param {THREE.Scene} scene Szene für die Modellgruppen.
 * @returns {{rebuild: Function, visibleObjects: Function}} Ergebnis der beschriebenen Operation.
 */
export function createPyramidModel(scene) {
  const groupQ = new THREE.Group(),
    groupT = new THREE.Group(),
    groupFinal = new THREE.Group(),
    hinge = new THREE.Group();
  scene.add(groupQ, groupT, groupFinal, hinge);
  /**
   * Ersetzt die Geometrien und aktualisiert Sichtbarkeit und Kanten.
   * @param {object} p Abmessungen und Klappwinkel.
   * @param {boolean} finalMode Zeigt den vereinigten Körper.
   * @param {boolean} wire Schaltet sichtbare Kanten ein.
   * @param {number} tolerance Winkelgrenze für koplanare Kanten in Grad.
   * @returns {void} Ergebnis der beschriebenen Operation.
   */
  function rebuild(p, finalMode, wire, tolerance) {
    for (const group of [groupQ, groupT, groupFinal, hinge]) {
      clearGroup(group);
    }
    const points = vertices(p);
    groupQ.add(
      meshWithEdges(triGeom(points.square, squareFaces), 0x3f8cff, wire, 1),
    );
    groupT.add(
      meshWithEdges(triGeom(points.triangle, triangleFaces), 0xff9b3d, wire, 1),
    );
    groupT.rotation.x = THREE.MathUtils.degToRad(p.angle);
    groupFinal.add(
      meshWithEdges(
        transformedTriangleSoup(p),
        0xd9d9d9,
        wire,
        tolerance,
        true,
      ),
    );
    groupQ.visible = !finalMode;
    groupT.visible = !finalMode;
    groupFinal.visible = finalMode;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-p.w / 2, 0, 0),
      new THREE.Vector3(p.w / 2, 0, 0),
    ]);
    hinge.add(
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xff3030 }),
      ),
    );
    hinge.visible = !finalMode;
  }
  /**
   * Liefert die im aktuellen Modus einzurahmenden Modellgruppen.
   * @param {boolean} finalMode Modus des vereinigten Körpers.
   * @returns {THREE.Group[]} Ergebnis der beschriebenen Operation.
   */
  function visibleObjects(finalMode) {
    if (finalMode) {
      return [groupFinal];
    }
    return [groupQ, groupT];
  }
  return { rebuild, visibleObjects };
}
/**
 * Erzeugt eine Oberfläche mit optionalen Kanten aus einer Geometrie.
 * @param {THREE.BufferGeometry} geometry Exklusiv besessene Oberflächengeometrie.
 * @param {number} color Farbe der Oberfläche.
 * @param {boolean} wire Aktiviert Kanten.
 * @param {number} tolerance Winkelgrenze der Kanten in Grad.
 * @param {boolean} finalSurface Verwendet die Oberflächeneinstellungen des fertigen Körpers.
 * @returns {THREE.Group} Ergebnis der beschriebenen Operation.
 */
function meshWithEdges(geometry, color, wire, tolerance, finalSurface = false) {
  const group = new THREE.Group();
  let roughness = 0.7;
  let edgeColor = 0x101010;
  if (finalSurface) {
    roughness = 0.72;
    edgeColor = 0x111111;
  }
  group.add(
    new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        roughness,
        metalness: 0,
        flatShading: finalSurface,
      }),
    ),
  );
  if (wire) {
    group.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, tolerance),
        new THREE.LineBasicMaterial({ color: edgeColor }),
      ),
    );
  }
  return group;
}
