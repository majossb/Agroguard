import { COPY } from '../../../shared/config/copy.es.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Valida formato y tamaño del archivo de imagen en el cliente.
 * @param {File} file
 * @param {number} maxMb
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file, maxMb = 8) {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Por favor, selecciona una fotografía de la hoja.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: COPY.errors.imageInvalidType };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `${COPY.errors.imageTooLarge} (Máximo ${maxMb} MB)` };
  }

  return { valid: true };
}

/**
 * Carga la imagen para comprobar que cumple con la resolución mínima (lado corto >= 224 px).
 * @param {File} file
 * @returns {Promise<{ width: number, height: number }>}
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      const shortSide = Math.min(width, height);
      if (shortSide < 224) {
        reject(new Error(COPY.errors.imageInvalidResolution));
      } else {
        resolve({ width, height });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar la imagen. Asegúrate de que el archivo no esté dañado.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Reduce imágenes de gran tamaño a un máximo de 1600 px por su lado largo mediante Canvas antes del envío.
 * @param {File} file
 * @param {number} [maxDimension=1600]
 * @param {number} [quality=0.9]
 * @returns {Promise<File|Blob>}
 */
export async function resizeImageIfNeeded(file, maxDimension = 1600, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      URL.revokeObjectURL(objectUrl);

      const maxSide = Math.max(width, height);
      // Si la imagen ya es menor o igual al límite, se envía el archivo original
      if (maxSide <= maxDimension) {
        resolve(file);
        return;
      }

      const ratio = maxDimension / maxSide;
      const targetWidth = Math.round(width * ratio);
      const targetHeight = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file); // Fallback al archivo original si no hay contexto 2d
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Error al procesar la imagen en el lienzo.'));
    };

    img.src = objectUrl;
  });
}
