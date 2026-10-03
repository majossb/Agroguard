import { Clock } from '../../src/application/ports/Clock.js';

export class FakeClock extends Clock {
  constructor(initialDate = new Date('2026-09-20T15:00:00.000Z')) {
    super();
    this.currentDate = new Date(initialDate);
  }

  now() {
    return new Date(this.currentDate);
  }

  advanceMinutes(minutes) {
    this.currentDate.setMinutes(this.currentDate.getMinutes() + minutes);
  }

  setDate(date) {
    this.currentDate = new Date(date);
  }
}
