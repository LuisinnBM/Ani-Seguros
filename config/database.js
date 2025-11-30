const mongoose = require('mongoose');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Configuração de Conexão MongoDB
 * 
 * PADRÕES PROFISSIONAIS IMPLEMENTADOS:
 * - Connection pooling
 * - Retry automático
 * - Timeouts configurados
 * - Error handling robusto
 * - Logging de eventos
 */

const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority'
  }
};

/**
 * Conecta ao MongoDB Atlas
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB() {
  try {
    console.log('[MongoDB] Conectando ao cluster...');
    
    const conn = await mongoose.connect(MONGODB_CONFIG.uri, MONGODB_CONFIG.options);
    
    console.log(`[MongoDB] ✅ Conectado com sucesso!`);
    console.log(`[MongoDB] Host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('[MongoDB] ❌ Erro ao conectar:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('[MongoDB] ❌ ERRO DE AUTENTICAÇÃO - Verifique:');
      console.error('   1. Credenciais corretas em MongoDB Atlas');
      console.error('   2. IP autorizado na whitelist (adicione 0.0.0.0/0 para testes)');
      console.error('   3. Banco de dados "anidb" existe no cluster');
      console.error('\n   URL do MongoDB Atlas: https://cloud.mongodb.com');
    }
    
    // Tentar reconectar após 5 segundos
    console.log('[MongoDB] Tentando reconectar em 5 segundos...');
    setTimeout(() => connectDB(), 5000);
    
    throw error;
  }
}

/**
 * Desconecta do MongoDB
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Desconectado com sucesso');
  } catch (error) {
    console.error('[MongoDB] Erro ao desconectar:', error.message);
    throw error;
  }
}

/**
 * Obtém informações sobre a conexão
 * @returns {Object}
 */
function getConnectionInfo() {
  if (!mongoose.connection) {
    return { connected: false };
  }

  return {
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host,
    db: mongoose.connection.name,
    models: Object.keys(mongoose.connection.models)
  };
}

/**
 * Monitora eventos da conexão
 */
function setupConnectionMonitoring() {
  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Evento: Conectado');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[MongoDB] Evento: Desconectado');
  });

  mongoose.connection.on('error', (error) => {
    console.error('[MongoDB] Evento: Erro -', error.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Evento: Reconectado');
  });
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionInfo,
  setupConnectionMonitoring,
  MONGODB_CONFIG
};
