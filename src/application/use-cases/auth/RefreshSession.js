import { UnauthorizedError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para refrescar la sesión con rotación estricta y detección de reutilización.
 */
export class RefreshSession {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/UserRepository.js').UserRepository} dependencies.userRepository
   * @param {import('../../ports/RefreshTokenRepository.js').RefreshTokenRepository} dependencies.refreshTokenRepository
   * @param {import('../../ports/TokenService.js').TokenService} dependencies.tokenService
   * @param {import('../../ports/Clock.js').Clock} dependencies.clock
   * @param {number} [dependencies.refreshTtlDays=30]
   */
  constructor({
    userRepository,
    refreshTokenRepository,
    tokenService,
    clock,
    refreshTtlDays = 30,
  }) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenService = tokenService;
    this.clock = clock;
    this.refreshTtlDays = refreshTtlDays;
  }

  /**
   * @param {string} rawRefreshToken
   * @returns {Promise<import('../../dtos/AuthDTOs.js').AuthResponseDTO>}
   */
  async execute(rawRefreshToken) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedError(
        'Token de actualización no proporcionado.',
        'TOKEN_REQUIRED'
      );
    }

    const tokenHash = this.tokenService.hashOpaqueToken(rawRefreshToken);
    const tokenData = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!tokenData) {
      throw new UnauthorizedError(
        'Token de actualización inválido o revocado.',
        'TOKEN_INVALID'
      );
    }

    // Detección de reutilización (Token Reuse Detection)
    if (tokenData.revokedAt) {
      // Revocar inmediatamente toda la familia de tokens
      await this.refreshTokenRepository.revokeFamily(tokenData.familyId);
      throw new UnauthorizedError(
        'Intento de reutilización de token detectado. Sesión cerrada por seguridad.',
        'TOKEN_REUSED'
      );
    }

    const now = this.clock.now();

    // Verificación de expiración
    if (new Date(tokenData.expiresAt).getTime() <= now.getTime()) {
      throw new UnauthorizedError(
        'El token de actualización ha expirado.',
        'TOKEN_EXPIRED'
      );
    }

    // Generar nuevo Refresh Token para rotación
    const { token: newOpaqueToken, tokenHash: newTokenHash } =
      this.tokenService.generateOpaqueRefreshToken();

    // Revocar el token actual y marcar su reemplazo
    await this.refreshTokenRepository.revokeAndReplace(tokenHash, newTokenHash);

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);

    // Guardar nuevo token en la misma familia
    await this.refreshTokenRepository.save({
      tokenHash: newTokenHash,
      userId: tokenData.userId,
      familyId: tokenData.familyId,
      expiresAt,
      revokedAt: null,
      replacedBy: null,
      createdAt: now,
    });

    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw new UnauthorizedError(
        'El usuario asociado al token no existe.',
        'USER_NOT_FOUND'
      );
    }

    // Emitir nuevo JWT
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email.value,
    });

    return {
      accessToken,
      opaqueRefreshToken: newOpaqueToken,
      user: {
        id: user.id,
        email: user.email.value,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}
