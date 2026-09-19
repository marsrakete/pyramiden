import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Liefert die exakt gleiche Three.js-Version lokal, unabhängig vom CDN-Netzwerk.
 * @param {import('@playwright/test').Route} route CDN-Anfrage der Importmap.
 * @returns {Promise<void>} Erfüllte Anfrage.
 */
async function localThree(route) {
  const url = new URL(route.request().url());
  const relative = url.pathname.split("/three@0.180.0/")[1];
  await route.fulfill({
    path: path.resolve("node_modules/three", relative),
    contentType: "text/javascript",
  });
}

/**
 * Prüft beide Seiten einschließlich ihrer Einstiegsmodule und DOM-Verträge.
 * @param {object} fixtures Playwright-Fixtures mit Browserseite.
 * @param {import('@playwright/test').TestInfo} testInfo Pfade für Bildschirmnachweise.
 * @returns {Promise<void>} Abgeschlossener Interaktionstest.
 */
async function pagesAndControls({ page }, testInfo) {
  const errors = [];
  /** Sammelt unbehandelte Browserfehler. @param {Error} error Browserfehler. @returns {void} Kein Rückgabewert. */
  function collectError(error) {
    errors.push(error.message);
  }
  page.on("pageerror", collectError);
  await page.route("https://cdn.jsdelivr.net/npm/three@0.180.0/**", localThree);
  await page.goto("/");
  await expect(page.locator('#status [data-value="mode"]')).toHaveText(
    "zwei Ausgangspyramiden",
  );
  await verifyLayout(page);
  await page.locator("#finalMode").click();
  await expect(page.locator('#status [data-value="mode"]')).toHaveText(
    "fertiger Körper",
  );
  await page.locator("#wire").uncheck();
  await setRange(page, "tol", "8");
  await expect(page.locator("#tolv")).toHaveText("8.0°");
  await setRange(page, "w", "1");
  await expect(page.locator("#wv")).toHaveText("1.00");
  await page.locator("#meet").click();
  await expect(page.locator('#status [data-message="exact"]')).toBeVisible();
  await expect(page.locator('#status [data-value="distance"]')).toHaveText(
    "0.000",
  );
  await page.locator("#reset").click();
  await expect(page.locator("#wv")).toHaveText("5.00");
  await expect(page.locator("#tolv")).toHaveText("1.0°");
  await page.locator("#resetFlat").click();
  await expect(page.locator("#av")).toHaveText("0.0°");
  await expect(page.locator("#wv")).toHaveText("5.00");
  await expect(page.locator("#dqv")).toHaveText("5.00");
  await expect(page.locator("#dtv")).toHaveText("4.33");
  await expect(page.locator("#hqv")).toHaveText("3.54");
  await expect(page.locator("#htv")).toHaveText("4.08");
  await page.locator("#wire").check();
  await page
    .locator("#view")
    .screenshot({ path: testInfo.outputPath("pyramids.png") });

  await page.goto("/kegelschnitt_ellipse_begrenzt.html");
  await expect(page.locator('#info [data-value="axes"]')).not.toBeEmpty();
  await verifyLayout(page);
  await setRange(page, "angle", "55");
  await expect(page.locator('#info [data-message="finite"]')).toBeVisible();
  const maximum = Number(await page.locator("#height").getAttribute("max"));
  expect(maximum).toBeLessThan(1);
  await page.locator("#reset").click();
  await expect(page.locator("#angle")).toHaveValue("38");
  await expect(page.locator("#height")).toHaveValue("2.65");
  await page.locator("#animate").click();
  await expect(page.locator("#animate")).toHaveText("Animation stoppen");
  await expect(page.locator("#angle")).not.toHaveValue("38");
  await page.locator("#animate").click();
  await expect(page.locator("#animate")).toHaveText("Animation starten");
  await page.locator("#reset").click();
  await page
    .locator("#view")
    .screenshot({ path: testInfo.outputPath("ellipse.png") });

  const contracts = await page.evaluate(checkDomContracts);
  expect(contracts).toEqual({ values: "123", hidden: true, disposed: true });
  expect(errors).toEqual([]);
}
test(
  "Both pages initialize and respond without browser errors",
  pagesAndControls,
);

/**
 * Ändert einen Regler mit demselben Input-Ereignis wie eine Benutzerinteraktion.
 * @param {import('@playwright/test').Page} page Browserseite.
 * @param {string} id Regler-ID.
 * @param {string} value Neuer numerischer Wert.
 * @returns {Promise<void>} Abgeschlossene Aktualisierung.
 */
async function setRange(page, id, value) {
  await page.locator("#" + id).fill(value);
  await page.locator("#" + id).dispatchEvent("input");
}

/**
 * Prüft Canvas-Größe, Überlauf und Erreichbarkeit der Ansicht.
 * @param {import('@playwright/test').Page} page Browserseite.
 * @returns {Promise<void>} Abgeschlossene Layoutprüfung.
 */
async function verifyLayout(page) {
  const canvas = page.locator("#view canvas");
  await expect(canvas).toBeVisible();
  const viewBox = await page.locator("#view").boundingBox();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox.width).toBeGreaterThan(300);
  expect(canvasBox.height).toBeGreaterThanOrEqual(420);
  expect(Math.abs(canvasBox.width - viewBox.width)).toBeLessThan(1);
  expect(Math.abs(canvasBox.height - viewBox.height)).toBeLessThan(1);
  const overflow = await page.evaluate(horizontalOverflow);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Misst horizontalen Dokumentüberlauf im Browser. Keine Parameter. @returns {number} Überlauf in Pixeln. */
function horizontalOverflow() {
  return document.documentElement.scrollWidth - window.innerWidth;
}

/**
 * Prüft Template-Bindung und Materialfreigabe im tatsächlichen Browser-DOM.
 * Keine Parameter.
 * @returns {Promise<object>} Ergebnisse des DOM-Vertragstests.
 */
async function checkDomContracts() {
  const { mountTemplate } = await import("/shared/template.js");
  const { clearGroup } = await import("/shared/resources.js");
  const THREE = await import("three");
  const target = document.createElement("div");
  const template = document.getElementById("info-template");
  const binding = mountTemplate(target, template);
  binding.values.axes.textContent = "123";
  binding.messages.limit.hidden = true;
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial();
  let disposed = false;
  /** Merkt die Materialfreigabe. Keine Parameter. @returns {void} Kein Rückgabewert. */
  function onDispose() {
    disposed = true;
  }
  material.addEventListener("dispose", onDispose);
  group.add(new THREE.Mesh(new THREE.BufferGeometry(), [material]));
  clearGroup(group);
  return {
    values: target.querySelector('[data-value="axes"]').textContent,
    hidden: binding.messages.limit.hidden,
    disposed,
  };
}
