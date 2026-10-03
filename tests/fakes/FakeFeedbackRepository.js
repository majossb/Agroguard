import { FeedbackRepository } from '../../src/application/ports/FeedbackRepository.js';

export class FakeFeedbackRepository extends FeedbackRepository {
  constructor() {
    super();
    /** @type {Map<string, import('../../src/domain/entities/Feedback.js').Feedback>} */
    this.store = new Map();
  }

  async save(feedback) {
    this.store.set(feedback.id, feedback);
    return feedback;
  }

  async findByDiagnosisId(diagnosisId) {
    for (const fb of this.store.values()) {
      if (fb.diagnosisId === diagnosisId) {
        return fb;
      }
    }
    return null;
  }

  async deleteByDiagnosisId(diagnosisId) {
    for (const [id, fb] of this.store.entries()) {
      if (fb.diagnosisId === diagnosisId) {
        this.store.delete(id);
        return true;
      }
    }
    return false;
  }

  async deleteByOwnerId(ownerId) {
    let count = 0;
    for (const [id, fb] of this.store.entries()) {
      if (fb.ownerId === ownerId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  get size() {
    return this.store.size;
  }
}
