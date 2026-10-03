import { User, USER_ROLES } from '../../../domain/entities/User.js';
import { Email } from '../../../domain/value-objects/Email.js';
import { ConflictError, ValidationError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para registrar un nuevo agricultor en AgroGuard.
 */
export class RegisterUser {
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
   * @param {import('../../dtos/AuthDTOs.js').RegisterUserInput} input
   * @returns {Promise<import('../../dtos/AuthDTOs.js').AuthResponseDTO>}
   */
  async execute(input) {
    const { email: rawEmail, password, fullName } = input;

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new ValidationError(
        'La contraseña debe tener al menos 8 caracteres.',
        'PASSWORD_TOO_SHORT'
      );
    }

    const emailVO = new Email(rawEmail);

    // Verificar si el correo ya está registrado
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (existingUser) {
      throw new ConflictError(
        'El correo electrónico ya se encuentra registrado.',
        'EMAIL_ALREADY_EXISTS'
      );
    }

    // Hash de la contraseña con bcrypt cost 12
    const passwordHash = await this.passwordHasher.hash(password);
    const userId = this.idGenerator.generate();
    const now = this.clock.now();

    const user = new User({
      id: userId,
      email: emailVO,
      passwordHash,
      fullName,
      role: USER_ROLES.FARMER,
      createdAt: now,
    });

    await this.userRepository.save(user);

    // Emisión de Access Token JWT
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email.value,
    });

    // Emisión de Refresh Token opaco
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
