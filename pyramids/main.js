import * as THREE from "three";
import { createViewport } from "../shared/viewport.js";
import { fitCameraToObjects } from "../shared/camera.js";
import { createPyramidModel } from "./model.js";
import { createStatus } from "./status.js";
import { exactMeeting } from "./geometry.js";
import { defaults, flatDefaults } from "./config.js";
const inputs = {};
for (const id of Object.keys(defaults)) {
  inputs[id] = document.getElementById(id);
  inputs[id].addEventListener("input", rebuild);
}
const labels = {
  w: "wv",
  dq: "dqv",
  dt: "dtv",
  hq: "hqv",
  ht: "htv",
  angle: "av",
};
const wire = document.getElementById("wire"),
  tolerance = document.getElementById("tol"),
  modeButton = document.getElementById("finalMode");
let finalMode = false;
const viewport = createViewport(document.getElementById("view"), {
  fov: 45,
  position: [7, 7, 7],
  target: [0, 0, 0],
  groundColor: 0x444444,
  lightIntensity: 2.2,
  lightPosition: [5, 8, 5],
  onResize: scheduleFit,
});
viewport.scene.add(new THREE.GridHelper(14, 14, 0x444444, 0x222222));
const model = createPyramidModel(viewport.scene);
const status = createStatus(
  document.getElementById("status"),
  document.getElementById("status-template"),
);
/**
 * Liest die aktuellen numerischen Reglerwerte.
 * Keine Parameter.
 * @returns {Object<string, number>} Ergebnis der beschriebenen Operation.
 */
function params() {
  const result = {};
  for (const [id, input] of Object.entries(inputs)) {
    result[id] = Number(input.value);
  }
  return result;
}
/**
 * Rahmt die aktuell sichtbaren Modellgruppen ein.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function fit() {
  fitCameraToObjects(
    viewport.camera,
    viewport.controls,
    model.visibleObjects(finalMode),
  );
}
/**
 * Plant die Kameraanpassung nach abgeschlossener Initialisierung.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function scheduleFit() {
  requestAnimationFrame(fit);
}
/**
 * Überträgt die Bedieneinstellungen in Modell, Beschriftungen und Kamera.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function rebuild() {
  const p = params();
  model.rebuild(p, finalMode, wire.checked, Number(tolerance.value));
  for (const [id, label] of Object.entries(labels)) {
    let text = p[id].toFixed(2);
    if (id === "angle") {
      text = p[id].toFixed(1) + "°";
    }
    document.getElementById(label).textContent = text;
  }
  document.getElementById("tolv").textContent =
    Number(tolerance.value).toFixed(1) + "°";
  status.update(p, finalMode);
  fit();
}
/**
 * Wechselt den Darstellungsmodus und aktualisiert die Ansicht.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function toggleMode() {
  finalMode = !finalMode;
  if (finalMode) {
    modeButton.textContent = modeButton.dataset.on;
  } else {
    modeButton.textContent = modeButton.dataset.off;
  }
  rebuild();
}
/**
 * Setzt Abmessungen und Toleranz auf die Ausgangswerte zurück.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function reset() {
  for (const [id, value] of Object.entries(defaults)) {
    inputs[id].value = value;
  }
  tolerance.value = 1;
  rebuild();
}

/**
 * Setzt Grundflächen, Kantenlängen und Klappwinkel auf eine flache Ausgangslage.
 * Keine Parameter.
 * @returns {void} Aktualisiert Modell und Anzeige.
 */
function resetFlat() {
  for (const [id, value] of Object.entries(flatDefaults)) {
    inputs[id].value = value;
  }
  tolerance.value = 1;
  rebuild();
}
/**
 * Stellt den Winkel mit dem kleinsten Spitzenabstand ein.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function meet() {
  const result = exactMeeting(params());
  inputs.ht.value = Math.min(
    Number(inputs.ht.max),
    Math.max(Number(inputs.ht.min), result.height),
  );
  inputs.angle.value = result.angle;
  rebuild();
}
/**
 * Aktualisiert die Orbit-Steuerung und zeichnet ein Bild.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function render() {
  viewport.controls.update();
  viewport.renderer.render(viewport.scene, viewport.camera);
}
wire.addEventListener("change", rebuild);
tolerance.addEventListener("input", rebuild);
modeButton.addEventListener("click", toggleMode);
document.getElementById("reset").addEventListener("click", reset);
document.getElementById("resetFlat").addEventListener("click", resetFlat);
document.getElementById("meet").addEventListener("click", meet);
rebuild();
viewport.renderer.setAnimationLoop(render);
