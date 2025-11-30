const mongoose = require('mongoose');

/**
 * Schema de Usuário
 * 
 * Profissional para:
 * - Autenticação segura com bcrypt
 * - Validação de email e phone
 * - Controle de acesso por role
 * - Auditoria com timestamps
 */
const userSchema = new mongoose.Schema(
  {
    // Identidade
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'UUID único do usuário'
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email inválido'
      },
      description: 'Email único do usuário'
    },
    
    // Autenticação
    passwordHash: {
      type: String,
      required: true,
      description: 'Hash bcrypt da senha'
    },
    
    // Perfil
    role: {
      type: String,
      enum: ['user', 'authority', 'admin'],
      default: 'user',
      index: true,
      description: 'Papel do usuário no sistema'
    },
    
    // Dados Pessoais
    cpf: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^\d{11}$/.test(v.replace(/\D/g, ''));
        },
        message: 'CPF deve conter 11 dígitos'
      },
      description: 'CPF do usuário (apenas para usuários normais)'
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(\d{10}|\d{11})$/.test(v.replace(/\D/g, ''));
        },
        message: 'Telefone inválido'
      },
      description: 'Telefone do usuário'
    },
    name: {
      type: String,
      trim: true,
      description: 'Nome completo do usuário'
    },
    
    // Status
    ativo: {
      type: Boolean,
      default: true,
      index: true,
      description: 'Se o usuário está ativo no sistema'
    },
    
    // Auditoria
    createdAt: {
      type: Date,
      default: Date.now,
      description: 'Data de criação'
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      description: 'Data da última atualização'
    },
    lastLogin: {
      type: Date,
      description: 'Última vez que o usuário fez login'
    }
  },
  {
    collection: 'users',
    timestamps: true,
    versionKey: false
  }
);

// Índices compostos para queries frequentes
userSchema.index({ role: 1, ativo: 1 });
userSchema.index({ createdAt: -1 });

// Middleware para atualizar updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Schema de Denúncia (Report)
 * 
 * Profissional para:
 * - Rastreamento completo de status
 * - Histórico de ações
 * - Evidências estruturadas
 * - Comentários e feedback
 * - Performance com índices estratégicos
 */
