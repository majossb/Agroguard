import mongoose from 'mongoose';
import dns from 'node:dns';

/**
 * Conecta a la base de datos MongoDB usando Mongoose.
 * @param {string} mongoUri
 * @param {object} [logger]
 * @returns {Promise<typeof mongoose>}
 */

dns.setServers(['8.8.8.8', '8.8.4.4']);
export async function connectMongo(mongoUri, logger = null) {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    if (logger) {
      logger.info({ uri: mongoUri.replace(/\/\/.*@/, '//***@') }, 'Conexión a MongoDB establecida exitosamente.');
    }
    return conn;
  } catch (error) {
    if (logger) {
      logger.error({ error: error.message }, 'Fallo al conectar a MongoDB.');
    }
    throw error;
  }
}

/**
 * Cierra la conexión activa con MongoDB.
 * @returns {Promise<void>}
 */
export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
