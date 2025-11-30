/**
 * Constantes de Status e Etapas - PROFISSIONAL
 * Sistema sincronizado com 4 etapas padrão
 * Arquivo centralizado para manter sincronização entre frontend e backend
 */

const STATUS_ETAPAS = {
  CRIADA: {
    status: 'CRIADA',
    titulo: 'Denúncia Registrada',
    descricao: 'Aguardando análise inicial pela autoridade',
    etapa: 1,
    cor: '#3498db',
    podeAvancar: true
  },
  EM_ANALISE: {
    status: 'EM_ANALISE',
    titulo: 'Em Análise',
    descricao: 'Autoridade está avaliando a denúncia',
    etapa: 2,
    cor: '#f1c40f',
    podeAvancar: true
  },
  EM_INVESTIGACAO: {
    status: 'EM_INVESTIGACAO',
    titulo: 'Em Investigação',
    descricao: 'Equipe está trabalhando no caso',
    etapa: 3,
    cor: '#e67e22',
    podeAvancar: true
  },
  AGUARDANDO_INSPECAO: {
    status: 'AGUARDANDO_INSPECAO',
    titulo: 'Aguardando Inspeção',
    descricao: 'Equipe designada para verificação local',
    etapa: 4,
    cor: '#9b59b6',
    podeAvancar: false  // Esta é a última etapa
  }
};

// Mapa de transições válidas (4 ETAPAS APENAS)
const TRANSICOES_VALIDAS = {
  'CRIADA': { proximoStatus: 'EM_ANALISE', proximaEtapa: 2 },
  'EM_ANALISE': { proximoStatus: 'EM_INVESTIGACAO', proximaEtapa: 3 },
  'EM_INVESTIGACAO': { proximoStatus: 'AGUARDANDO_INSPECAO', proximaEtapa: 4 }
  // AGUARDANDO_INSPECAO é a última etapa - sem transição
};

// Função auxiliar para obter informações de status
function getStatusInfo(status) {
  const statusNormalizado = (status || '').toUpperCase();
  return STATUS_ETAPAS[statusNormalizado] || {
    status: status,
    titulo: 'Status Desconhecido',
    descricao: 'Status não reconhecido',
    etapa: 0,
    cor: '#95a5a6',
    podeAvancar: false
  };
}

// Função para verificar se pode avançar etapa
function podeAvancarEtapa(status) {
  const statusNormalizado = (status || '').toUpperCase();
  return Object.keys(TRANSICOES_VALIDAS).includes(statusNormalizado);
}

// Função para obter próximo status
function obterProximoStatus(statusAtual) {
  const statusNormalizado = (statusAtual || '').toUpperCase();
  return TRANSICOES_VALIDAS[statusNormalizado];
}
