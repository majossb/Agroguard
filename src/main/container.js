import mongoose from 'mongoose';
import { config } from '../infrastructure/config/env.js';
import { logger } from '../infrastructure/logging/logger.js';
import { loadClassNames } from '../infrastructure/config/classNamesLoader.js';
import { SystemClock } from '../infrastructure/system/SystemClock.js';
import { UuidGenerator } from '../infrastructure/system/UuidGenerator.js';
import path from 'path';
import { SharpImageProcessor } from '../infrastructure/image/SharpImageProcessor.js';
import { PythonEnsembleInferenceEngine } from '../infrastructure/inference/PythonEnsembleInferenceEngine.js';
import { MockInferenceEngine } from '../infrastructure/inference/MockInferenceEngine.js';
import { HttpInferenceEngine } from '../infrastructure/inference/HttpInferenceEngine.js';
import { LocalDiskImageStorage } from '../infrastructure/storage/LocalDiskImageStorage.js';
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher.js';
import { JwtTokenService } from '../infrastructure/security/JwtTokenService.js';

// Repositorios MongoDB
import { MongoUserRepository } from '../infrastructure/persistence/mongo/repositories/MongoUserRepository.js';
import { MongoRefreshTokenRepository } from '../infrastructure/persistence/mongo/repositories/MongoRefreshTokenRepository.js';
import { MongoDiagnosisRepository } from '../infrastructure/persistence/mongo/repositories/MongoDiagnosisRepository.js';
import { MongoFeedbackRepository } from '../infrastructure/persistence/mongo/repositories/MongoFeedbackRepository.js';
import { MongoConditionCatalogRepository } from '../infrastructure/persistence/mongo/repositories/MongoConditionCatalogRepository.js';

// Casos de Uso
import { CreateDiagnosis } from '../application/use-cases/diagnosis/CreateDiagnosis.js';
import { ListDiagnoses } from '../application/use-cases/diagnosis/ListDiagnoses.js';
import { GetDiagnosis } from '../application/use-cases/diagnosis/GetDiagnosis.js';
import { UpdateDiagnosisNotes } from '../application/use-cases/diagnosis/UpdateDiagnosisNotes.js';
import { DeleteDiagnosis } from '../application/use-cases/diagnosis/DeleteDiagnosis.js';
import { GetDiagnosisImage } from '../application/use-cases/diagnosis/GetDiagnosisImage.js';
import { SubmitDiagnosisFeedback } from '../application/use-cases/diagnosis/SubmitDiagnosisFeedback.js';

import { RegisterUser } from '../application/use-cases/auth/RegisterUser.js';
import { LoginUser } from '../application/use-cases/auth/LoginUser.js';
import { RefreshSession } from '../application/use-cases/auth/RefreshSession.js';
import { LogoutUser } from '../application/use-cases/auth/LogoutUser.js';
import { GetCurrentUser } from '../application/use-cases/auth/GetCurrentUser.js';
import { DeleteAccount } from '../application/use-cases/auth/DeleteAccount.js';

import { ListConditions } from '../application/use-cases/catalog/ListConditions.js';
import { GetCondition } from '../application/use-cases/catalog/GetCondition.js';
import { ListCrops } from '../application/use-cases/catalog/ListCrops.js';
import { GetModelInfo } from '../application/use-cases/model/GetModelInfo.js';

// Presentación
import { HealthController } from '../presentation/http/controllers/HealthController.js';
import { DiagnosisController } from '../presentation/http/controllers/DiagnosisController.js';
import { AuthController } from '../presentation/http/controllers/AuthController.js';
import { CatalogController } from '../presentation/http/controllers/CatalogController.js';
import { ModelController } from '../presentation/http/controllers/ModelController.js';
import { createAuthMiddlewares } from '../presentation/http/middlewares/authMiddleware.js';

/**
 * Composition Root para instanciar e inyectar todas las dependencias del sistema.
 * @param {object} [overrides={}]
 */
