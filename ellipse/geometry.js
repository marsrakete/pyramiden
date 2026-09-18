import { coneDimensions, sampleCount } from "./config.js";
const k = coneDimensions.radius / coneDimensions.height;
/**
 * Berechnet die maximale Schnitthöhe für eine vollständig im Kegel liegende Ellipse.
 * @param {number} slope Endliche Steigung der Schnittebene; offene Schnitte liefern 0.
 * @returns {number} Ergebnis der beschriebenen Operation.
 */
export function maxHeightForAngle(slope) {
  if (!Number.isFinite(slope)) {
    throw new TypeError("Slope must be finite");
  }
  const factor = 1 - Math.abs(k * slope);
  if (factor <= 0) {
    return 0;
  }
  return coneDimensions.height * factor;
}
/**
 * Berechnet die Schnittkurve aus Kegel- und Ebenengleichung.
 * @param {number} height Nichtnegative endliche Höhe am Mittelpunkt.
 * @param {number} slope Endliche Steigung; offene Schnitte liefern null.
 * @returns {object|null} Ergebnis der beschriebenen Operation.
 */
export function ellipseSection(height, slope) {
  if (!Number.isFinite(height) || height < 0 || !Number.isFinite(slope)) {
    throw new TypeError("Expected nonnegative height and finite slope");
  }
  const A = 1 - k * k * slope * slope;
  if (A <= 0) {
    return null;
  }
  const B = -2 * k * k * height * slope,
    C = -k * k * height * height;
  const center = -B / (2 * A),
    rhs = (B * B) / (4 * A) - C;
  const ax = Math.sqrt(rhs / A),
    az = Math.sqrt(rhs);
  const points = [];
  for (let i = 0; i < sampleCount; i++) {
    const phase = (i / sampleCount) * Math.PI * 2,
      x = center + ax * Math.cos(phase),
      z = az * Math.sin(phase);
    points.push([x, height + slope * x, z]);
  }
  const ymin = height + slope * center - Math.abs(slope * ax),
    ymax = height + slope * center + Math.abs(slope * ax);
  let eccentricity = 0;
  if (ax > 0) {
    eccentricity = Math.sqrt(
      Math.max(0, 1 - Math.min(ax, az) ** 2 / Math.max(ax, az) ** 2),
    );
  }
  return {
    points,
    ax,
    az,
    ymin,
    ymax,
    eccentricity,
    finite: ymin >= -1e-9 && ymax <= coneDimensions.height + 1e-9,
  };
}
