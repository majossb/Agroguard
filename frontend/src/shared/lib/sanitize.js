/**
 * Sanitiza rutas internas de redirección para evitar ataques de redirección abierta (Open Redirect).
 * @param {string|null|undefined} returnTo
 * @param {string} [fallback='/']
 * @returns {string}
 */
export function sanitizeReturnTo(returnTo, fallback = '/') {
  if (!returnTo || typeof returnTo !== 'string') {
    return fallback;
  }

  const trimmed = returnTo.trim();

  // Debe empezar con un solo '/' y no con '//' (evita protocol-relative URLs como //evil.com)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // No debe contener esquemas (http:, https:, javascript:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
