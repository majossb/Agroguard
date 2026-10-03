import { Clock } from '../../application/ports/Clock.js';

/**
 * Adaptador concreto para el reloj del sistema.
 * @implements {Clock}
 */
export class SystemClock extends Clock {
  /**
   * @returns {Date}
   */
  now() {
    return new Date();
  }
}
