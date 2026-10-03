import { InvalidImageError } from '../../../domain/errors/DomainError.js';
import {
  createDiagnosisSchema,
  updateDiagnosisNotesSchema,
  listDiagnosesQuerySchema,
  submitFeedbackSchema,
} from '../validators/diagnosisValidators.js';

/**
 * Controlador para las operaciones de diagnóstico fitopatológico e historial.
 */
export class DiagnosisController {
  /**
   * @param {object} dependencies
   * @param {import('../../../application/use-cases/diagnosis/CreateDiagnosis.js').CreateDiagnosis} dependencies.createDiagnosis
   * @param {import('../../../application/use-cases/diagnosis/ListDiagnoses.js').ListDiagnoses} dependencies.listDiagnoses
   * @param {import('../../../application/use-cases/diagnosis/GetDiagnosis.js').GetDiagnosis} dependencies.getDiagnosis
   * @param {import('../../../application/use-cases/diagnosis/UpdateDiagnosisNotes.js').UpdateDiagnosisNotes} dependencies.updateDiagnosisNotes
   * @param {import('../../../application/use-cases/diagnosis/DeleteDiagnosis.js').DeleteDiagnosis} dependencies.deleteDiagnosis
   * @param {import('../../../application/use-cases/diagnosis/GetDiagnosisImage.js').GetDiagnosisImage} dependencies.getDiagnosisImage
   * @param {import('../../../application/use-cases/diagnosis/SubmitDiagnosisFeedback.js').SubmitDiagnosisFeedback} dependencies.submitDiagnosisFeedback
   */
  constructor({
    createDiagnosis,
    listDiagnoses,
    getDiagnosis,
    updateDiagnosisNotes,
    deleteDiagnosis,
    getDiagnosisImage,
    submitDiagnosisFeedback,
  }) {
    this.createDiagnosis = createDiagnosis;
    this.listDiagnoses = listDiagnoses;
    this.getDiagnosis = getDiagnosis;
    this.updateDiagnosisNotes = updateDiagnosisNotes;
    this.deleteDiagnosis = deleteDiagnosis;
    this.getDiagnosisImage = getDiagnosisImage;
    this.submitDiagnosisFeedback = submitDiagnosisFeedback;
  }

  /**
   * POST /api/v1/diagnoses
   */
  async create(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        throw new InvalidImageError(
          'Se requiere adjuntar un archivo de imagen en el campo "image" (multipart/form-data).',
          'IMAGE_REQUIRED'
        );
      }

      const validatedBody = createDiagnosisSchema.parse(req.body || {});
      const ownerId = req.user ? req.user.id : null;

      const result = await this.createDiagnosis.execute({
        imageBuffer: req.file.buffer,
        ownerId,
        plotName: validatedBody.plotName,
        cropHint: validatedBody.cropHint,
        notes: validatedBody.notes,
      });

      const statusCode = result.persisted ? 201 : 200;
      return res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/diagnoses
   */
  async list(req, res, next) {
    try {
      const query = listDiagnosesQuerySchema.parse(req.query || {});
      const ownerId = req.user.id;

      const result = await this.listDiagnoses.execute({
        ownerId,
        filters: {
          healthStatus: query.healthStatus,
          cropKey: query.cropKey,
          from: query.from ? new Date(query.from) : undefined,
          to: query.to ? new Date(query.to) : undefined,
        },
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
        },
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/diagnoses/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const result = await this.getDiagnosis.execute({ id, ownerId });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/diagnoses/:id
   */
  async updateNotes(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const validatedBody = updateDiagnosisNotesSchema.parse(req.body || {});

      const result = await this.updateDiagnosisNotes.execute({
        id,
        ownerId,
        plotName: validatedBody.plotName,
        notes: validatedBody.notes,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/diagnoses/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      await this.deleteDiagnosis.execute({ id, ownerId });
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/diagnoses/:id/image
   */
  async getImage(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const { buffer, mimeType } = await this.getDiagnosisImage.execute({ id, ownerId });

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/diagnoses/:id/feedback
   */
  async submitFeedback(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const validatedBody = submitFeedbackSchema.parse(req.body || {});

      const result = await this.submitDiagnosisFeedback.execute({
        diagnosisId: id,
        ownerId,
        wasCorrect: validatedBody.wasCorrect,
        correctClassKey: validatedBody.correctClassKey,
        comment: validatedBody.comment,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
