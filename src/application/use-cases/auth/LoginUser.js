import { Email } from '../../../domain/value-objects/Email.js';
import { UnauthorizedError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para iniciar sesión y emitir credenciales seguras.
 */
export class LoginUser {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/UserRepository.js').UserRepository} dependencies.userRepository
   * @param {import('../../ports/RefreshTokenRepository.js').RefreshTokenRepository} dependencies.refreshTokenRepository
   * @param {import('../../ports/PasswordHasher.js').PasswordHasher} dependencies.passwordHasher
   * @param {import('../../ports/TokenService.js').TokenService} dependencies.tokenService
   * @param {import('../../ports/IdGenerator.js').IdGenerator} dependencies.idGenerator
   * @param {import('../../ports/Clock.js').Clock} dependencies.clock
   * @param {number} [dependencies.refreshTtlDays=30]
   */
  constructor({
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    idGenerator,
    clock,
    refreshTtlDays = 30,
  }) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.refreshTtlDays = refreshTtlDays;
  }

  /**
   * @param {import('../../dtos/AuthDTOs.js').LoginUserInput} input
   * @returns {Promise<import('../../dtos/AuthDTOs.js').AuthResponseDTO>}
   */
  async execute(input) {
    const { email: rawEmail, password } = input;

    if (!rawEmail || !password) {
      throw new UnauthorizedError(
        'Credenciales inválidas.',
        'INVALID_CREDENTIALS'
      );
    }

    let emailVO;
    try {
      emailVO = new Email(rawEmail);
    } catch {
      throw new UnauthorizedError(
        'Credenciales inválidas.',
        'INVALID_CREDENTIALS'
      );
    }

    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new UnauthorizedError(
        'Credenciales inválidas.',
        'INVALID_CREDENTIALS'
      );
    }

    const isValidPassword = await this.passwordHasher.compare(
      password,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new UnauthorizedError(
        'Credenciales inválidas.',
        'INVALID_CREDENTIALS'
      );
    }

    const now = this.clock.now();

    // Emisión de Access Token JWT
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email.value,
    });

    // Emisión de nuevo Refresh Token opaco
    const { token: opaqueRefreshToken, tokenHash } =
      this.tokenService.generateOpaqueRefreshToken();

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);
    const familyId = this.idGenerator.generate();

    await this.refreshTokenRepository.save({
      tokenHash,
      userId: user.id,
      familyId,
      expiresAt,
      revokedAt: null,
      replacedBy: null,
      createdAt: now,
    });

    return {
      accessToken,
      opaqueRefreshToken,
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
