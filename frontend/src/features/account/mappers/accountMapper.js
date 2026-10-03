/**
 * Mapper con lista blanca estricta para el perfil de usuario.
 * Nunca devuelve un DTO completo al componente.
 *
 * Campos permitidos del UserProfile (OpenAPI):
 *   id, email, fullName, role, createdAt
 */

/**
 * @param {any} raw - DTO UserProfile del backend
 * @returns {{ id: string, email: string, fullName: string, role: string, createdAt: string }}
 */
export function mapUserProfile(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Perfil de usuario inválido o vacío.');
  }

  return {
    id: String(raw.id || ''),
    email: typeof raw.email === 'string' ? raw.email : '',
    fullName: typeof raw.fullName === 'string' ? raw.fullName : '',
    role: typeof raw.role === 'string' ? raw.role : 'FARMER',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}
