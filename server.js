const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

// Importar módulos MongoDB
const { connectDB, setupConnectionMonitoring } = require('./config/database');
const { DatabaseService, DatabaseError } = require('./services/database.service');
const stateManager = require('./stateManager');

const app = express();
const PORT = process.env.PORT || 3000;
const VALIDATION_SERVICE_URL = process.env.VALIDATION_SERVICE_URL || 'http://localhost:8080/validate';

/**
 * ===================== CONFIGURAÇÃO INICIAL =====================
 */

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'ani-seguros-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    secure: process.env.NODE_ENV === 'production' // HTTPS em produção
  }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

/**
 * ===================== UTILITÁRIOS =====================
 */

/**
 * Função para validar dados usando o serviço Go
 */
async function validate(type, value) {
  try {
    const response = await axios.post(VALIDATION_SERVICE_URL, { type, value });
    return response.data.valid;
  } catch (error) {
    console.error(`[Validation] Erro ao validar ${type}:`, error.message);
    return false;
  }
}

/**
 * Verifica permissões para mudança de status
 */
function verificarPermissaoMudancaStatus(user, report, novoStatus) {
  if (user.role === 'authority' || user.role === 'admin') {
    return true;
  }

  if (user.id === report.createdBy) {
    if (report.status === 'RESOLVIDA' && novoStatus === 'CONCLUIDA') {
      return true;
    }
  }

  return false;
}

/**
 * ===================== ENDPOINTS: AUTENTICAÇÃO =====================
 */

/**
 * POST /api/register
 * Registrar novo usuário
 */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role, cpf, phone } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Validações adicionais para usuários comuns
    if (role !== 'authority' && role !== 'admin') {
      const [isValidCPF, isValidPhone] = await Promise.all([
        validate('cpf', cpf),
        validate('phone', phone)
      ]);

      if (!isValidCPF) {
        return res.status(400).json({ error: 'CPF inválido' });
      }
      if (!isValidPhone) {
        return res.status(400).json({ error: 'Telefone inválido' });
      }
    }

    // Hash da senha
    const hash = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await DatabaseService.createUser({
      email,
      passwordHash: hash,
      role: role || 'user',
      cpf,
      phone
    });

    res.json({ 
      ok: true, 
      id: user.id,
      message: 'Usuário registrado com sucesso'
    });

  } catch (error) {
    if (error.message.includes('Email já cadastrado')) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }
    
    console.error('[Register] Erro:', error.message);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

/**
 * POST /api/login
 * Autenticar usuário
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, isAuthority } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Validar email
    const isValidEmail = await validate('email', email);
    if (!isValidEmail) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Buscar usuário
    const user = await DatabaseService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Validar tipo de perfil
    if (isAuthority && user.role !== 'authority' && user.role !== 'admin') {
      return res.status(401).json({ error: 'Este não é um perfil de autoridade' });
    }

    if (!isAuthority && (user.role === 'authority' || user.role === 'admin')) {
      return res.status(401).json({ error: 'Este é um perfil de autoridade' });
    }

    // Comparar senha
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await DatabaseService.updateUser(user.id, { lastLogin: new Date() });

    // Criar sessão
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    res.json({ 
      ok: true, 
      user: req.session.user 
    });

  } catch (error) {
    console.error('[Login] Erro:', error.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * POST /api/logout
 * Fazer logout
 */
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Erro ao fazer logout' });
    res.json({ ok: true });
  });
});

/**
 * GET /api/me
 * Obter usuário atual
 */
app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json({ user: req.session.user });
});

/**
 * ===================== ENDPOINTS: DENÚNCIAS =====================
 */

/**
 * POST /api/reports
 * Criar nova denúncia
 */
