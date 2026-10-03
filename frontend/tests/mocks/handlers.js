import { http, HttpResponse } from 'msw';

const API_BASE = '/api/v1';

/** Fixtures reutilizables en pruebas */
export const fixtures = {
  healthUp: {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'agroguard-backend',
    version: '1.0.0',
    checks: { database: 'connected', inferenceEngine: 'mock (ready)', storage: 'ready' },
  },
  modelInfo: {
    name: 'AgroGuard_MockModel',
    version: '1.0.0',
    inputSize: 224,
    classCount: 38,
    dataset: 'New Plant Diseases Dataset (Augmented)',
    metrics: null,
    evaluationNote: 'Métricas pendientes de verificación con una evaluación reproducible',
  },
  crops: [
    { cropKey: 'Tomato', cropName: 'Tomate', conditionsCount: 10 },
    { cropKey: 'Apple', cropName: 'Manzana', conditionsCount: 4 },
    { cropKey: 'Corn_(maize)', cropName: 'Maíz', conditionsCount: 4 },
  ],
  user: {
    id: 'user-123',
    email: 'test@agroguard.dev',
    fullName: 'Agricultor de Prueba',
    role: 'FARMER',
    createdAt: new Date().toISOString(),
  },
  authResponse: {
    accessToken: 'mock-access-token-xyz',
    user: {
      id: 'user-123',
      email: 'test@agroguard.dev',
      fullName: 'Agricultor de Prueba',
      role: 'FARMER',
      createdAt: new Date().toISOString(),
    },
  },
};

export const handlers = [
  // Sistema / Salud
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json(fixtures.healthUp);
  }),

  // Información del Modelo
  http.get(`${API_BASE}/model/info`, () => {
    return HttpResponse.json(fixtures.modelInfo);
  }),

  // Catálogo de Cultivos
  http.get(`${API_BASE}/catalog/crops`, () => {
    return HttpResponse.json(fixtures.crops);
  }),

  // Catálogo de Condiciones
  http.get(`${API_BASE}/catalog/conditions`, () => {
    return HttpResponse.json([]);
  }),

  // Auth: refresh silencioso (devuelve 401 por defecto — sin sesión)
  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({ code: 'TOKEN_INVALID', detail: 'No hay sesión activa' }, { status: 401 });
  }),

  // Auth: logout
  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
