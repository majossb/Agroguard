import { v4 as uuidv4 } from 'uuid';
import { IdGenerator } from '../../application/ports/IdGenerator.js';

/**
 * Adaptador concreto para generar UUID v4.
 * @implements {IdGenerator}
 */
export class UuidGenerator extends IdGenerator {
  /**
   * @returns {string}
   */
  generate() {
    return uuidv4();
  }
}