app.post('/api/reports', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const {
      endereco,
      bairro,
      tipo,
      especie,
      condicao,
      descricao,
      autorNome,
      outrasInfo,
      arquivos = []
    } = req.body;

    // Validações
    if (!endereco?.trim()) return res.status(400).json({ error: 'Endereço é obrigatório' });
    if (!bairro?.trim()) return res.status(400).json({ error: 'Bairro é obrigatório' });
    if (!tipo?.trim()) return res.status(400).json({ error: 'Tipo de denúncia é obrigatório' });
    if (!especie?.trim()) return res.status(400).json({ error: 'Espécie do animal é obrigatória' });
    if (!condicao?.trim()) return res.status(400).json({ error: 'Condição do animal é obrigatória' });
    if (arquivos.length === 0) return res.status(400).json({ error: 'Pelo menos um arquivo de evidência é obrigatório' });

    // Validar categoria
    const isValidCategory = await validate('category', tipo);
    if (!isValidCategory) {
      return res.status(400).json({ error: 'Categoria de denúncia inválida' });
    }

    // Validar arquivos
    for (const arquivo of arquivos) {
      const [isValidExt, isValidSize] = await Promise.all([
        validate('file-extension', arquivo.name),
        validate('file-size', arquivo)
      ]);

      if (!isValidExt) {
        return res.status(400).json({ error: `Tipo de arquivo não permitido: ${arquivo.name}` });
      }

      if (!isValidSize) {
        return res.status(400).json({ error: `Arquivo muito grande: ${arquivo.name}` });
      }
    }

    // Gerar protocolo
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Contar denúncias do dia para gerar número único
    const today_start = new Date(today);
    today_start.setHours(0, 0, 0, 0);
    const today_end = new Date(today);
    today_end.setHours(23, 59, 59, 999);

    // Buscar denúncias do dia (para gerar número sequencial)
    const { reports: reportsToday } = await DatabaseService.getAllReports({
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    const reportsCount = reportsToday.filter(r => 
      r.createdAt >= today_start && r.createdAt <= today_end
    ).length;

    const reportNumber = String(reportsCount + 1).padStart(5, '0');
    const protocolo = `ANI-${dateStr}-${reportNumber}`;

    // Buscar dados do denunciante
    const denunciante = await DatabaseService.getUserById(req.session.user.id);

    // Criar denúncia
    const report = await DatabaseService.createReport({
      protocolo,
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      tipo: tipo.trim(),
      especie: especie?.trim(),
      condicao: condicao?.trim(),
      descricao: descricao?.trim(),
      autorNome: autorNome?.trim(),
      outrasInfo: outrasInfo?.trim(),
      denuncianteNome: denunciante?.email || 'Anônimo',
      denuncianteCPF: denunciante?.cpf,
      denuncianteContato: denunciante?.phone,
      arquivos,
      createdBy: req.session.user.id
    });

    console.log(`[Reports] ✅ Nova denúncia criada: ${protocolo}`);
    res.json({ ok: true, report });

  } catch (error) {
    console.error('[Create Report] Erro:', error.message);
    res.status(500).json({ error: error.message || 'Erro ao criar denúncia' });
  }
});

/**
 * GET /api/reports
 * Listar denúncias
 */
app.get('/api/reports', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let result;

    if (req.session.user.role === 'authority' || req.session.user.role === 'admin') {
      // Autoridades veem todas as denúncias
      result = await DatabaseService.getAllReports({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        sortBy,
        sortOrder
      });
    } else {
      // Usuários normais veem apenas suas denúncias
      result = await DatabaseService.getUserReports(req.session.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        sortBy,
        sortOrder
      });
    }

    res.json(result);

  } catch (error) {
    console.error('[Get Reports] Erro:', error.message);
    res.status(500).json({ error: 'Erro ao listar denúncias' });
  }
});

/**
 * POST /api/reports/:id/aceitar
 * Aceitar denúncia para análise
 */
