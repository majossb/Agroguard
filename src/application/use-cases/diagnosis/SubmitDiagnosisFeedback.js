import { Feedback } from '../../../domain/entities/Feedback.js';
import { NotFoundError, ConflictError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para enviar retroalimentación sobre la precisión de un diagnóstico.
 */
export class SubmitDiagnosisFeedback {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   * @param {import('../../ports/FeedbackRepository.js').FeedbackRepository} dependencies.feedbackRepository
   * @param {import('../../ports/IdGenerator.js').IdGenerator} dependencies.idGenerator
   * @param {import('../../ports/Clock.js').Clock} dependencies.clock
   */
  constructor({ diagnosisRepository, feedbackRepository, idGenerator, clock }) {
    this.diagnosisRepository = diagnosisRepository;
    this.feedbackRepository = feedbackRepository;
    this.idGenerator = idGenerator;
    this.clock = clock;
  }

  /**
   * @param {object} params
   * @param {string} params.diagnosisId
   * @param {string} params.ownerId
   * @param {boolean} params.wasCorrect
   * @param {string|null} [params.correctClassKey]
   * @param {string|null} [params.comment]
   * @returns {Promise<object>}
   */
  async execute({ diagnosisId, ownerId, wasCorrect, correctClassKey = null, comment = null }) {
    const diagnosis = await this.diagnosisRepository.findById(diagnosisId);

    if (!diagnosis || diagnosis.ownerId !== ownerId) {
      throw new NotFoundError('Diagnóstico no encontrado.', 'DIAGNOSIS_NOT_FOUND');
    }

    const existingFeedback = await this.feedbackRepository.findByDiagnosisId(diagnosisId);
    if (existingFeedback) {
      throw new ConflictError(
        'Ya se ha registrado retroalimentación para este diagnóstico.',
        'FEEDBACK_ALREADY_SUBMITTED'
      );
    }

    const feedbackId = this.idGenerator.generate();
    const now = this.clock.now();

    const feedback = new Feedback({
      id: feedbackId,
      diagnosisId,
      ownerId,
      wasCorrect,
      correctClassKey,
      comment,
      createdAt: now,
    });

    await this.feedbackRepository.save(feedback);

    return {
      id: feedback.id,
      diagnosisId: feedback.diagnosisId,
      wasCorrect: feedback.wasCorrect,
      correctClassKey: feedback.correctClassKey,
      comment: feedback.comment,
      createdAt: feedback.createdAt.toISOString(),
    };
  }
}