const reportSchema = new mongoose.Schema(
  {
    // Identidade
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'UUID único da denúncia'
    },
    protocolo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'Número de protocolo (ex: ANI-20251117-00001)'
    },
    
    // Localização
    endereco: {
      type: String,
      required: true,
      trim: true,
      description: 'Endereço do incidente'
    },
    bairro: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      description: 'Bairro da denúncia'
    },
    
    // Informações do Incidente
    tipo: {
      type: String,
      required: true,
      enum: [
        'abandono',
        'maus_tratos',
        'negligencia',
        'violencia_fisica',
        'comercio_ilegal',
        'outro'
      ],
      index: true,
      description: 'Tipo de denúncia'
    },
    especie: {
      type: String,
      trim: true,
      description: 'Espécie do animal (gato, cão, ave, etc)'
    },
    condicao: {
      type: String,
      enum: ['saudavel', 'ferido', 'desnutrido', 'em_risco'],
      description: 'Condição do animal'
    },
    descricao: {
      type: String,
      trim: true,
      description: 'Descrição detalhada da denúncia'
    },
    autorNome: {
      type: String,
      trim: true,
      description: 'Nome do suspeito/autor dos maus-tratos'
    },
    outrasInfo: {
      type: String,
      trim: true,
      description: 'Outras informações relevantes'
    },
    
    // Status da Denúncia
    status: {
      type: String,
      enum: [
        'CRIADA',
        'EM_ANALISE',
        'EM_INVESTIGACAO',
        'AGUARDANDO_INSPECAO',
        'RESOLVIDA',
        'CONCLUIDA'
      ],
      default: 'CRIADA',
      index: true,
      description: 'Status atual da denúncia'
    },
    etapa: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      default: 1,
      index: true,
      description: 'Etapa atual da denúncia'
    },
    prioridade: {
      type: String,
      enum: ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'],
      default: 'MEDIA',
      index: true,
      description: 'Nível de prioridade'
    },
    
    // Denunciante
    denuncianteNome: {
      type: String,
      trim: true,
      description: 'Nome do denunciante'
    },
    denuncianteCPF: {
      type: String,
      description: 'CPF do denunciante'
    },
    denuncianteContato: {
      type: String,
      trim: true,
      description: 'Contato do denunciante'
    },
    
    // Responsáveis
    createdBy: {
      type: String,
      required: true,
      index: true,
      description: 'ID do usuário que criou a denúncia'
    },
    autoridade: {
      id: {
        type: String,
        description: 'ID da autoridade responsável'
      },
      email: {
        type: String,
        description: 'Email da autoridade'
      }
    },
    equipeDesignada: {
      type: String,
      description: 'Equipe designada para investigação'
    },
    
    // Evidências
    arquivos: [
      {
        name: String,
        size: Number,
        uploadedAt: Date,
        uploadedBy: String,
        _id: false
      }
    ],
    evidencias: [
      {
        arquivo: {
          name: String,
          size: Number
        },
        uploadedAt: Date,
        uploadedBy: String,
        _id: false
      }
    ],
    
    // Comunicação
    comentarios: [
      {
        id: String,
        texto: String,
        autor: String,
        autorEmail: String,
        data: Date,
        _id: false
      }
    ],
    
    // Feedback
    feedback: [
      {
        text: String,
        date: Date,
        usuario: String,
        _id: false
      }
    ],
    
    // Histórico Completo
    historico: [
      {
        data: Date,
        tipo: {
          type: String,
          enum: [
            'CRIACAO',
            'ACEITAR_DENUNCIA',
            'MUDANCA_STATUS',
            'AVANCAR_ETAPA',
            'ALTERACAO_PRIORIDADE',
            'COMENTARIO',
            'EVIDENCIAS_ADICIONADAS',
            'ADICIONAR_FEEDBACK'
          ]
        },
        autor: String,
        autorRole: String,
        descricao: String,
        motivo: String,
        _id: false
      }
    ],
    
    // Ações
    acoes: [
      {
        tipo: String,
        de: Number,
        para: Number,
        autor: String,
        autorRole: String,
        data: Date,
        descricao: String,
        _id: false
      }
    ],
    
    // Prazos
    prazoConfirmacao: {
      type: Date,
      description: 'Prazo para o denunciante confirmar resolução'
    },
    
    // Datas
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      description: 'Data de criação'
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      description: 'Data da última atualização'
    },
    concludedAt: {
      type: Date,
      description: 'Data de conclusão da denúncia'
    },
    lastUpdateAt: {
      type: Date,
      default: Date.now,
      description: 'Última atualização'
    }
  },
  {
    collection: 'reports',
    timestamps: true,
    versionKey: false
  }
);

// Índices compostos para queries frequentes
reportSchema.index({ createdBy: 1, status: 1 });
reportSchema.index({ status: 1, etapa: 1 });
reportSchema.index({ 'autoridade.id': 1, status: 1 });
reportSchema.index({ tipo: 1, bairro: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ prioridade: 1, status: 1 });

// TTL Index para auto-limpeza de dados arquivados após 2 anos
reportSchema.index(
  { concludedAt: 1 },
  { 
    expireAfterSeconds: 63072000,
    sparse: true,
    partialFilterExpression: { status: 'CONCLUIDA' }
  }
);

// Middleware para atualizar updatedAt
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos úteis
reportSchema.methods.isEmAndamento = function() {
  return this.etapa >= 1 && this.etapa < 6;
};

reportSchema.methods.isConcluida = function() {
  return this.etapa === 6 && this.status === 'CONCLUIDA';
};

reportSchema.methods.canBeEditedBy = function(userId, userRole) {
  const isCreator = this.createdBy === userId;
  const isResponsibleAuthority = this.autoridade?.id === userId;
  const isAdmin = userRole === 'admin';
  
  return isCreator || isResponsibleAuthority || isAdmin;
};

// Modelos
const User = mongoose.model('User', userSchema);
const Report = mongoose.model('Report', reportSchema);

module.exports = {
  User,
  Report,
  userSchema,
  reportSchema
};