app.post('/api/reports/:id/aceitar', async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'authority' && req.session.user.role !== 'admin')) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;

    const report = await DatabaseService.acceptReport(id, {
      userId: req.session.user.id,
      email: req.session.user.email
    });

    console.log(`[Reports] ✅ Denúncia aceita: ${report.protocolo}`);
    res.json({ ok: true, report, mensagem: 'Denúncia aceita com sucesso!' });

  } catch (error) {
    if (error.message.includes('já está sendo tratada')) {
      return res.status(400).json({ error: 'Denúncia já está sendo tratada por outra autoridade' });
    }

    console.error('[Accept Report] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/:id/comentar
 * Adicionar comentário
 */
app.post('/api/reports/:id/comentar', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;
    const { comentario } = req.body;

    if (!comentario?.trim()) {
      return res.status(400).json({ error: 'Comentário não pode ser vazio' });
    }

    const report = await DatabaseService.addComment(id, {
      texto: comentario.trim(),
      autor: req.session.user.id,
      autorEmail: req.session.user.email
    });

    res.json({ ok: true, report });

  } catch (error) {
    console.error('[Add Comment] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/:id/prioridade
 * Atualizar prioridade
 */
app.post('/api/reports/:id/prioridade', async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'authority' && req.session.user.role !== 'admin')) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;
    const { prioridade } = req.body;

    if (!['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'].includes(prioridade)) {
      return res.status(400).json({ error: 'Prioridade inválida' });
    }

    const report = await DatabaseService.updateReportPriority(id, prioridade, req.session.user.id);

    res.json({ ok: true, report });

  } catch (error) {
    console.error('[Update Priority] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/:id/evidencias
 * Adicionar evidências
 */
app.post('/api/reports/:id/evidencias', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;
    const { arquivos } = req.body;

    if (!Array.isArray(arquivos) || arquivos.length === 0) {
      return res.status(400).json({ error: 'Nenhuma evidência fornecida' });
    }

    const report = await DatabaseService.addEvidences(id, arquivos, req.session.user.id);

    res.json({ ok: true, report });

  } catch (error) {
    console.error('[Add Evidence] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/:id/status
 * Atualizar status
 */
app.post('/api/reports/:id/status', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;
    const { novoStatus, motivo } = req.body;

    const statusValidos = [
      'CRIADA', 'EM_ANALISE', 'EM_INVESTIGACAO',
      'AGUARDANDO_INSPECAO', 'RESOLVIDA', 'CONCLUIDA'
    ];

    if (!statusValidos.includes(novoStatus)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verificar permissões
    const report = await DatabaseService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    if (!verificarPermissaoMudancaStatus(req.session.user, report, novoStatus)) {
      return res.status(403).json({ error: 'Sem permissão para esta mudança de status' });
    }

    const updated = await DatabaseService.updateReportStatus(id, novoStatus, {
      autor: req.session.user.id,
      motivo
    });

    res.json({ ok: true, report: updated });

  } catch (error) {
    console.error('[Update Status] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/:id/avancar-etapa
 * Avançar etapa
 */
app.post('/api/reports/:id/avancar-etapa', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.params;

    const report = await DatabaseService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    // Verificar se é o autor ou a autoridade responsável
    const isAuthor = report.createdBy === req.session.user.id;
    const isAuthority = report.autoridade?.id === req.session.user.id;

    if (!isAuthor && !isAuthority && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar esta denúncia' });
    }

    const updated = await DatabaseService.advanceReportStage(id, {
      autor: req.session.user.id
    });

    res.json({ ok: true, report: updated, mensagem: 'Etapa avançada com sucesso' });

  } catch (error) {
    console.error('[Advance Stage] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/:id/feedback
 * Adicionar feedback
 */
app.post('/api/reports/:id/feedback', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { feedback } = req.body;

    const report = await DatabaseService.getReportById(id);
    if (!report || report.createdBy !== req.session.user.id) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    if (report.etapa !== 6) {
      return res.status(400).json({ error: 'Avaliação permitida apenas quando a denúncia estiver na etapa 6 (Concluída)' });
    }

    if (!feedback?.trim()) {
      return res.status(400).json({ error: 'Feedback não pode ser vazio' });
    }

    const updated = await DatabaseService.addFeedback(id, feedback.trim(), req.session.user.id);

    res.json({ ok: true, mensagem: 'Feedback registrado com sucesso!' });

  } catch (error) {
    console.error('[Add Feedback] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ===================== ENDPOINTS: USUÁRIOS =====================
 */

/**
 * GET /api/users
 * Listar todos os usuários (authority/admin apenas)
 */
app.get('/api/users', async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'authority' && req.session.user.role !== 'admin')) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const users = await DatabaseService.getAllUsers({ ativo: true });
    const sanitized = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      cpf: u.cpf,
      phone: u.phone,
      name: u.name
    }));

    res.json({ ok: true, users: sanitized });

  } catch (error) {
    console.error('[Get Users] Erro:', error.message);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

/**
 * DELETE /api/users/:id
 * Deletar usuário (authority/admin apenas)
 */
app.delete('/api/users/:id', async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'authority' && req.session.user.role !== 'admin')) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const { id } = req.params;

    await DatabaseService.deleteUser(id);

    res.json({ ok: true });

  } catch (error) {
    console.error('[Delete User] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Atualizar usuário
 */
app.put('/api/users/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { email, password, role, cpf, phone } = req.body;

    // Apenas autoridade pode atualizar outros usuários
    if (req.session.user.id !== id && req.session.user.role !== 'authority' && req.session.user.role !== 'admin') {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const updateData = {};

    if (email) updateData.email = email;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    if (role && (req.session.user.role === 'authority' || req.session.user.role === 'admin')) {
      updateData.role = role;
    }
    if (cpf) updateData.cpf = cpf;
    if (phone) updateData.phone = phone;

    const user = await DatabaseService.updateUser(id, updateData);

    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        cpf: user.cpf,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('[Update User] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ===================== ENDPOINTS: ESTATÍSTICAS =====================
 */

/**
 * GET /api/stats
 * Obter estatísticas (authority/admin apenas)
 */
app.get('/api/stats', async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'authority' && req.session.user.role !== 'admin')) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const stats = await DatabaseService.getReportStats();

    res.json({ ok: true, stats });

  } catch (error) {
    console.error('[Get Stats] Erro:', error.message);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

/**
 * ===================== MIDDLEWARE DE PROTEÇÃO =====================
 */

// Middleware para verificar autenticação em rotas /api
app.use('/api', (req, res, next) => {
  // Rotas públicas (login, register)
  const publicRoutes = ['/api/login', '/api/register'];
  if (publicRoutes.includes(req.path) && req.method === 'POST') {
    return next();
  }

  if (!req.session.user) {
    return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
  }
  next();
});

/**
 * ===================== ROTA FALLBACK =====================
 */

// Fallback para index
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint não encontrado' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * ===================== INICIALIZAÇÃO DO SERVIDOR =====================
 */

async function startServer() {
  try {
    // Conectar ao MongoDB
    console.log('\n🔄 Conectando ao MongoDB...');
    await connectDB();
    setupConnectionMonitoring();
    console.log('✅ MongoDB conectado com sucesso!\n');

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ Servidor Ani-Seguros iniciado!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🗄️  Banco de dados: MongoDB Atlas`);
      console.log(`${PORT === 3000 ? '⚡ Modo: Desenvolvimento' : '🚀 Modo: Produção'}`);
      console.log(`${'='.repeat(60)}\n`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejection não capturada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception não capturada:', error);
  process.exit(1);
});

// Iniciar
startServer();
