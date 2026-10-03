/**
 * Utilidades de formateo visual seguro para la interfaz.
 */

/**
 * Formatea una probabilidad o confianza en porcentaje legible.
 * @param {number|null|undefined} value - Valor entre 0 y 1
 * @param {number} [decimals=1]
 * @returns {string} Ej: "94.2 %"
 */
export function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.0 %';
  }
  const clamped = Math.max(0, Math.min(1, value));
  return `${(clamped * 100).toFixed(decimals)} %`;
}

/**
 * Formatea una fecha ISO en español de forma amigable.
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} Ej: "20 de septiembre de 2026, 15:30"
 */
export function formatDate(dateInput) {
  if (!dateInput) return 'Fecha no disponible';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Fecha inválida';

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatea bytes a megabytes o kilobytes legibles.
 * @param {number} bytes
 * @returns {string} Ej: "2.4 MB"
 */
export function formatBytes(bytes) {
  if (typeof bytes !== 'number' || bytes <= 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}
