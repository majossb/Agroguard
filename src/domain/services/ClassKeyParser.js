import { ValidationError } from '../errors/DomainError.js';

const SPANISH_CROP_NAMES = {
  Apple: 'Manzana',
  Blueberry: 'Arándano',
  'Cherry_(including_sour)': 'Cereza',
  'Corn_(maize)': 'Maíz',
  Grape: 'Vid / Uva',
  Orange: 'Naranja',
  Peach: 'Melocotón / Durazno',
  'Pepper,_bell': 'Pimiento / Pimentón',
  Potato: 'Papa / Patata',
  Raspberry: 'Frambuesa',
  Soybean: 'Soja / Soya',
  Squash: 'Calabaza / Zapallo',
  Strawberry: 'Fresa / Frutilla',
  Tomato: 'Tomate',
};

const SPANISH_CONDITION_NAMES = {
  Apple_scab: 'Sarna del manzano (Venturia inaequalis)',
  Black_rot: 'Podredumbre negra',
  Cedar_apple_rust: 'Roya del cedro y manzano',
  healthy: 'Hoja sana',
  Powdery_mildew: 'Oídio / Cenicilla',
  'Cercospora_leaf_spot Gray_leaf_spot': 'Mancha foliar por Cercospora / Mancha gris',
  Common_rust_: 'Roya común',
  Northern_Leaf_Blight: 'Tizón foliar del norte',
  'Esca_(Black_Measles)': 'Esca / Sarampión negro',
  'Leaf_blight_(Isariopsis_Leaf_Spot)': 'Tizón de la hoja (Mancha por Isariopsis)',
  'Haunglongbing_(Citrus_greening)': 'Huanglongbing (HLB / Enverdecimiento de los cítricos)',
  Bacterial_spot: 'Mancha bacteriana',
  Early_blight: 'Tizón temprano (Alternaria)',
  Late_blight: 'Tizón tardío (Phytophthora)',
  Leaf_Mold: 'Moho de la hoja (Passalora fulva)',
  Septoria_leaf_spot: 'Mancha foliar por Septoria',
  'Spider_mites Two-spotted_spider_mite': 'Ácaros (Araña roja de dos manchas)',
  Target_Spot: 'Mancha diana (Corynespora)',
  Tomato_Yellow_Leaf_Curl_Virus: 'Virus del rizado amarillo del tomate (TYLCV)',
  Tomato_mosaic_virus: 'Virus del mosaico del tomate (ToMV)',
  Leaf_scorch: 'Quemadura de la hoja',
};

/**
 * Servicio de dominio puro para parsear y traducir etiquetas de clase fitopatológicas.
 */
export class ClassKeyParser {
  /**
   * Parsea un classKey con formato 'Cultivo___Condición'
   * @param {string} rawClassKey
   * @returns {{
   *   classKey: string,
   *   cropKey: string,
   *   conditionKey: string,
   *   isHealthy: boolean,
   *   cropName: string,
   *   conditionName: string
   * }}
   */
  static parse(rawClassKey) {
    if (typeof rawClassKey !== 'string' || !rawClassKey.includes('___')) {
      throw new ValidationError(
        `El formato de classKey '${rawClassKey}' es inválido. Debe contener '___'.`,
        'CLASS_KEY_INVALID_FORMAT'
      );
    }

    const separatorIndex = rawClassKey.indexOf('___');
    const cropKey = rawClassKey.slice(0, separatorIndex).trim();
    const conditionKey = rawClassKey.slice(separatorIndex + 3).trim();

    if (!cropKey || !conditionKey) {
      throw new ValidationError(
        `El classKey '${rawClassKey}' no define un cultivo o condición válidos.`,
        'CLASS_KEY_INVALID_PARTS'
      );
    }

    const isHealthy = conditionKey.toLowerCase() === 'healthy';
    const cropName = SPANISH_CROP_NAMES[cropKey] || cropKey;
    const conditionName = SPANISH_CONDITION_NAMES[conditionKey] || conditionKey.replace(/_/g, ' ');

    return {
      classKey: rawClassKey,
      cropKey,
      conditionKey,
      isHealthy,
      cropName,
      conditionName,
    };
  }

  /**
   * Obtiene la traducción al español de un cultivo
   * @param {string} cropKey
   * @returns {string}
   */
  static getCropName(cropKey) {
    return SPANISH_CROP_NAMES[cropKey] || cropKey;
  }

  /**
   * Obtiene la traducción al español de una condición
   * @param {string} conditionKey
   * @returns {string}
   */
  static getConditionName(conditionKey) {
    return SPANISH_CONDITION_NAMES[conditionKey] || conditionKey.replace(/_/g, ' ');
  }
}
