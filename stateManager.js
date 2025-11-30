/**
 * stateManager.js
 * 
 * Gerenciador robusto de estado das denúncias
 * Centraliza a lógica de sincronização entre etapa e status
 * 
 * IMPORTANTE: Este módulo é utilizado tanto no frontend quanto no backend
 * para garantir consistência de estado.
 */

/**
 * Mapeamento definitivo entre ETAPA e STATUS
 * 
 * Etapa 1 (CRIADA) - Denúncia registrada, aguardando análise
 * Etapa 2 (EM_ANALISE) - Autoridade aceitou e está analisando
 * Etapa 3 (EM_INVESTIGACAO) - Autoridade iniciou investigação
 * Etapa 4 (AGUARDANDO_INSPECAO) - Equipe designada para inspeção
 * Etapa 5 (RESOLVIDA) - Problema foi resolvido
 * Etapa 6 (CONCLUIDA) - Denúncia finalizada e arquivo fechado
 */
const ETAPA_STATUS_MAP = {
  1: 'CRIADA',
  2: 'EM_ANALISE',
  3: 'EM_INVESTIGACAO',
  4: 'AGUARDANDO_INSPECAO',
  5: 'RESOLVIDA',
  6: 'CONCLUIDA'
};

const STATUS_ETAPA_MAP = {
  'CRIADA': 1,
  'EM_ANALISE': 2,
  'EM_INVESTIGACAO': 3,
  'AGUARDANDO_INSPECAO': 4,
  'RESOLVIDA': 5,
  'CONCLUIDA': 6,
  // Manter compatibilidade com versões antigas
  'em_analise': 2,
  'em_investigacao': 3,
  'concluida': 6
};

const VALID_STATUSES = ['CRIADA', 'EM_ANALISE', 'EM_INVESTIGACAO', 'AGUARDANDO_INSPECAO', 'RESOLVIDA', 'CONCLUIDA'];
const VALID_ETAPAS = [1, 2, 3, 4, 5, 6];

/**
 * Normaliza o status para o formato correto (maiúsculo)
 * @param {string} status - Status a normalizar
 * @returns {string} Status normalizado
 */
function normalizeStatus(status) {
  if (!status) return 'CRIADA';
  const normalized = status.toUpperCase();
  return VALID_STATUSES.includes(normalized) ? normalized : 'CRIADA';
}

/**
 * Normaliza a etapa para um número válido
 * @param {number|string} etapa - Etapa a normalizar
 * @returns {number} Etapa normalizada (1-6)
 */
function normalizeEtapa(etapa) {
  const num = parseInt(etapa) || 1;
  return Math.max(1, Math.min(6, num));
}

/**
 * Obtém o status correto para uma determinada etapa
 * @param {number} etapa - Etapa da denúncia
 * @returns {string} Status correto
 */
function getStatusForEtapa(etapa) {
  const normalized = normalizeEtapa(etapa);
  return ETAPA_STATUS_MAP[normalized] || 'CRIADA';
}

/**
 * Obtém a etapa correta para um determinado status
 * @param {string} status - Status da denúncia
 * @returns {number} Etapa correta
 */
function getEtapaForStatus(status) {
  const normalized = normalizeStatus(status);
  return STATUS_ETAPA_MAP[normalized] || 1;
}

/**
 * Sincroniza etapa e status, garantindo consistência
 * Prioriza a etapa sobre o status (a etapa é a fonte de verdade)
 * 
 * @param {Object} report - Objeto denúncia
 * @returns {Object} Denúncia com etapa e status sincronizados
 */
function syncReportState(report) {
  if (!report) return null;

  // Normalizar etapa (tem prioridade)
  report.etapa = normalizeEtapa(report.etapa);
  
  // Sincronizar status baseado na etapa
  report.status = getStatusForEtapa(report.etapa);
  
  // Validações adicionais
  if (!report.createdAt) report.createdAt = new Date().toISOString();
  if (!report.updatedAt) report.updatedAt = new Date().toISOString();
  
  // Se chegou à etapa 6 e não tem concludedAt, adicionar
  if (report.etapa === 6 && !report.concludedAt) {
    report.concludedAt = new Date().toISOString();
  }

  return report;
}

/**
 * Valida se uma transição de etapa é permitida
 * @param {number} etapaAtual - Etapa atual
 * @param {number} proximaEtapa - Próxima etapa desejada
 * @returns {Object} { valid: boolean, erro?: string }
 */
function validateEtapaTransition(etapaAtual, proximaEtapa) {
  const current = normalizeEtapa(etapaAtual);
  const next = normalizeEtapa(proximaEtapa);

  // Só pode avançar uma etapa por vez
  if (next !== current + 1) {
    return {
      valid: false,
      erro: `Não é permitido pular etapas. Esperado ${current + 1}, recebido ${next}`
    };
  }

  // Não pode passar da etapa 6
  if (next > 6) {
    return {
      valid: false,
      erro: 'Denúncia já atingiu a etapa final (6 - Concluída)'
    };
  }

  return { valid: true };
}

