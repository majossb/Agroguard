import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { createApp } from '../../src/presentation/http/app.js';
import { createContainer } from '../../src/main/container.js';
import { UserModel } from '../../src/infrastructure/persistence/mongo/schemas/UserSchema.js';
import { RefreshTokenModel } from '../../src/infrastructure/persistence/mongo/schemas/RefreshTokenSchema.js';

describe('E2E — Authentication, Sessions and Protected Endpoints', () => {
  let mongoServer;
  let container;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    container = createContainer();
    app = createApp(container);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await RefreshTokenModel.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('Debe registrar un nuevo usuario y responder 201 con accessToken y cookie httpOnly', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'nuevo.agricultor@agroguard.dev',
          password: 'passwordSeguro123!',
          fullName: 'María Agricultora',
        });

      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toMatchObject({
        email: 'nuevo.agricultor@agroguard.dev',
        fullName: 'María Agricultora',
        role: 'FARMER',
      });
      expect(response.body.user.passwordHash).toBeUndefined();

      // Verificar cookie de Refresh Token
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/api/v1/auth');
    });

    it('Debe responder 400 si la contraseña tiene menos de 8 caracteres', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'corto@agroguard.dev',
          password: '123',
          fullName: 'Usuario Corto',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('Debe responder 409 con EMAIL_ALREADY_EXISTS si el correo ya está registrado', async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'duplicado@agroguard.dev',
        password: 'password123',
        fullName: 'Original',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'DUPLICADO@agroguard.dev',
          password: 'password456',
          fullName: 'Duplicado',
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login & GET /api/v1/users/me', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'login.test@agroguard.dev',
        password: 'passwordValido123',
        fullName: 'Usuario Login Test',
      });
    });

    it('Debe iniciar sesión y permitir consultar /users/me con Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login.test@agroguard.dev',
          password: 'passwordValido123',
        });

      expect(loginRes.status).toBe(200);
      const { accessToken } = loginRes.body;
      expect(accessToken).toBeDefined();

      // Consultar /users/me con token
      const meRes = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe('login.test@agroguard.dev');
      expect(meRes.body.fullName).toBe('Usuario Login Test');
      expect(meRes.body.role).toBe('FARMER');
    });

    it('Debe responder 401 con INVALID_CREDENTIALS si la contraseña es incorrecta', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login.test@agroguard.dev',
          password: 'passwordErronea',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('Debe responder 401 al acceder a /users/me sin token o con token inválido', async () => {
      const noTokenRes = await request(app).get('/api/v1/users/me');
      expect(noTokenRes.status).toBe(401);
      expect(noTokenRes.body.code).toBe('TOKEN_REQUIRED');

      const badTokenRes = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer token_invalido_totalmente');
      expect(badTokenRes.status).toBe(401);
      expect(badTokenRes.body.code).toBe('TOKEN_INVALID');
    });
  });

  describe('Token Rotation & Session Refresh (/auth/refresh y /auth/logout)', () => {
    it('Debe rotar el token de actualización correctamente y detectar reusos', async () => {
      // 1. Registro
      const regRes = await request(app).post('/api/v1/auth/register').send({
        email: 'rotar@agroguard.dev',
        password: 'passwordSeguro123',
        fullName: 'Usuario Rotar',
      });

      const initialCookie = regRes.headers['set-cookie'];

      // 2. Primera rotación (Válida)
      const refreshRes1 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', initialCookie);

      expect(refreshRes1.status).toBe(200);
      expect(refreshRes1.body.accessToken).toBeDefined();

      const rotatedCookie = refreshRes1.headers['set-cookie'];
      expect(rotatedCookie).toBeDefined();

      // 3. Intento de reusar el token anterior (Ataque de Reutilización)
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', initialCookie);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.code).toBe('TOKEN_REUSED');

      // 4. Tras la detección de reuso, el nuevo token también debió ser revocado
      const blockedRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', rotatedCookie);

      expect(blockedRes.status).toBe(401);
    });

    it('Debe cerrar sesión y revocar el token con /auth/logout', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send({
        email: 'cerrar@agroguard.dev',
        password: 'passwordSeguro123',
        fullName: 'Usuario Cerrar',
      });

      const cookie = regRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);

      // Intentar refrescar tras logout debe fallar
      const refreshAfterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie);

      expect(refreshAfterLogout.status).toBe(401);
    });
  });

  describe('Optional Authenticate en POST /api/v1/diagnoses', () => {
    it('Sin header Authorization debe procesar como anónimo 200 sin persistencia', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 50, g: 150, b: 50 },
        },
      })
        .jpeg()
        .toBuffer();

      const response = await request(app)
        .post('/api/v1/diagnoses')
        .attach('image', imageBuffer, 'hoja.jpg');

      expect(response.status).toBe(200);
      expect(response.body.persisted).toBe(false);
    });

    it('Con header Authorization inválido o corrupto DEBE fallar 401 y NUNCA degradar en silencio a anónimo', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 50, g: 150, b: 50 },
        },
      })
        .jpeg()
        .toBuffer();

      const response = await request(app)
        .post('/api/v1/diagnoses')
        .set('Authorization', 'Bearer token_corrupto_invalido')
        .attach('image', imageBuffer, 'hoja.jpg');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_INVALID');
    });
  });

  describe('DELETE /api/v1/users/me (Cascading Account Deletion)', () => {
    it('Debe eliminar la cuenta del usuario y revocar su acceso', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send({
        email: 'eliminar.cuenta@agroguard.dev',
        password: 'passwordSeguro123!',
        fullName: 'Usuario Para Eliminar',
      });

      const { accessToken } = regRes.body;

      const deleteRes = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(204);

      // El token o usuario ya no debe poder consultar /users/me
      const meAfterDelete = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meAfterDelete.status).toBe(404);
    });
  });
});

