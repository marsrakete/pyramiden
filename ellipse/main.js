import { createViewport } from "../shared/viewport.js";
import { fitCameraToObjects } from "../shared/camera.js";
import { createEllipseModel } from "./model.js";
import { createStatus } from "./status.js";
import { ellipseSection, maxHeightForAngle } from "./geometry.js";
import { defaults, maximumControlHeight } from "./config.js";
const angle = document.getElementById("angle"),
  height = document.getElementById("height"),
  opacity = document.getElementById("opacity"),
  animate = document.getElementById("animate"),
  fillToggle = document.getElementById("fill-toggle");
const viewport = createViewport(document.getElementById("view"), {
  fov: 42,
  position: [7, 5, 8],
  target: [0, 2.4, 0],
  groundColor: 0x333333,
  lightIntensity: 2.4,
  lightPosition: [5, 8, 6],
  onResize: scheduleFit,
});
const model = createEllipseModel(viewport.scene);
const status = createStatus(
  document.getElementById("info"),
  document.getElementById("info-template"),
);
let animating = false,
  startedAt = 0,
  sectionFilled = false;

/**
 * Plant die Einrahmung des Kegels nach Initialisierung oder Größenänderung.
 * Keine Parameter.
 * @returns {void} Kein Rückgabewert.
 */
function scheduleFit() {
  requestAnimationFrame(fit);
}

/**
 * Hält den vollständigen Kegel auch in schmalen Ansichten sichtbar.
 * Keine Parameter.
 * @returns {void} Kein Rückgabewert.
 */
function fit() {
  fitCameraToObjects(viewport.camera, viewport.controls, model.framingObjects);
}
/**
 * Begrenzt die Höhe und überträgt die Reglerwerte in Modell und Anzeige.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function update() {
  const slope = Math.tan((Number(angle.value) * Math.PI) / 180);
  const maximum = Math.min(maximumControlHeight, maxHeightForAngle(slope));
  // Round downward and lower the slider minimum when a steep cut requires it.
  // This keeps the entire curve on the finite cone, including at 55 degrees.
  height.max = (Math.floor(maximum * 1000) / 1000).toFixed(3);
  height.min = String(Math.min(1, Number(height.max)));
  if (Number(height.value) > maximum) {
    height.value = height.max;
  }
  const h = Number(height.value),
    section = ellipseSection(h, slope);
  model.update(h, slope, Number(opacity.value), section, sectionFilled);
  status.update(section, maximum);
  document.getElementById("av").textContent =
    Number(angle.value).toFixed(1) + "°";
  document.getElementById("hv").textContent = h.toFixed(2);
  document.getElementById("ov").textContent = Number(opacity.value).toFixed(2);
}
/**
 * Beschriftet den Animationsknopf passend zum Zustand.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function updateAnimationLabel() {
  if (animating) {
    animate.textContent = animate.dataset.stop;
  } else {
    animate.textContent = animate.dataset.start;
  }
}
/**
 * Stoppt die Animation und stellt die Ausgangswerte wieder her.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function reset() {
  animating = false;
  updateAnimationLabel();
  angle.value = defaults.angle;
  height.max = maximumControlHeight;
  height.min = 1;
  height.value = defaults.height;
  opacity.value = defaults.opacity;
  sectionFilled = false;
  updateFillToggleLabel();
  update();
}

/**
 * Aktualisiert Beschriftung und Zugänglichkeitszustand des Flächenknopfs.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function updateFillToggleLabel() {
  if (sectionFilled) {
    fillToggle.textContent = fillToggle.dataset.hide;
    fillToggle.setAttribute("aria-pressed", "true");
  } else {
    fillToggle.textContent = fillToggle.dataset.show;
    fillToggle.setAttribute("aria-pressed", "false");
  }
}

/**
 * Schaltet die Einfärbung der Ellipsenfläche um.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function toggleSectionFill() {
  sectionFilled = !sectionFilled;
  updateFillToggleLabel();
  update();
}
/**
 * Schaltet die Animation um und setzt ihren Zeitursprung.
 * Keine Parameter.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function toggleAnimation() {
  animating = !animating;
  updateAnimationLabel();
  startedAt = performance.now();
}
/**
 * Animiert gegebenenfalls die Schnittebene und zeichnet ein Bild.
 * @param {number} time Zeitstempel des Renderers in Millisekunden.
 * @returns {void} Ergebnis der beschriebenen Operation.
 */
function render(time) {
  if (animating) {
    angle.value = 30 + 20 * Math.sin((time - startedAt) / 1800);
    // Erlaubt steigende Höhen wieder, bevor update die aktuelle Grenze anwendet.
    height.max = maximumControlHeight;
    height.value = 2.55 + 0.35 * Math.sin((time - startedAt) / 2600);
    update();
  }
  viewport.controls.update();
  viewport.renderer.render(viewport.scene, viewport.camera);
}
for (const input of [angle, height, opacity]) {
  input.addEventListener("input", update);
}
document.getElementById("reset").addEventListener("click", reset);
animate.addEventListener("click", toggleAnimation);
fillToggle.addEventListener("click", toggleSectionFill);
updateFillToggleLabel();
update();
viewport.renderer.setAnimationLoop(render);
