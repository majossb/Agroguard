/**
 * Caso de uso para cerrar la sesión revocando el token de actualización.
 */
export class LogoutUser {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/RefreshTokenRepository.js').RefreshTokenRepository} dependencies.refreshTokenRepository
   * @param {import('../../ports/TokenService.js').TokenService} dependencies.tokenService
   */
  constructor({ refreshTokenRepository, tokenService }) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenService = tokenService;
  }

  /**
   * @param {string|null} rawRefreshToken
   * @returns {Promise<void>}
   */
  async execute(rawRefreshToken) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return;
    }

    const tokenHash = this.tokenService.hashOpaqueToken(rawRefreshToken);
    const tokenData = await this.refreshTokenRepository.findByHash(tokenHash);

    if (tokenData && !tokenData.revokedAt) {
      await this.refreshTokenRepository.revokeAndReplace(tokenHash, 'LOGGED_OUT');
    }
  }
}
