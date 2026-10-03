import { useState, useRef, useCallback } from 'react';
import { diagnosisApi } from '../api/diagnosisApi.js';
import { mapDiagnosisResponse } from '../mappers/diagnosisMapper.js';
import { resizeImageIfNeeded } from '../lib/imageProcessor.js';

/**
 * Hook para enviar imágenes a diagnóstico fitopatológico con soporte para cancelación.
 */
export function useCreateDiagnosis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const diagnose = useCallback(
    async ({ imageFile, plotName, cropHint, notes }) => {
      setIsLoading(true);
      setError(null);

      // Cancelar petición previa si estuviera en curso
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Reducir la imagen si supera 1600 px en el lado largo
        const processedImage = await resizeImageIfNeeded(imageFile, 1600, 0.9);

        const formData = new FormData();
        formData.append('image', processedImage);

        if (plotName?.trim()) {
          formData.append('plotName', plotName.trim());
        }
        if (cropHint?.trim()) {
          formData.append('cropHint', cropHint.trim());
        }
        if (notes?.trim()) {
          formData.append('notes', notes.trim());
        }

        const rawResponse = await diagnosisApi.createDiagnosis(formData, controller.signal);
        const mappedDiagnosis = mapDiagnosisResponse(rawResponse);

        setIsLoading(false);
        abortControllerRef.current = null;
        return mappedDiagnosis;
      } catch (err) {
        if (controller.signal.aborted) {
          setIsLoading(false);
          return null; // Operación cancelada por el usuario
        }
        setIsLoading(false);
        setError(err);
        abortControllerRef.current = null;
        throw err;
      }
    },
    []
  );

  return {
    diagnose,
    cancel,
    isLoading,
    error,
  };
}
