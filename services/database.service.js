const { User, Report } = require('../models/schemas');
const { v4: uuidv4 } = require('uuid');

/**
 * Database Service Layer
 * 
 * PADRÃO PROFISSIONAL:
 * - Abstração completa das operações de banco de dados
 * - Tratamento centralizado de erros
 * - Validações de negócio
 * - Logging estruturado
 * - Transações quando necessário
 */

class DatabaseService {
  /**
   * ===================== USUÁRIOS =====================
   */

  /**
   * Busca usuário por ID
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>}
   */
  static async getUserById(userId) {
    try {
      const user = await User.findOne({ id: userId });
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      return user;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>}
   */
  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  /**
   * Cria novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>}
   */
  static async createUser(userData) {
    try {
      // Verificar se email já existe
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      const newUser = new User({
        id: uuidv4(),
        email: userData.email.toLowerCase(),
        passwordHash: userData.passwordHash,
        role: userData.role || 'user',
        cpf: userData.cpf,
        phone: userData.phone,
        name: userData.name,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedUser = await newUser.save();
      console.log(`[DB] ✅ Novo usuário criado: ${savedUser.email}`);
      
      return savedUser;
    } catch (error) {
      throw new DatabaseError(`Erro ao criar usuário: ${error.message}`);
    }
  }

  /**
   * Atualiza usuário
   * @param {string} userId - ID do usuário
   * @param {Object} updateData - Dados a atualizar
   * @returns {Promise<Object>}
   */
  static async updateUser(userId, updateData) {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      console.log(`[DB] ✅ Usuário atualizado: ${user.email}`);
      return user;
    } catch (error) {
      throw new DatabaseError(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  /**
   * Lista todos os usuários (apenas para authority/admin)
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>}
   */
  static async getAllUsers(filters = {}) {
    try {
      const query = { ativo: true, ...filters };
      const users = await User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 });
      
      return users;
    } catch (error) {
      throw new DatabaseError(`Erro ao listar usuários: ${error.message}`);
    }
  }

  /**
   * Deleta usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<void>}
   */
  static async deleteUser(userId) {
    try {
      const user = await User.findOneAndDelete({ id: userId });
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      console.log(`[DB] ✅ Usuário deletado: ${user.email}`);
    } catch (error) {
      throw new DatabaseError(`Erro ao deletar usuário: ${error.message}`);
    }
  }

  /**
   * ===================== DENÚNCIAS =====================
   */

  /**
   * Busca denúncia por ID
   * @param {string} reportId - ID da denúncia
   * @returns {Promise<Object>}
   */
  static async getReportById(reportId) {
    try {
      const report = await Report.findOne({ id: reportId });
      if (!report) {
        throw new Error('Denúncia não encontrada');
      }
      return report;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar denúncia: ${error.message}`);
    }
  }

  /**
   * Busca denúncia por protocolo
   * @param {string} protocolo - Protocolo da denúncia
   * @returns {Promise<Object>}
   */
  static async getReportByProtocolo(protocolo) {
    try {
      const report = await Report.findOne({ protocolo });
      return report;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar denúncia por protocolo: ${error.message}`);
    }
  }

  /**
   * Cria nova denúncia
   * @param {Object} reportData - Dados da denúncia
   * @returns {Promise<Object>}
   */
  static async createReport(reportData) {
    try {
      const newReport = new Report({
        id: uuidv4(),
        protocolo: reportData.protocolo,
        endereco: reportData.endereco,
        bairro: reportData.bairro,
        tipo: reportData.tipo,
        especie: reportData.especie,
        condicao: reportData.condicao,
        descricao: reportData.descricao,
        autorNome: reportData.autorNome,
        outrasInfo: reportData.outrasInfo,
        denuncianteNome: reportData.denuncianteNome,
        denuncianteCPF: reportData.denuncianteCPF,
        denuncianteContato: reportData.denuncianteContato,
        arquivos: reportData.arquivos || [],
        status: 'CRIADA',
        etapa: 1,
        prioridade: reportData.prioridade || 'MEDIA',
        createdBy: reportData.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        historico: [
          {
            data: new Date(),
            tipo: 'CRIACAO',
            autor: reportData.createdBy,
            descricao: 'Denúncia registrada no sistema'
          }
        ],
        evidencias: (reportData.arquivos || []).map(arquivo => ({
          arquivo,
          uploadedAt: new Date(),
          uploadedBy: reportData.createdBy
        })),
        comentarios: [],
        acoes: []
      });

      const savedReport = await newReport.save();
      console.log(`[DB] ✅ Nova denúncia criada: ${savedReport.protocolo}`);
      
      return savedReport;
    } catch (error) {
      throw new DatabaseError(`Erro ao criar denúncia: ${error.message}`);
    }
  }

  /**
   * Atualiza denúncia
   * @param {string} reportId - ID da denúncia
   * @param {Object} updateData - Dados a atualizar
   * @returns {Promise<Object>}
   */
  static async updateReport(reportId, updateData) {
    try {
      const report = await Report.findOneAndUpdate(
        { id: reportId },
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      return report;
    } catch (error) {
      throw new DatabaseError(`Erro ao atualizar denúncia: ${error.message}`);
    }
  }

  /**
   * Obtém denúncias do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de paginação e filtro
   * @returns {Promise<Object>} { reports, pagination }
   */
  static async getUserReports(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Construir query
      const query = { createdBy: userId };

      // Filtro por status
      if (status) {
        const statusList = status.split(',');
        query.status = { $in: statusList };
      }

      // Filtro por busca
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { protocolo: searchRegex },
          { endereco: searchRegex },
          { bairro: searchRegex },
          { tipo: searchRegex }
        ];
      }

      // Construir sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Executar queries em paralelo
      const [reports, total] = await Promise.all([
        Report.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        Report.countDocuments(query)
      ]);

      return {
        reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar denúncias do usuário: ${error.message}`);
    }
  }

  /**
   * Obtém todas as denúncias (para authority/admin)
   * @param {Object} options - Opções de paginação e filtro
   * @returns {Promise<Object>} { reports, pagination }
   */
  static async getAllReports(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        tipo = '',
        bairro = '',
        prioridade = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Construir query
      const query = {};

      if (status) {
        query.status = { $in: status.split(',') };
      }

      if (tipo) {
        query.tipo = { $in: tipo.split(',') };
      }

      if (bairro) {
        query.bairro = bairro.toLowerCase();
      }

      if (prioridade) {
        query.prioridade = { $in: prioridade.split(',') };
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { protocolo: searchRegex },
          { endereco: searchRegex },
          { bairro: searchRegex },
          { tipo: searchRegex }
        ];
      }

      // Construir sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Executar queries em paralelo
      const [reports, total] = await Promise.all([
        Report.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        Report.countDocuments(query)
      ]);

      return {
        reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar denúncias: ${error.message}`);
    }
  }

