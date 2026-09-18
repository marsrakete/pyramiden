import { mountTemplate } from "../shared/template.js";
/**
 * Bindet das Informations-Template an den Ausgabecontainer.
 * @param {HTMLElement} target Informationscontainer.
 * @param {HTMLTemplateElement} template Struktur der Schnittinformationen.
 * @returns {{update: Function}} Ergebnis der beschriebenen Operation.
 */
export function createStatus(target, template) {
  const { values, messages } = mountTemplate(target, template);
  /**
   * Zeigt Kennzahlen und Begrenzungsstatus der Schnittkurve an.
   * @param {object|null} section Schnittdaten; null blendet die Anzeige aus.
   * @param {number} maximum Aktuell zulässige Höhe am Mittelpunkt.
   * @returns {void} Ergebnis der beschriebenen Operation.
   */
  function update(section, maximum) {
    target.hidden = !section;
    if (!section) {
      return;
    }
    values.axes.textContent =
      section.ax.toFixed(2) + " / " + section.az.toFixed(2);
    values.eccentricity.textContent = section.eccentricity.toFixed(3);
    values.range.textContent =
      section.ymin.toFixed(2) + "–" + section.ymax.toFixed(2);
    values.maximum.textContent = maximum.toFixed(2);
    messages.finite.hidden = !section.finite;
    messages.limit.hidden = section.finite;
  }
  return { update };
}
