import { registerUserSchema, loginUserSchema } from '../validators/authValidators.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

/**
 * Controlador para operaciones de autenticación y gestión de sesiones y perfil.
 */
export class AuthController {
  /**
   * @param {object} dependencies
   * @param {import('../../../application/use-cases/auth/RegisterUser.js').RegisterUser} dependencies.registerUser
   * @param {import('../../../application/use-cases/auth/LoginUser.js').LoginUser} dependencies.loginUser
   * @param {import('../../../application/use-cases/auth/RefreshSession.js').RefreshSession} dependencies.refreshSession
   * @param {import('../../../application/use-cases/auth/LogoutUser.js').LogoutUser} dependencies.logoutUser
   * @param {import('../../../application/use-cases/auth/GetCurrentUser.js').GetCurrentUser} dependencies.getCurrentUser
   * @param {import('../../../application/use-cases/auth/DeleteAccount.js').DeleteAccount} [dependencies.deleteAccount]
   * @param {object} dependencies.config
   */
  constructor({
    registerUser,
    loginUser,
    refreshSession,
    logoutUser,
    getCurrentUser,
    deleteAccount = null,
    config,
  }) {
    this.registerUser = registerUser;
    this.loginUser = loginUser;
    this.refreshSession = refreshSession;
    this.logoutUser = logoutUser;
    this.getCurrentUser = getCurrentUser;
    this.deleteAccountUseCase = deleteAccount;
    this.config = config;
  }

  /**
   * Obtiene la configuración para la cookie del Refresh Token
   */
  #getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.COOKIE_SECURE,
      sameSite: this.config.COOKIE_SAMESITE,
      path: REFRESH_COOKIE_PATH,
      domain: this.config.COOKIE_DOMAIN || undefined,
      maxAge: this.config.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    };
  }

  /**
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const validated = registerUserSchema.parse(req.body);
      const result = await this.registerUser.execute(validated);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.opaqueRefreshToken,
        this.#getCookieOptions()
      );

      return res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const validated = loginUserSchema.parse(req.body);
      const result = await this.loginUser.execute(validated);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.opaqueRefreshToken,
        this.#getCookieOptions()
      );

      return res.status(200).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
      const result = await this.refreshSession.execute(rawRefreshToken);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.opaqueRefreshToken,
        this.#getCookieOptions()
      );

      return res.status(200).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
      await this.logoutUser.execute(rawRefreshToken);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        path: REFRESH_COOKIE_PATH,
        domain: this.config.COOKIE_DOMAIN || undefined,
      });

      return res.status(200).json({
        message: 'Sesión cerrada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me
   */
  async me(req, res, next) {
    try {
      const result = await this.getCurrentUser.execute(req.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me
   */
  async deleteAccount(req, res, next) {
    try {
      if (this.deleteAccountUseCase) {
        await this.deleteAccountUseCase.execute(req.user.id);
      }

      res.clearCookie(REFRESH_COOKIE_NAME, {
        path: REFRESH_COOKIE_PATH,
        domain: this.config.COOKIE_DOMAIN || undefined,
      });

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