/**
 * Obtém informações legíveis sobre uma etapa
 * @param {number} etapa - Número da etapa
 * @returns {Object} Informações sobre a etapa
 */
function getEtapaInfo(etapa) {
  const infoMap = {
    1: {
      numero: 1,
      status: 'CRIADA',
      titulo: 'Denúncia Registrada',
      descricao: 'Aguardando análise inicial pela autoridade',
      cor: '#3498db'
    },
    2: {
      numero: 2,
      status: 'EM_ANALISE',
      titulo: 'Em Análise',
      descricao: 'Autoridade está avaliando a denúncia',
      cor: '#f1c40f'
    },
    3: {
      numero: 3,
      status: 'EM_INVESTIGACAO',
      titulo: 'Em Investigação',
      descricao: 'Equipe está trabalhando no caso',
      cor: '#e67e22'
    },
    4: {
      numero: 4,
      status: 'AGUARDANDO_INSPECAO',
      titulo: 'Aguardando Inspeção',
      descricao: 'Equipe designada para verificação local',
      cor: '#9b59b6'
    },
    5: {
      numero: 5,
      status: 'RESOLVIDA',
      titulo: 'Resolvida',
      descricao: 'Problema foi resolvido',
      cor: '#27ae60'
    },
    6: {
      numero: 6,
      status: 'CONCLUIDA',
      titulo: 'Concluída',
      descricao: 'Denúncia finalizada e arquivo fechado',
      cor: '#16a085'
    }
  };

  const normalized = normalizeEtapa(etapa);
  return infoMap[normalized] || infoMap[1];
}

/**
 * Valida se um objeto denúncia está em estado consistente
 * @param {Object} report - Denúncia a validar
 * @returns {Object} { valido: boolean, erros?: string[] }
 */
function validateReportState(report) {
  if (!report) {
    return { valido: false, erros: ['Denúncia não pode ser nula'] };
  }

  const erros = [];

  // Validar etapa
  if (!VALID_ETAPAS.includes(report.etapa)) {
    erros.push(`Etapa inválida: ${report.etapa}`);
  }

  // Validar status
  if (!VALID_STATUSES.includes(report.status)) {
    erros.push(`Status inválido: ${report.status}`);
  }

  // Validar sincronização entre etapa e status
  const statusEsperado = getStatusForEtapa(report.etapa);
  if (report.status !== statusEsperado) {
    erros.push(`Status não sincronizado. Etapa: ${report.etapa}, Status: ${report.status}, Esperado: ${statusEsperado}`);
  }

  // Validar campos obrigatórios
  if (!report.id) erros.push('ID da denúncia faltando');
  if (!report.protocolo) erros.push('Protocolo faltando');
  if (!report.endereco || !report.endereco.trim()) erros.push('Endereço faltando');
  if (!report.bairro || !report.bairro.trim()) erros.push('Bairro faltando');
  if (!report.tipo || !report.tipo.trim()) erros.push('Tipo faltando');
  if (!report.createdBy) erros.push('Criador da denúncia faltando');

  // Se etapa 6 e não tem concludedAt
  if (report.etapa === 6 && !report.concludedAt) {
    erros.push('Denúncia na etapa 6 deve ter concludedAt');
  }

  return {
    valido: erros.length === 0,
    erros: erros.length > 0 ? erros : undefined
  };
}

/**
 * Retorna informações sobre o progresso de uma denúncia
 * @param {Object} report - Denúncia
 * @returns {Object} Informações de progresso
 */
function getProgressInfo(report) {
  const etapaInfo = getEtapaInfo(report.etapa);
  return {
    etapa: report.etapa,
    etapaTotal: 6,
    percentual: (report.etapa / 6) * 100,
    status: report.status,
    titulo: etapaInfo.titulo,
    descricao: etapaInfo.descricao,
    cor: etapaInfo.cor,
    concluida: report.etapa === 6,
    emAndamento: report.etapa >= 1 && report.etapa < 6,
    proximaEtapa: report.etapa < 6 ? report.etapa + 1 : null
  };
}

// Exportar para Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ETAPA_STATUS_MAP,
    STATUS_ETAPA_MAP,
    VALID_STATUSES,
    VALID_ETAPAS,
    normalizeStatus,
    normalizeEtapa,
    getStatusForEtapa,
    getEtapaForStatus,
    syncReportState,
    validateEtapaTransition,
    getEtapaInfo,
    validateReportState,
    getProgressInfo
  };
}

// Exportar para Browser (client-side)
if (typeof window !== 'undefined') {
  window.stateManager = {
    ETAPA_STATUS_MAP,
    STATUS_ETAPA_MAP,
    VALID_STATUSES,
    VALID_ETAPAS,
    normalizeStatus,
    normalizeEtapa,
    getStatusForEtapa,
    getEtapaForStatus,
    syncReportState,
    validateEtapaTransition,
    getEtapaInfo,
    validateReportState,
    getProgressInfo
  };
}
