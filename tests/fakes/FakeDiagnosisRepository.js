import { DiagnosisRepository } from '../../src/application/ports/DiagnosisRepository.js';

export class FakeDiagnosisRepository extends DiagnosisRepository {
  constructor({ shouldFailOnSave = false } = {}) {
    super();
    /** @type {Map<string, import('../../src/domain/entities/Diagnosis.js').Diagnosis>} */
    this.store = new Map();
    this.shouldFailOnSave = shouldFailOnSave;
  }

  async save(diagnosis) {
    if (this.shouldFailOnSave) {
      throw new Error('Fallo simulado al guardar diagnóstico en BD');
    }
    this.store.set(diagnosis.id, diagnosis);
    return diagnosis;
  }

  async findById(id) {
    return this.store.get(id) || null;
  }

  async findByOwner(ownerId, filters = {}, pagination = { page: 1, pageSize: 20 }) {
    let items = [...this.store.values()].filter((d) => d.ownerId === ownerId);

    if (filters.healthStatus) {
      items = items.filter((d) => d.verdict.healthStatus.value === filters.healthStatus);
    }
    if (filters.cropKey) {
      items = items.filter((d) => d.prediction.cropKey === filters.cropKey);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pagination.pageSize) || 1;
    const start = (pagination.page - 1) * pagination.pageSize;
    const paged = items.slice(start, start + pagination.pageSize);

    return { items: paged, page: pagination.page, pageSize: pagination.pageSize, totalItems, totalPages };
  }

  async deleteById(id) {
    return this.store.delete(id);
  }

  async deleteByOwnerId(ownerId) {
    let count = 0;
    for (const [id, d] of this.store.entries()) {
      if (d.ownerId === ownerId) {
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