  /**
   * Adiciona comentário à denúncia
   * @param {string} reportId - ID da denúncia
   * @param {Object} commentData - Dados do comentário
   * @returns {Promise<Object>}
   */
  static async addComment(reportId, commentData) {
    try {
      const report = await Report.findOneAndUpdate(
        { id: reportId },
        {
          $push: {
            comentarios: {
              id: uuidv4(),
              texto: commentData.texto,
              autor: commentData.autor,
              autorEmail: commentData.autorEmail,
              data: new Date()
            },
            historico: {
              data: new Date(),
              tipo: 'COMENTARIO',
              autor: commentData.autor,
              descricao: 'Novo comentário adicionado'
            }
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      return report;
    } catch (error) {
      throw new DatabaseError(`Erro ao adicionar comentário: ${error.message}`);
    }
  }

  /**
   * Adiciona evidências à denúncia
   * @param {string} reportId - ID da denúncia
   * @param {Array} arquivos - Arquivos a adicionar
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>}
   */
  static async addEvidences(reportId, arquivos, userId) {
    try {
      const now = new Date();

      const report = await Report.findOneAndUpdate(
        { id: reportId },
        {
          $push: {
            evidencias: {
              $each: arquivos.map(arquivo => ({
                arquivo,
                uploadedAt: now,
                uploadedBy: userId
              }))
            },
            historico: {
              data: now,
              tipo: 'EVIDENCIAS_ADICIONADAS',
              autor: userId,
              descricao: `${arquivos.length} nova(s) evidência(s) adicionada(s)`
            }
          },
          updatedAt: now
        },
        { new: true }
      );

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      return report;
    } catch (error) {
      throw new DatabaseError(`Erro ao adicionar evidências: ${error.message}`);
    }
  }

  /**
   * Atualiza status da denúncia
   * @param {string} reportId - ID da denúncia
   * @param {string} novoStatus - Novo status
   * @param {Object} metadata - Metadados da ação
   * @returns {Promise<Object>}
   */
  static async updateReportStatus(reportId, novoStatus, metadata = {}) {
    try {
      const report = await Report.findOne({ id: reportId });

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      const statusAntigo = report.status;
      const now = new Date();

      // Atualizar
      report.status = novoStatus;
      report.updatedAt = now;

      if (novoStatus === 'RESOLVIDA') {
        const prazo = new Date();
        prazo.setDate(prazo.getDate() + 7);
        report.prazoConfirmacao = prazo;
      }

      if (novoStatus === 'CONCLUIDA') {
        report.concludedAt = now;
      }

      // Adicionar ao histórico
      report.historico.push({
        data: now,
        tipo: 'MUDANCA_STATUS',
        autor: metadata.autor,
        descricao: `Status alterado de ${statusAntigo} para ${novoStatus}${metadata.motivo ? ': ' + metadata.motivo : ''}`
      });

      const updated = await report.save();
      return updated;
    } catch (error) {
      throw new DatabaseError(`Erro ao atualizar status: ${error.message}`);
    }
  }

  /**
   * Avança etapa da denúncia
   * @param {string} reportId - ID da denúncia
   * @param {Object} metadata - Metadados da ação
   * @returns {Promise<Object>}
   */
  static async advanceReportStage(reportId, metadata = {}) {
    try {
      const report = await Report.findOne({ id: reportId });

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      const etapaAtual = report.etapa;
      const proximaEtapa = Math.min(etapaAtual + 1, 6);
      
      if (proximaEtapa === etapaAtual) {
        throw new Error('Denúncia já atingiu a etapa final');
      }

      // Mapeamento de etapas para status
      const statusMap = {
        1: 'CRIADA',
        2: 'EM_ANALISE',
        3: 'EM_INVESTIGACAO',
        4: 'AGUARDANDO_INSPECAO',
        5: 'RESOLVIDA',
        6: 'CONCLUIDA'
      };

      const statusAnterior = report.status;
      const novoStatus = statusMap[proximaEtapa];
      const now = new Date();

      report.etapa = proximaEtapa;
      report.status = novoStatus;
      report.updatedAt = now;

      if (proximaEtapa === 6) {
        report.concludedAt = now;
      }

      report.historico.push({
        data: now,
        tipo: 'AVANCAR_ETAPA',
        autor: metadata.autor,
        descricao: `Denúncia avançou de ${statusAnterior} para ${novoStatus}`
      });

      const updated = await report.save();
      return updated;
    } catch (error) {
      throw new DatabaseError(`Erro ao avançar etapa: ${error.message}`);
    }
  }

  /**
   * Atualiza prioridade da denúncia
   * @param {string} reportId - ID da denúncia
   * @param {string} novaPrioridade - Nova prioridade
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>}
   */
  static async updateReportPriority(reportId, novaPrioridade, userId) {
    try {
      const report = await Report.findOne({ id: reportId });

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      const prioridadeAntiga = report.prioridade;
      const now = new Date();

      report.prioridade = novaPrioridade;
      report.updatedAt = now;
      report.historico.push({
        data: now,
        tipo: 'ALTERACAO_PRIORIDADE',
        autor: userId,
        descricao: `Prioridade alterada de ${prioridadeAntiga} para ${novaPrioridade}`
      });

      const updated = await report.save();
      return updated;
    } catch (error) {
      throw new DatabaseError(`Erro ao atualizar prioridade: ${error.message}`);
    }
  }

  /**
   * Aceita denúncia para análise
   * @param {string} reportId - ID da denúncia
   * @param {Object} metadata - Dados da autoridade responsável
   * @returns {Promise<Object>}
   */
  static async acceptReport(reportId, metadata) {
    try {
      const report = await Report.findOne({ id: reportId });

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      if (report.status !== 'CRIADA') {
        throw new Error('Denúncia já está sendo tratada');
      }

      const now = new Date();

      report.autoridade = {
        id: metadata.userId,
        email: metadata.email
      };
      report.status = 'EM_ANALISE';
      report.etapa = 2;
      report.updatedAt = now;

      report.historico.push({
        data: now,
        tipo: 'ACEITAR_DENUNCIA',
        autor: metadata.userId,
        autorRole: 'authority',
        descricao: 'Autoridade aceitou e iniciou análise da denúncia'
      });

      const updated = await report.save();
      return updated;
    } catch (error) {
      throw new DatabaseError(`Erro ao aceitar denúncia: ${error.message}`);
    }
  }

  /**
   * Adiciona feedback à denúncia
   * @param {string} reportId - ID da denúncia
   * @param {string} feedbackText - Texto do feedback
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>}
   */
  static async addFeedback(reportId, feedbackText, userId) {
    try {
      const report = await Report.findOne({ id: reportId });

      if (!report) {
        throw new Error('Denúncia não encontrada');
      }

      const now = new Date();

      report.feedback = report.feedback || [];
      report.feedback.push({
        text: feedbackText,
        date: now,
        usuario: userId
      });

      report.historico.push({
        data: now,
        tipo: 'ADICIONAR_FEEDBACK',
        autor: userId,
        descricao: 'Denunciante adicionou feedback à denúncia'
      });

      report.updatedAt = now;
      const updated = await report.save();
      return updated;
    } catch (error) {
      throw new DatabaseError(`Erro ao adicionar feedback: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas de denúncias
   * @returns {Promise<Object>}
   */
  static async getReportStats() {
    try {
      const stats = await Report.aggregate([
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            byType: [
              { $group: { _id: '$tipo', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            byPriority: [
              { $group: { _id: '$prioridade', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            total: [
              { $count: 'count' }
            ],
            concluded: [
              { $match: { status: 'CONCLUIDA' } },
              { $count: 'count' }
            ],
            inProgress: [
              { $match: { status: { $in: ['EM_ANALISE', 'EM_INVESTIGACAO', 'AGUARDANDO_INSPECAO'] } } },
              { $count: 'count' }
            ]
          }
        }
      ]);

      return stats[0] || {};
    } catch (error) {
      throw new DatabaseError(`Erro ao obter estatísticas: ${error.message}`);
    }
  }
}

/**
 * Classe customizada para erros de banco de dados
 */
class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    console.error(`[Database Error] ${message}`);
  }
}

module.exports = {
  DatabaseService,
  DatabaseError
};