export function createContainer(overrides = {}) {
  // Carga y validación de clases fitopatológicas
  const validClassKeys =
    overrides.validClassKeys || loadClassNames(undefined, config.EXPECTED_NUM_CLASSES);

  // Infraestructura
  const clock = overrides.clock || new SystemClock();
  const idGenerator = overrides.idGenerator || new UuidGenerator();
  const passwordHasher = overrides.passwordHasher || new BcryptPasswordHasher();
  const tokenService =
    overrides.tokenService ||
    new JwtTokenService({
      accessSecret: config.JWT_ACCESS_SECRET,
      accessTtl: config.JWT_ACCESS_TTL,
    });

  const imageProcessor =
    overrides.imageProcessor ||
    new SharpImageProcessor({
      maxUploadMb: config.MAX_UPLOAD_MB,
      maxInputPixels: config.MAX_INPUT_PIXELS,
    });

  const imageStorage =
    overrides.imageStorage ||
    new LocalDiskImageStorage({
      baseDir: config.STORAGE_DIR,
    });

  let inferenceEngine = overrides.inferenceEngine;
  if (!inferenceEngine) {
    if (config.INFERENCE_DRIVER === 'ensemble') {
      inferenceEngine = new PythonEnsembleInferenceEngine({
        pythonBin: config.PYTHON_BIN,
        scriptPath: path.resolve('scripts/inference_ensemble.py'),
        modelDir: path.resolve(config.MODEL_ROOT),
        classNames: validClassKeys,
        logger,
        timeoutMs: config.INFERENCE_TIMEOUT_MS,
      });
    } else if (config.INFERENCE_DRIVER === 'http') {
      inferenceEngine = new HttpInferenceEngine({
        url: config.INFERENCE_URL,
        timeoutMs: config.INFERENCE_TIMEOUT_MS,
        retries: config.INFERENCE_RETRIES,
        apiKey: config.INFERENCE_API_KEY,
        logger,
      });
    } else {
      inferenceEngine = new MockInferenceEngine({
        classNames: validClassKeys,
        logger,
        forceClass: config.MOCK_FORCE_CLASS,
      });
    }
  }

  // Repositorios
  const userRepository = overrides.userRepository || new MongoUserRepository();
  const refreshTokenRepository =
    overrides.refreshTokenRepository || new MongoRefreshTokenRepository();
  const diagnosisRepository =
    overrides.diagnosisRepository || new MongoDiagnosisRepository();
  const feedbackRepository =
    overrides.feedbackRepository || new MongoFeedbackRepository();
  const conditionCatalogRepository =
    overrides.conditionCatalogRepository || new MongoConditionCatalogRepository();

  // Casos de Uso de Auth
  const registerUser = new RegisterUser({
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    idGenerator,
    clock,
    refreshTtlDays: config.REFRESH_TTL_DAYS,
  });

  const loginUser = new LoginUser({
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    idGenerator,
    clock,
    refreshTtlDays: config.REFRESH_TTL_DAYS,
  });

  const refreshSession = new RefreshSession({
    userRepository,
    refreshTokenRepository,
    tokenService,
    clock,
    refreshTtlDays: config.REFRESH_TTL_DAYS,
  });

  const logoutUser = new LogoutUser({
    refreshTokenRepository,
    tokenService,
  });

  const getCurrentUser = new GetCurrentUser({
    userRepository,
  });

  const deleteAccount = new DeleteAccount({
    userRepository,
    diagnosisRepository,
    feedbackRepository,
    refreshTokenRepository,
    imageStorage,
  });

  // Casos de Uso de Diagnóstico
  const createDiagnosis = new CreateDiagnosis({
    imageProcessor,
    inferenceEngine,
    diagnosisRepository,
    conditionCatalogRepository,
    imageStorage,
    idGenerator,
    clock,
    validClassKeys,
    minConfidence: config.MIN_CONFIDENCE,
  });

  const listDiagnoses = new ListDiagnoses({
    diagnosisRepository,
  });

  const getDiagnosis = new GetDiagnosis({
    diagnosisRepository,
    conditionCatalogRepository,
  });

  const updateDiagnosisNotes = new UpdateDiagnosisNotes({
    diagnosisRepository,
  });

  const deleteDiagnosis = new DeleteDiagnosis({
    diagnosisRepository,
    imageStorage,
    feedbackRepository,
  });

  const getDiagnosisImage = new GetDiagnosisImage({
    diagnosisRepository,
    imageStorage,
  });

  const submitDiagnosisFeedback = new SubmitDiagnosisFeedback({
    diagnosisRepository,
    feedbackRepository,
    idGenerator,
    clock,
  });

  // Casos de Uso de Catálogo y Modelo
  const listConditions = new ListConditions({
    conditionCatalogRepository,
  });

  const getCondition = new GetCondition({
    conditionCatalogRepository,
  });

  const listCrops = new ListCrops({
    conditionCatalogRepository,
  });

  const getModelInfo = new GetModelInfo({
    inferenceEngine,
  });

  // Middlewares de autenticación
  const { authenticate, optionalAuthenticate } = createAuthMiddlewares({
    tokenService,
  });

  // Controladores
  const healthController = new HealthController({
    clock,
    healthChecker: {
      check: async () => {
        const isDbReady = mongoose.connection.readyState === 1;
        const isEngineReady = await inferenceEngine.isReady();

        const overallStatus = isDbReady && isEngineReady ? 'UP' : isDbReady ? 'DEGRADED' : 'DOWN';

        return {
          status: overallStatus,
          checks: {
            database: isDbReady ? 'connected' : 'disconnected',
            inferenceEngine: `${config.INFERENCE_DRIVER} (${isEngineReady ? 'ready' : 'down'})`,
            storage: 'ready',
          },
        };
      },
    },
  });

  const authController = new AuthController({
    registerUser,
    loginUser,
    refreshSession,
    logoutUser,
    getCurrentUser,
    deleteAccount,
    config,
  });

  const diagnosisController = new DiagnosisController({
    createDiagnosis,
    listDiagnoses,
    getDiagnosis,
    updateDiagnosisNotes,
    deleteDiagnosis,
    getDiagnosisImage,
    submitDiagnosisFeedback,
  });

  const catalogController = new CatalogController({
    listConditions,
    getCondition,
    listCrops,
  });

  const modelController = new ModelController({
    getModelInfo,
  });

  return {
    config,
    logger,
    clock,
    idGenerator,
    validClassKeys,
    passwordHasher,
    tokenService,
    imageProcessor,
    inferenceEngine,
    userRepository,
    refreshTokenRepository,
    diagnosisRepository,
    feedbackRepository,
    conditionCatalogRepository,
    registerUser,
    loginUser,
    refreshSession,
    logoutUser,
    getCurrentUser,
    deleteAccount,
    createDiagnosis,
    listDiagnoses,
    getDiagnosis,
    updateDiagnosisNotes,
    deleteDiagnosis,
    getDiagnosisImage,
    submitDiagnosisFeedback,
    listConditions,
    getCondition,
    listCrops,
    getModelInfo,
    authenticate,
    optionalAuthenticate,
    healthController,
    authController,
    diagnosisController,
    catalogController,
    modelController,
  };
}
