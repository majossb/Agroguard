import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

/**
 * Crea las rutas para la documentación interactiva OpenAPI / Swagger UI
 */
export function createDocsRoutes() {
  const router = Router();
  const openapiYamlPath = path.resolve(process.cwd(), 'docs/openapi.yaml');

  let openapiDocument = null;
  let rawYaml = '';

  if (fs.existsSync(openapiYamlPath)) {
    rawYaml = fs.readFileSync(openapiYamlPath, 'utf-8');
    try {
      openapiDocument = YAML.parse(rawYaml);
    } catch {
      openapiDocument = null;
    }
  }

  if (openapiDocument) {
    // Endpoint para obtener la especificación en JSON
    router.get('/docs/openapi.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(openapiDocument);
    });

    // Endpoint para obtener la especificación en YAML
    router.get('/docs/openapi.yaml', (req, res) => {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.send(rawYaml);
    });

    // Interfaz gráfica interactiva Swagger UI
    router.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(openapiDocument, {
        customSiteTitle: 'AgroGuard API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
      })
    );
  }

  return router;
}
