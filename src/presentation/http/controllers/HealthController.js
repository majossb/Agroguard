/**
 * Controlador para la verificación de salud del sistema.
 */
export class HealthController {
  /**
   * @param {object} dependencies
   * @param {import('../../../application/ports/Clock.js').Clock} dependencies.clock
   * @param {object} [dependencies.healthChecker]
   */
  constructor({ clock, healthChecker }) {
    this.clock = clock;
    this.healthChecker = healthChecker;
  }

  /**
   * Maneja GET /api/v1/health
   */
  async getHealth(req, res, next) {
    try {
      const now = this.clock ? this.clock.now().toISOString() : new Date().toISOString();

      let status = 'UP';
      let checks = {
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: now,
      };

      if (this.healthChecker && typeof this.healthChecker.check === 'function') {
        const checkResult = await this.healthChecker.check();
        status = checkResult.status;
        checks = { ...checks, ...checkResult.checks };
      }

      const statusCode = status === 'UP' ? 200 : 503;

      return res.status(statusCode).json({
        status,
        timestamp: now,
        service: 'agroguard-backend',
        version: '1.0.0',
        checks,
      });
    } catch (error) {
      next(error);
    }
  }
}
