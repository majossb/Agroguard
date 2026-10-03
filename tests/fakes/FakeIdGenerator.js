import { IdGenerator } from '../../src/application/ports/IdGenerator.js';

export class FakeIdGenerator extends IdGenerator {
  constructor(fixedIds = []) {
    super();
    this.fixedIds = [...fixedIds];
    this.callCount = 0;
  }

  generate() {
    this.callCount++;
    if (this.fixedIds.length > 0) {
      return this.fixedIds.shift();
    }
    return `fake-id-${this.callCount}`;
  }
}
