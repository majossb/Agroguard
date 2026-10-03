import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUser } from '../../../src/application/use-cases/auth/RegisterUser.js';
import { LoginUser } from '../../../src/application/use-cases/auth/LoginUser.js';
import { RefreshSession } from '../../../src/application/use-cases/auth/RefreshSession.js';
import { LogoutUser } from '../../../src/application/use-cases/auth/LogoutUser.js';
import { GetCurrentUser } from '../../../src/application/use-cases/auth/GetCurrentUser.js';
import { FakeUserRepository } from '../../fakes/FakeUserRepository.js';
import { FakeRefreshTokenRepository } from '../../fakes/FakeRefreshTokenRepository.js';
import { FakePasswordHasher } from '../../fakes/FakePasswordHasher.js';
import { FakeTokenService } from '../../fakes/FakeTokenService.js';
import { FakeIdGenerator } from '../../fakes/FakeIdGenerator.js';
import { FakeClock } from '../../fakes/FakeClock.js';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../../../src/domain/errors/DomainError.js';


describe('Application Use Cases — Authentication', () => {
  let userRepository;
  let refreshTokenRepository;
  let passwordHasher;
  let tokenService;
  let idGenerator;
  let clock;

  let registerUser;
  let loginUser;
  let refreshSession;
  let logoutUser;
  let getCurrentUser;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    refreshTokenRepository = new FakeRefreshTokenRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock(new Date('2026-09-20T12:00:00.000Z'));

    registerUser = new RegisterUser({
      userRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenService,
      idGenerator,
      clock,
      refreshTtlDays: 30,
    });

    loginUser = new LoginUser({
      userRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenService,
      idGenerator,
      clock,
      refreshTtlDays: 30,
    });

    refreshSession = new RefreshSession({
      userRepository,
      refreshTokenRepository,
      tokenService,
      clock,
      refreshTtlDays: 30,
    });

    logoutUser = new LogoutUser({
      refreshTokenRepository,
      tokenService,
    });

    getCurrentUser = new GetCurrentUser({
      userRepository,
    });
  });

  describe('RegisterUser', () => {
    it('Debe registrar exitosamente un nuevo agricultor y emitir credenciales', async () => {
      const result = await registerUser.execute({
        email: 'agricultor@agroguard.dev',
        password: 'passwordSeguro123',
        fullName: 'Juan Agricultor',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.opaqueRefreshToken).toBeDefined();
      expect(result.user.email).toBe('agricultor@agroguard.dev');
      expect(result.user.fullName).toBe('Juan Agricultor');
      expect(result.user.role).toBe('FARMER');

      // Verificar persistencia
      expect(userRepository.size).toBe(1);
      expect(refreshTokenRepository.size).toBe(1);
    });

    it('Debe rechazar registros con contraseña menor a 8 caracteres con ValidationError', async () => {
      await expect(
        registerUser.execute({
          email: 'corto@agroguard.dev',
          password: '123',
          fullName: 'Juan Corto',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('Debe rechazar registros con correo duplicado con ConflictError', async () => {
      await registerUser.execute({
        email: 'duplicado@agroguard.dev',
        password: 'password123',
        fullName: 'Juan Original',
      });

      await expect(
        registerUser.execute({
          email: 'DUPLICADO@agroguard.dev',
          password: 'otraPassword123',
          fullName: 'Juan Duplicado',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('LoginUser', () => {
    beforeEach(async () => {
      await registerUser.execute({
        email: 'usuario@agroguard.dev',
        password: 'password123',
        fullName: 'Usuario Registrado',
      });
    });

    it('Debe iniciar sesión correctamente con credenciales válidas', async () => {
      const result = await loginUser.execute({
        email: 'usuario@agroguard.dev',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.opaqueRefreshToken).toBeDefined();
      expect(result.user.email).toBe('usuario@agroguard.dev');
    });

    it('Debe rechazar login con contraseña incorrecta con UnauthorizedError genérico', async () => {
      await expect(
        loginUser.execute({
          email: 'usuario@agroguard.dev',
          password: 'passwordIncorrecta',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('Debe rechazar login con correo inexistente con UnauthorizedError genérico (sin enumerar usuarios)', async () => {
      await expect(
        loginUser.execute({
          email: 'noexiste@agroguard.dev',
          password: 'password123',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  describe('RefreshSession & Token Rotation', () => {
    let initialRefreshToken;

    beforeEach(async () => {
      const auth = await registerUser.execute({
        email: 'rotacion@agroguard.dev',
        password: 'password123',
        fullName: 'Usuario Rotacion',
      });
      initialRefreshToken = auth.opaqueRefreshToken;
    });

    it('Debe rotar el refresh token y emitir nuevo access token', async () => {
      const refreshed = await refreshSession.execute(initialRefreshToken);

      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.opaqueRefreshToken).toBeDefined();
      expect(refreshed.opaqueRefreshToken).not.toBe(initialRefreshToken);

      // El token inicial debe haber quedado revocado
      const oldHash = tokenService.hashOpaqueToken(initialRefreshToken);
      const oldTokenData = await refreshTokenRepository.findByHash(oldHash);
      expect(oldTokenData.revokedAt).toBeDefined();
      expect(oldTokenData.replacedBy).toBe(
        tokenService.hashOpaqueToken(refreshed.opaqueRefreshToken)
      );
    });

    it('Debe detectar intento de reutilización (Token Reuse Detection) y revocar toda la familia', async () => {
      // Primera rotación válida
      const refreshed = await refreshSession.execute(initialRefreshToken);

      // Intento de reusar el token inicial que ya fue rotado
      await expect(refreshSession.execute(initialRefreshToken)).rejects.toMatchObject({
        code: 'TOKEN_REUSED',
      });

      // El nuevo token también debe haber quedado revocado al revocarse toda la familia
      const newHash = tokenService.hashOpaqueToken(refreshed.opaqueRefreshToken);
      const newTokenData = await refreshTokenRepository.findByHash(newHash);
      expect(newTokenData.revokedAt).toBeDefined();
      expect(newTokenData.replacedBy).toBe('FAMILY_REVOKED');
    });

    it('Debe rechazar refresh token expirado con TOKEN_EXPIRED', async () => {
      // Avanzar el reloj 35 días
      clock.advanceMinutes(35 * 24 * 60);

      await expect(refreshSession.execute(initialRefreshToken)).rejects.toMatchObject({
        code: 'TOKEN_EXPIRED',
      });
    });
  });

  describe('LogoutUser', () => {
    it('Debe revocar el refresh token al cerrar sesión', async () => {
      const auth = await registerUser.execute({
        email: 'logout@agroguard.dev',
        password: 'password123',
        fullName: 'Usuario Logout',
      });

      await logoutUser.execute(auth.opaqueRefreshToken);

      const hash = tokenService.hashOpaqueToken(auth.opaqueRefreshToken);
      const tokenData = await refreshTokenRepository.findByHash(hash);
      expect(tokenData.revokedAt).toBeDefined();
    });
  });

  describe('GetCurrentUser', () => {
    it('Debe retornar los datos del usuario autenticado', async () => {
      const auth = await registerUser.execute({
        email: 'perfil@agroguard.dev',
        password: 'password123',
        fullName: 'Usuario Perfil',
      });

      const profile = await getCurrentUser.execute(auth.user.id);
      expect(profile.email).toBe('perfil@agroguard.dev');
      expect(profile.fullName).toBe('Usuario Perfil');
      expect(profile.role).toBe('FARMER');
      expect(profile.passwordHash).toBeUndefined();
    });

    it('Debe lanzar NotFoundError si el usuario no existe', async () => {
      await expect(getCurrentUser.execute('id-inexistente')).rejects.toThrow(NotFoundError);
    });
  });
});
