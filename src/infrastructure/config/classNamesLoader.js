import fs from 'fs';
import path from 'path';

/**
 * Carga y valida la lista de clases fitopatológicas desde data/class_names.json.
 * @param {string} [filePath]
 * @param {number} [expectedCount=38]
 * @returns {readonly string[]}
 */
export function loadClassNames(
  filePath = path.resolve(process.cwd(), 'data/class_names.json'),
  expectedCount = 38
) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Error de arranque: El archivo de clases '${filePath}' no existe. Debe colocarse el archivo real exportado de Colab o el provisional.`
    );
  }

  let rawData;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    rawData = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Error de arranque: No se pudo parsear el JSON de '${filePath}': ${error.message}`
    );
  }

  if (!Array.isArray(rawData)) {
    throw new Error(
      `Error de arranque: '${filePath}' debe contener un arreglo JSON con los nombres de clases.`
    );
  }

  if (rawData.length !== expectedCount) {
    throw new Error(
      `Error de arranque: '${filePath}' contiene ${rawData.length} clases, pero se esperaban exactamente ${expectedCount}.`
    );
  }

  const uniqueClasses = new Set(rawData);
  if (uniqueClasses.size !== rawData.length) {
    throw new Error(
      `Error de arranque: '${filePath}' contiene clases duplicadas.`
    );
  }

  for (const name of rawData) {
    if (typeof name !== 'string' || !name.includes('___')) {
      throw new Error(
        `Error de arranque: La clase '${name}' no cumple con el formato requerido 'Cultivo___Condición'.`
      );
    }
  }

  return Object.freeze([...rawData]);
}
