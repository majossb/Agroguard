/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: El directorio dist no existe. Ejecuta `npm run build` primero.');
  process.exit(1);
}

const forbiddenPatterns = [
  /jwt_secret/i,
  /mongodb:\/\//i,
  /super_secret/i,
  /refresh_secret/i,
  /process\.env\.JWT/i,
  /process\.env\.MONGO/i,
];

let hasErrors = false;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          console.error(`❌ Alerta de Seguridad: Patrón prohibido ${pattern} encontrado en ${fullPath}`);
          hasErrors = true;
        }
      }
    }
  }
}

scanDirectory(distDir);

if (hasErrors) {
  console.error('Verificación de seguridad de bundle fallida. Hay información sensible potencial.');
  process.exit(1);
} else {
  console.log('✅ check:bundle exitoso: No se detectaron secretos ni variables privadas en el bundle compilado.');
  process.exit(0);
}
