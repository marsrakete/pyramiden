import { distanceAt, exactMeeting } from "./geometry.js";
import { mountTemplate } from "../shared/template.js";
/**
 * Bindet das Status-Template an den Ausgabecontainer.
 * @param {HTMLElement} target Statuscontainer mit Modusbeschriftungen.
 * @param {HTMLTemplateElement} template Statusstruktur.
 * @returns {{update: Function}} Ergebnis der beschriebenen Operation.
 */
export function createStatus(target, template) {
  const { values, messages } = mountTemplate(target, template);
  /**
   * Zeigt Modus, Spitzenabstand und erreichbaren Minimalabstand an.
   * @param {object} p Aktuelle Abmessungen und Winkel.
   * @param {boolean} finalMode Aktueller Darstellungsmodus.
   * @returns {void} Ergebnis der beschriebenen Operation.
   */
  function update(p, finalMode) {
    const meeting = exactMeeting(p);
    if (finalMode) {
      values.mode.textContent = target.dataset.final;
    } else {
      values.mode.textContent = target.dataset.separate;
    }
    values.distance.textContent = distanceAt(p, p.angle).toFixed(3);
    values.angle.textContent = meeting.angle.toFixed(2) + "°";
    values.minimum.textContent = meeting.distance.toFixed(3);
    messages.exact.hidden = meeting.distance >= 0.01;
    messages.apart.hidden = meeting.distance < 0.01;
  }
  return { update };
}
