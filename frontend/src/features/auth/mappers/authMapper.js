/**
 * Mapper con lista blanca estricta para el usuario y autenticación.
 */

/**
 * @param {any} rawUser
 * @returns {{ id: string, email: string, fullName: string, role: string, createdAt: string }}
 */
export function mapUserResponse(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') {
    throw new Error('Datos de usuario inválidos.');
  }

  return {
    id: String(rawUser.id || ''),
    email: String(rawUser.email || ''),
    fullName: String(rawUser.fullName || ''),
    role: rawUser.role === 'FARMER' ? 'FARMER' : 'FARMER',
    createdAt: typeof rawUser.createdAt === 'string' ? rawUser.createdAt : new Date().toISOString(),
  };
}

/**
 * @param {any} rawAuth
 * @returns {{ accessToken: string, user: { id: string, email: string, fullName: string, role: string, createdAt: string } }}
 */
export function mapAuthResponse(rawAuth) {
  if (!rawAuth || typeof rawAuth !== 'object' || typeof rawAuth.accessToken !== 'string') {
    throw new Error('Respuesta de autenticación incompleta.');
  }

  return {
    accessToken: rawAuth.accessToken,
    user: mapUserResponse(rawAuth.user),
  };
}
