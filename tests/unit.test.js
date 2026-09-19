import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { defaults, flatDefaults } from "../pyramids/config.js";
import {
  vertices,
  triGeom,
  transformedTriangleSoup,
  apexQ,
  apexT,
  distanceAt,
  bestMeetAngle,
  exactMeeting,
} from "../pyramids/geometry.js";
import { maxHeightForAngle, ellipseSection } from "../ellipse/geometry.js";
import { clearGroup } from "../shared/resources.js";
import { fitCameraToObjects } from "../shared/camera.js";
import { createPyramidModel } from "../pyramids/model.js";
import { createEllipseModel } from "../ellipse/model.js";

/**
 * Vergleicht Fließkommazahlen innerhalb einer absoluten Toleranz.
 * @param {number} actual Berechneter Wert.
 * @param {number} expected Erwarteter Wert.
 * @param {number} tolerance Zulässige Abweichung.
 * @returns {void} Wirft bei einer Abweichung.
 */
function close(actual, expected, tolerance = 1e-8) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );
}

/** Prüft die öffentlichen Exportverträge aller Fach- und Shared-Module. Keine Parameter. @returns {Promise<void>} Abschluss der Prüfungen. */
async function moduleContracts() {
  const contracts = {
    "pyramids/config": [
      "defaults",
      "flatDefaults",
      "squareFaces",
      "triangleFaces",
    ],
    "pyramids/geometry": [
      "vertices",
      "triGeom",
      "transformedTriangleSoup",
      "apexQ",
      "apexT",
      "distanceAt",
      "bestMeetAngle",
      "exactMeeting",
    ],
    "pyramids/model": ["createPyramidModel"],
    "pyramids/status": ["createStatus"],
    "ellipse/config": [
      "coneDimensions",
      "defaults",
      "maximumControlHeight",
      "sampleCount",
    ],
    "ellipse/geometry": ["maxHeightForAngle", "ellipseSection"],
    "ellipse/model": ["createEllipseModel"],
    "ellipse/status": ["createStatus"],
    "shared/camera": ["fitCameraToObjects"],
    "shared/resources": ["clearGroup"],
    "shared/template": ["mountTemplate"],
    "shared/viewport": ["createViewport"],
  };
  for (const [file, exports] of Object.entries(contracts)) {
    const module = await import(`../${file}.js`);
    assert.deepEqual(Object.keys(module).sort(), exports.sort(), file);
  }
}
test("Public module contracts", moduleContracts);

/** Prüft Eckpunkte, Spitzen, Klappwinkel und ungültige Eingaben. Keine Parameter. @returns {void} Prüfergebnis. */
function pyramidGeometry() {
  const points = vertices(defaults);
  assert.equal(points.square.length, 5);
  assert.equal(points.triangle.length, 4);
  assert.deepEqual(apexQ(defaults).toArray(), [
    0,
    defaults.hq,
    defaults.dq / 2,
  ]);
  assert.deepEqual(apexT(defaults, 0).toArray(), [
    0,
    defaults.ht,
    -defaults.dt / 3,
  ]);
  close(
    distanceAt(defaults, 0),
    apexQ(defaults).distanceTo(apexT(defaults, 0)),
  );
  close(Math.hypot(defaults.w / 2, defaults.dq / 2, defaults.hq), 5);
  close(Math.hypot(defaults.w / 2, defaults.dt), 5);
  close(Math.hypot(defaults.w / 2, defaults.ht, defaults.dt / 3), 5);
  close(Math.hypot(defaults.ht, (2 * defaults.dt) / 3), 5);
  const meeting = exactMeeting(defaults);
  close(meeting.distance, 0);
  close(
    apexQ({ ...defaults, ht: meeting.height }).distanceTo(
      apexT({ ...defaults, ht: meeting.height }, meeting.angle),
    ),
    0,
  );
  const small = { w: 0.01, dq: 0.01, dt: 0.01, hq: 0.01, ht: 0.01, angle: 180 };
  assert.ok(Number.isFinite(bestMeetAngle(small)[1]));
  assert.ok(Number.isFinite(apexT(small).y));
  for (const invalid of [
    null,
    {},
    { ...defaults, w: 0 },
    { ...defaults, ht: NaN },
  ]) {
    assert.throws(() => vertices(invalid), TypeError);
    assert.throws(() => bestMeetAngle(invalid), TypeError);
  }
  assert.throws(() => apexT(defaults, Infinity), TypeError);
  const geometry = transformedTriangleSoup(defaults);
  assert.equal(geometry.attributes.position.count, 30);
  geometry.dispose();
  const empty = triGeom([], []);
  assert.equal(empty.attributes.position.count, 0);
  empty.dispose();
  assert.throws(() => triGeom([[0, 0, 0]], [[0, 1, 2]]), RangeError);
  assert.throws(() => triGeom([[NaN, 0, 0]], []), TypeError);
}
test("Pyramid geometry and closest apexes", pyramidGeometry);

