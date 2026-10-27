/**
 * Textos centralizados de la interfaz de usuario en español (lenguaje simple, cercano y de campo).
 */
export const COPY = Object.freeze({
  app: {
    name: 'AgroGuard',
    tagline: 'Diagnóstico fitopatológico asistido por visión artificial',
    footerCredits: 'Dataset de referencia: New Plant Diseases Dataset (PlantVillage). Proyecto de ingeniería de software.',
  },
  nav: {
    home: 'Inicio',
    scan: 'Escanear hoja',
    history: 'Mis diagnósticos',
    catalog: 'Catálogo',
    login: 'Ingresar',
    account: 'Mi cuenta',
    logout: 'Cerrar sesión',
  },
  health: {
    healthy: 'Sana',
    diseased: 'Enferma',
    inconclusive: 'No concluyente',
  },
  errors: {
    generic: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    network: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    inferenceUnavailable: 'El servicio de análisis no está disponible ahora, intenta en unos minutos.',
    tooManyRequests: 'Has realizado muchas solicitudes recientemente. Por favor, espera un momento.',
    imageTooLarge: 'La imagen supera el tamaño máximo permitido. Intenta con una foto más liviana o menor resolución.',
    imageInvalidType: 'El formato de la imagen no es compatible. Usa JPEG, PNG o WebP.',
    imageInvalidResolution: 'La imagen es muy pequeña para ser analizada con claridad. Debe tener al menos 224 píxeles.',
    sessionExpired: 'Tu sesión ha expirado. Por favor, ingresa nuevamente.',
    unauthorized: 'Debes iniciar sesión para realizar esta acción.',
    notFound: 'La información solicitada no existe o fue eliminada.',
    conflict: 'Ya existe un registro con esta información.',
    imageRejected: 'La fotografía no parece ser una hoja de planta. Asegúrate de que la imagen muestre claramente una hoja o tejido vegetal.',
    imageReviewRequired: 'No pudimos determinar con certeza si la imagen es una hoja de planta. Intenta con una foto más nítida, con la hoja centrada y sobre un fondo neutro.',
  },
  warnings: {
    LOW_CONFIDENCE: 'El sistema tiene dudas sobre este resultado. Te sugerimos tomar otra foto más nítida.',
    CROP_MISMATCH: 'El cultivo indicado no coincide con lo observado en la fotografía.',
    LOW_RESOLUTION: 'La resolución de la imagen es baja, lo que puede reducir la certeza del análisis.',
  },
  disclaimers: {
    pendingReview: 'Contenido y recomendaciones pendientes de validación por un ingeniero agrónomo.',
    mockWarning: 'Modo demostración: Este resultado es simulado y no corresponde a un análisis real.',
    anonymousNote: 'Tus diagnósticos se guardan en tu historial solo si inicias sesión.',
    agronomicAdvice: 'Este resultado es orientativo. Ante dudas o tratamientos químicos, consulta a un profesional del agro.',
  },
});
