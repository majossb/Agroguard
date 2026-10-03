import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import { LoginPage } from '../../../src/features/auth/pages/LoginPage.jsx';
import { tokenStorage } from '../../../src/shared/api/tokenStorage.js';

describe('Feature Auth — Sesión y Autenticación', () => {
  beforeEach(() => {
    tokenStorage.clearAccessToken();
  });

  it('Inicia sesión exitosamente, muestra toast de bienvenida y guarda el access token en memoria', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/v1/auth/login', async ({ request }) => {
        const body = await request.json();
        if (body.email === 'agricultor@agroguard.dev' && body.password === 'secreto123') {
          return HttpResponse.json({
            accessToken: 'token-jwt-super-seguro',
            user: {
              id: 'user-456',
              email: 'agricultor@agroguard.dev',
              fullName: 'Carlos Gómez',
              role: 'FARMER',
              createdAt: new Date().toISOString(),
            },
          });
        }
        return HttpResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 });
      })
    );

    renderWithProviders(<LoginPage />, { initialRoute: '/ingresar' });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/^Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar al Cuaderno/i });

    await user.type(emailInput, 'agricultor@agroguard.dev');
    await user.type(passwordInput, 'secreto123');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(tokenStorage.getAccessToken()).toBe('token-jwt-super-seguro');
      expect(screen.getByText(/¡Inicio de sesión exitoso!/i)).toBeInTheDocument();
    });

    // Comprobar que NUNCA se guardó en localStorage ni sessionStorage
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.sessionStorage.getItem('token')).toBeNull();
  });

  it('Muestra error amigable cuando las credenciales son incorrectas (401)', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/v1/auth/login', () => {
        return HttpResponse.json(
          {
            status: 401,
            code: 'INVALID_CREDENTIALS',
            detail: 'Credenciales incorrectas.',
          },
          { status: 401 }
        );
      })
    );

    renderWithProviders(<LoginPage />, { initialRoute: '/ingresar' });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/^Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar al Cuaderno/i });

    await user.type(emailInput, 'usuario@incorrecto.com');
    await user.type(passwordInput, 'claveerronea');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Correo o contraseña incorrectos/i)).toBeInTheDocument();
    });

    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('Registro exitoso muestra mensaje visual de confirmación sin ingresar automáticamente y permite ir a login', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/v1/auth/register', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json(
          {
            accessToken: 'token-provisional',
            user: {
              id: 'user-new',
              email: body.email,
              fullName: body.fullName,
              role: 'FARMER',
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 }
        );
      }),
      http.post('/api/v1/auth/logout', () => {
        return HttpResponse.json({ message: 'Sesión cerrada' });
      })
    );

    renderWithProviders(<LoginPage />, { initialRoute: '/ingresar' });

    // Cambiar a la pestaña "Crear cuenta"
    const registerTab = screen.getByRole('button', { name: /Crear cuenta/i });
    await user.click(registerTab);

    const nameInput = screen.getByLabelText(/Nombre Completo/i);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passInput = screen.getByLabelText(/Contraseña \(mínimo 8 caracteres\)/i);
    const confirmInput = screen.getByLabelText(/Confirmar Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Registrar Cuenta/i });

    await user.type(nameInput, 'María José');
    await user.type(emailInput, 'mariajose@agroguard.dev');
    await user.type(passInput, 'Password123!');
    await user.type(confirmInput, 'Password123!');
    await user.click(submitBtn);

    // Debe mostrar la tarjeta de confirmación visual
    const successTitle = await screen.findByText(/¡Cuenta creada exitosamente!/i);
    expect(successTitle).toBeInTheDocument();
    expect(screen.getByText(/mariajose@agroguard.dev/i)).toBeInTheDocument();

    // No debe estar logueado automáticamente
    expect(tokenStorage.getAccessToken()).toBeNull();

    // Al hacer clic en Iniciar sesión en la tarjeta de confirmación, debe llevar al tab de login con el email prellenado
    const loginConfirmBtn = screen.getByRole('button', { name: /Iniciar sesión/i });
    await user.click(loginConfirmBtn);

    expect(screen.getByRole('button', { name: /Ingresar al Cuaderno/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveValue('mariajose@agroguard.dev');
  });

  it('Muestra error de conflicto si el correo ya está registrado al crear cuenta (409)', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/v1/auth/register', () => {
        return HttpResponse.json(
          {
            status: 409,
            code: 'EMAIL_ALREADY_EXISTS',
            detail: 'Ya existe un usuario con este correo.',
          },
          { status: 409 }
        );
      })
    );

    renderWithProviders(<LoginPage />, { initialRoute: '/ingresar' });

    // Cambiar a la pestaña "Crear cuenta"
    const registerTab = screen.getByRole('button', { name: /Crear cuenta/i });
    await user.click(registerTab);

    const nameInput = screen.getByLabelText(/Nombre Completo/i);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passInput = screen.getByLabelText(/Contraseña \(mínimo 8 caracteres\)/i);
    const confirmInput = screen.getByLabelText(/Confirmar Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Registrar Cuenta/i });

    await user.type(nameInput, 'María José');
    await user.type(emailInput, 'existente@agroguard.dev');
    await user.type(passInput, 'password123');
    await user.type(confirmInput, 'password123');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ya existe una cuenta registrada con este correo electrónico/i)).toBeInTheDocument();
    });
  });
});
