import { ENV } from '../config/env.js';
import { COPY } from '../config/copy.es.js';
import { tokenStorage } from './tokenStorage.js';

/**
 * Error estandarizado de la API REST según formato RFC 9457 (Problem Details).
 */
export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {number} params.status - Código de estado HTTP
   * @param {string} [params.code] - Código interno de error (ej. VALIDATION_ERROR)
   * @param {string} [params.detail] - Mensaje explicativo en español
   * @param {string} [params.traceId] - Identificador de rastreo único
   * @param {Array<{field?: string, message: string}>} [params.errors] - Lista de errores de validación
   */
  constructor({
    status,
    code = 'UNKNOWN_ERROR',
    detail,
    traceId,
    errors = [],
    clipTopLabels = [],
    validationState = null,
    validationReason = null,
  }) {
    super(detail || COPY.errors.generic);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail || COPY.errors.generic;
    this.traceId = traceId || null;
    this.errors = Array.isArray(errors) ? errors : [];
    this.clipTopLabels = clipTopLabels;
    this.validationState = validationState;
    this.validationReason = validationReason;
  }
}

let refreshPromise = null;
let onTokenExpiredCallback = null;

/**
 * Registra el manejador de refresco de sesión
 * @param {() => Promise<string|null>} refreshFn
 */
export function setRefreshHandler(refreshFn) {
  onTokenExpiredCallback = refreshFn;
}

/**
 * Cliente HTTP base para realizar peticiones a la API de AgroGuard.
 * @param {string} endpoint - Ruta relativa (ej. '/diagnoses' o '/health')
 * @param {RequestInit & { isRetry?: boolean }} [options={}]
 * @returns {Promise<any>}
 */
export async function httpClient(endpoint, options = {}) {
  const baseUrl = ENV.API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  // Adjuntar token de acceso en memoria si existe
  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Si no es FormData, fijar JSON por defecto
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Para cookies HttpOnly de refresh
    });
  } catch (netErr) {
    if (options.signal?.aborted) {
      throw netErr;
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      detail: COPY.errors.network,
    });
  }

  // Si es 401 TOKEN_EXPIRED y tenemos un manejador de refresco, intentar single-flight refresh
  if (
    response.status === 401 &&
    !options.isRetry &&
    token &&
    typeof onTokenExpiredCallback === 'function'
  ) {
    try {
      if (!refreshPromise) {
        refreshPromise = onTokenExpiredCallback().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        // Reintentar la petición original con el nuevo token sin duplicar cabeceras
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);

        return httpClient(endpoint, {
          ...options,
          isRetry: true,
          headers: retryHeaders,
        });
      }
    } catch {
      // Falló el refresco, continuar con el manejo estándar de 401
    }
  }

  // Respuesta 204 No Content
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  // Respuesta binaria (ej. descarga de imagen)
  if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        code: 'IMAGE_FETCH_ERROR',
        detail: 'No se pudo descargar la imagen.',
      });
    }
    return response.blob();
  }

  let data = null;
  if (contentType.includes('json') || contentType.includes('problem+json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let friendlyDetail = data?.detail;

    // Mapeo amigable de errores comunes si no viene detalle
    if (!friendlyDetail) {
      if (response.status === 503 || data?.code === 'INFERENCE_UNAVAILABLE') {
        friendlyDetail = COPY.errors.inferenceUnavailable;
      } else if (response.status === 429 || data?.code === 'TOO_MANY_REQUESTS') {
        friendlyDetail = COPY.errors.tooManyRequests;
      } else if (response.status === 401) {
        friendlyDetail = COPY.errors.unauthorized;
      } else if (response.status === 404) {
        friendlyDetail = COPY.errors.notFound;
      } else {
        friendlyDetail = COPY.errors.generic;
      }
    }

    // Sobrescribir con mensajes amigables para errores de validación CLIP
    if (data?.code === 'IMAGE_REJECTED') {
      friendlyDetail = COPY.errors.imageRejected;
    } else if (data?.code === 'IMAGE_REVIEW_REQUIRED') {
      friendlyDetail = COPY.errors.imageReviewRequired;
    }

    throw new ApiError({
      status: response.status,
      code: data?.code || (response.status === 503 ? 'INFERENCE_UNAVAILABLE' : 'HTTP_ERROR'),
      detail: friendlyDetail,
      traceId: data?.traceId,
      errors: data?.errors || [],
      clipTopLabels: data?.clipTopLabels || [],
      validationState: data?.validationState || null,
      validationReason: data?.validationReason || null,
    });

  }

  return data;
}
