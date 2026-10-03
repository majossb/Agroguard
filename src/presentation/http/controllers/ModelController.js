/**
 * Controlador para consultar los metadatos y especificaciones técnicas del modelo de IA.
 */
export class ModelController {
  /**
   * @param {object} dependencies
   * @param {import('../../../application/use-cases/model/GetModelInfo.js').GetModelInfo} dependencies.getModelInfo
   */
  constructor({ getModelInfo }) {
    this.getModelInfo = getModelInfo;
  }

  /**
   * GET /api/v1/model/info
   */
  async getInfo(req, res, next) {
    try {
      const info = await this.getModelInfo.execute();
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
}
