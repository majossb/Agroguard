import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server.js';

// Inicializar el servidor MSW antes de todas las pruebas
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Limpiar handlers entre pruebas
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Cerrar servidor MSW después de todas las pruebas
afterAll(() => server.close());

// Silenciar errores de consola durante pruebas
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