/** Prüft Schnittgleichungen, Randlagen und offene Schnitte. Keine Parameter. @returns {void} Prüfergebnis. */
function ellipseGeometry() {
  close(maxHeightForAngle(0), 5);
  const circle = ellipseSection(2, 0);
  close(circle.ax, 1.2);
  close(circle.az, 1.2);
  close(circle.eccentricity, 0);
  for (const degrees of [0, 38, 55, -55]) {
    const slope = Math.tan((degrees * Math.PI) / 180);
    const height = maxHeightForAngle(slope);
    const section = ellipseSection(height, slope);
    close(section.ymax, 5);
    assert.equal(section.finite, true);
    for (const [x, y, z] of section.points) {
      close(y, height + slope * x);
      close(x * x + z * z, 0.36 * y * y);
    }
  }
  assert.equal(ellipseSection(0, 0).eccentricity, 0);
  assert.equal(ellipseSection(1, 2), null);
  assert.equal(maxHeightForAngle(2), 0);
  assert.throws(() => maxHeightForAngle(NaN), TypeError);
  assert.throws(() => ellipseSection(-1, 0), TypeError);
  assert.throws(() => ellipseSection(1, Infinity), TypeError);
}
test("Ellipse equations and finite cone boundary", ellipseGeometry);

/** Prüft Modellaktualisierungen und rekursive Ressourcenfreigabe. Keine Parameter. @returns {void} Prüfergebnis. */
function modelLifecycle() {
  const scene = new THREE.Scene(),
    model = createPyramidModel(scene);
  model.rebuild(defaults, false, true, 1);
  const square = model.visibleObjects(false)[0];
  let disposed = 0;
  /** Zählt ein Dispose-Ereignis. Keine Parameter. @returns {void} Kein Rückgabewert. */
  function countDisposed() {
    disposed += 1;
  }
  square.children[0].children[0].geometry.addEventListener(
    "dispose",
    countDisposed,
  );
  square.children[0].children[0].material.addEventListener(
    "dispose",
    countDisposed,
  );
  model.rebuild(defaults, true, false, 8);
  assert.equal(disposed, 2);
  assert.equal(square.visible, false);
  assert.equal(model.visibleObjects(true)[0].children[0].children.length, 1);
  clearGroup(scene);
  assert.equal(scene.children.length, 0);
  clearGroup(scene);
  const ellipse = createEllipseModel(scene);
  assert.equal(ellipse.framingObjects.length, 1);
  ellipse.update(2, 0, 0.3, ellipseSection(2, 0));
  assert.equal(scene.children[3].geometry.attributes.position.count, 360);
  ellipse.update(2, 2, 0.3, null);
  assert.equal(scene.children[3].geometry.attributes.position.count, 0);
  clearGroup(scene);
}
test("Models rebuild and dispose owned resources", modelLifecycle);

/** Prüft Kameraeinrahmung einschließlich leerer Gruppen. Keine Parameter. @returns {void} Prüfergebnis. */
function cameraFraming() {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);
  camera.position.set(7, 7, 7);
  /** Simuliert die Steuerelement-Aktualisierung. Keine Parameter. @returns {void} Kein Rückgabewert. */
  function update() {}
  const controls = { target: new THREE.Vector3(), update };
  const before = camera.position.clone();
  fitCameraToObjects(camera, controls, []);
  assert.ok(camera.position.equals(before));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3));
  fitCameraToObjects(camera, controls, [mesh]);
  camera.lookAt(controls.target);
  camera.updateMatrixWorld();
  const position = mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const point = new THREE.Vector3()
      .fromBufferAttribute(position, i)
      .project(camera);
    assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
  }
  mesh.geometry.dispose();
  mesh.material.dispose();

  const scene = new THREE.Scene();
  const ellipse = createEllipseModel(scene);
  camera.aspect = 390 / 506;
  fitCameraToObjects(camera, controls, ellipse.framingObjects);
  camera.lookAt(controls.target);
  camera.updateMatrixWorld();
  const cone = ellipse.framingObjects[0];
  cone.updateWorldMatrix(true, false);
  const positions = cone.geometry.attributes.position;
  for (let index = 0; index < positions.count; index++) {
    const point = new THREE.Vector3()
      .fromBufferAttribute(positions, index)
      .applyMatrix4(cone.matrixWorld)
      .project(camera);
    assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
  }
  clearGroup(scene);
}
test("Camera fits object bounds", cameraFraming);
