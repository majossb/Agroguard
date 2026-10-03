import { NotFoundError } from '../../../domain/errors/DomainError.js';
import { Diagnosis } from '../../../domain/entities/Diagnosis.js';

/**
 * Caso de uso para actualizar las notas y nombre de lote de un diagnóstico.
 */
export class UpdateDiagnosisNotes {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   */
  constructor({ diagnosisRepository }) {
    this.diagnosisRepository = diagnosisRepository;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.ownerId
   * @param {string} [params.plotName]
   * @param {string} [params.notes]
   * @returns {Promise<object>}
   */
  async execute({ id, ownerId, plotName, notes }) {
    const existing = await this.diagnosisRepository.findById(id);

    if (!existing || existing.ownerId !== ownerId) {
      throw new NotFoundError('Diagnóstico no encontrado.', 'DIAGNOSIS_NOT_FOUND');
    }

    const updatedContext = {
      ...existing.context,
      plotName: plotName !== undefined ? plotName : existing.context.plotName,
      notes: notes !== undefined ? notes : existing.context.notes,
    };

    const updatedDiagnosis = new Diagnosis({
      id: existing.id,
      ownerId: existing.ownerId,
      image: existing.image,
      verdict: existing.verdict,
      prediction: existing.prediction,
      topPredictions: existing.topPredictions,
      warnings: existing.warnings,
      message: existing.message,
      model: existing.model,
      processingTimeMs: existing.processingTimeMs,
      context: updatedContext,
      createdAt: existing.createdAt,
    });

    await this.diagnosisRepository.save(updatedDiagnosis);

    return {
      id: updatedDiagnosis.id,
      plotName: updatedContext.plotName || null,
      notes: updatedContext.notes || null,
    };
  }
}
