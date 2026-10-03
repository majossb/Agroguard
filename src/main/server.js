import { createContainer } from './container.js';
import { createApp } from '../presentation/http/app.js';
import { connectMongo, disconnectMongo } from '../infrastructure/persistence/mongo/connection.js';

async function bootstrap() {
  const container = createContainer();
  const { config, logger } = container;

  // Conectar a MongoDB antes de iniciar el servidor
  await connectMongo(config.MONGO_URI, logger);

  const app = createApp(container);

  const server = app.listen(config.PORT, () => {
    logger.info(
      {
        port: config.PORT,
        env: config.NODE_ENV,
        inferenceDriver: config.INFERENCE_DRIVER,
      },
      `Servidor AgroGuard Backend iniciado exitosamente en el puerto ${config.PORT}`
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Cierre ordenado solicitado (Graceful Shutdown)...');

    await disconnectMongo();

    server.close(() => {
      logger.info('Servidor HTTP cerrado.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('No se pudo cerrar ordenadamente a tiempo. Forzando salida.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Error fatal al iniciar la aplicación:', error);
  process.exit(1);
});