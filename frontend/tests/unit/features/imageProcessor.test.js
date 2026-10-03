import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../../../src/features/diagnosis/lib/imageProcessor.js';

describe('Features/Diagnosis — imageProcessor (Validación en Cliente)', () => {
  it('Acepta archivos JPEG válidos dentro del límite de tamaño', () => {
    const file = new File(['valid-bytes'], 'leaf.jpg', { type: 'image/jpeg' });
    const res = validateImageFile(file, 8);
    expect(res.valid).toBe(true);
  });

  it('Acepta archivos PNG y WebP', () => {
    const png = new File(['png-bytes'], 'leaf.png', { type: 'image/png' });
    expect(validateImageFile(png, 8).valid).toBe(true);

    const webp = new File(['webp-bytes'], 'leaf.webp', { type: 'image/webp' });
    expect(validateImageFile(webp, 8).valid).toBe(true);
  });

  it('Rechaza formatos no permitidos (ej. PDF, TXT, GIF)', () => {
    const pdf = new File(['pdf-bytes'], 'doc.pdf', { type: 'application/pdf' });
    const res = validateImageFile(pdf, 8);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('formato de la imagen no es compatible');
  });

  it('Rechaza archivos que superen el límite máximo en MB', () => {
    // 9 MB
    const largeFile = new File([new Uint8Array(9 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    const res = validateImageFile(largeFile, 8);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('supera el tamaño máximo');
  });
});
