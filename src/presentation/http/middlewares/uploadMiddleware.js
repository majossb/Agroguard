import multer from 'multer';
import { InvalidImageError } from '../../../domain/errors/DomainError.js';

/**
 * Crea el middleware de subida de archivos en memoria con Multer.
 * @param {object} [options]
 * @param {number} [options.maxUploadMb=8]
 */
export function createUploadMiddleware({ maxUploadMb = 8 } = {}) {
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: maxUploadMb * 1024 * 1024,
      files: 1,
    },
  });

  const singleUpload = upload.single('image');

  return (req, res, next) => {
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new InvalidImageError(
              `El archivo supera el tamaño máximo permitido de ${maxUploadMb} MB.`,
              'IMAGE_TOO_LARGE'
            )
          );
        }
        return next(new InvalidImageError(`Error al subir archivo: ${err.message}`, 'IMAGE_UPLOAD_ERROR'));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
}
