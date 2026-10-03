import { httpClient } from '../../../shared/api/httpClient.js';

/**
 * API client para el perfil de cuenta del usuario autenticado.
 * El baseURL con /api/v1 es aplicado internamente por httpClient.
 */

/**
 * Obtiene el perfil del usuario autenticado.
 * GET /api/v1/users/me
 * @returns {Promise<object>} DTO UserProfile crudo
 */
export async function getMe() {
  return httpClient('/users/me');
}

/**
 * Elimina la cuenta del usuario autenticado en cascada (diagnósticos, imágenes, sesiones).
 * DELETE /api/v1/users/me → 204 No Content
 * @returns {Promise<void>}
 */
export async function deleteAccount() {
  await httpClient('/users/me', { method: 'DELETE' });
}
