import { listConditionsQuerySchema } from '../validators/catalogValidators.js';

/**
 * Controlador para las consultas del catálogo fitopatológico y cultivos soportados.
 */
export class CatalogController {
  /**
   * @param {object} dependencies
   * @param {import('../../../application/use-cases/catalog/ListConditions.js').ListConditions} dependencies.listConditions
   * @param {import('../../../application/use-cases/catalog/GetCondition.js').GetCondition} dependencies.getCondition
   * @param {import('../../../application/use-cases/catalog/ListCrops.js').ListCrops} dependencies.listCrops
   */
  constructor({ listConditions, getCondition, listCrops }) {
    this.listConditions = listConditions;
    this.getCondition = getCondition;
    this.listCrops = listCrops;
  }

  /**
   * GET /api/v1/catalog/conditions
   */
  async listConditionsHandler(req, res, next) {
    try {
      const query = listConditionsQuerySchema.parse(req.query || {});
      const result = await this.listConditions.execute(query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/conditions/:classKey
   */
  async getConditionHandler(req, res, next) {
    try {
      const { classKey } = req.params;
      const result = await this.getCondition.execute(classKey);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/crops
   */
  async listCropsHandler(req, res, next) {
    try {
      const result = await this.listCrops.execute();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
