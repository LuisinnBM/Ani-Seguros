// Controles de paginação
const paginationControls = document.createElement('div');
paginationControls.className = 'pagination-controls';
paginationControls.innerHTML = `
  <button class="btn-prev" disabled>Anterior</button>
  <span class="page-info">Página 1 de 1</span>
  <button class="btn-next" disabled>Próxima</button>
  <select class="items-per-page">
    <option value="10">10 por página</option>
    <option value="20">20 por página</option>
    <option value="50">50 por página</option>
  </select>
`;

// Filtros de pesquisa
const searchControls = document.createElement('div');
searchControls.className = 'search-controls';
searchControls.innerHTML = `
  <input type="text" class="search-input" placeholder="Buscar denúncias...">
  <select class="status-filter">
    <option value="">Todos os status</option>
    <option value="CRIADA">Criada</option>
    <option value="EM_ANALISE">Em Análise</option>
    <option value="EM_INVESTIGACAO">Em Investigação</option>
    <option value="AGUARDANDO_INSPECAO">Aguardando Inspeção</option>
    <option value="RESOLVIDA">Resolvida</option>
    <option value="CONCLUIDA">Concluída</option>
    <option value="ARQUIVADA">Arquivada</option>
  </select>
  <select class="sort-by">
    <option value="createdAt">Data de Criação</option>
    <option value="protocolo">Protocolo</option>
    <option value="prioridade">Prioridade</option>
  </select>
  <select class="sort-order">
    <option value="desc">Mais recente</option>
    <option value="asc">Mais antigo</option>
  </select>
`;

// Estado da paginação
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let searchTerm = '';
let statusFilter = '';
let sortBy = 'createdAt';
let sortOrder = 'desc';

// Funções de controle
function updatePageInfo() {
  const pageInfo = paginationControls.querySelector('.page-info');
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

  const btnPrev = paginationControls.querySelector('.btn-prev');
  const btnNext = paginationControls.querySelector('.btn-next');

  btnPrev.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages;
}

function loadPage(page) {
  const url = new URL('/api/reports', window.location.origin);
  url.searchParams.append('page', page);
  url.searchParams.append('limit', itemsPerPage);
  url.searchParams.append('search', searchTerm);
  url.searchParams.append('status', statusFilter);
  url.searchParams.append('sortBy', sortBy);
  url.searchParams.append('sortOrder', sortOrder);

  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar denúncias');
      return res.json();
    })
    .then(data => {
      currentPage = page;
      totalPages = data.pagination.totalPages;
      updatePageInfo();
      return data;
    });
}

// Event listeners
paginationControls.querySelector('.btn-prev').addEventListener('click', () => {
  if (currentPage > 1) {
    loadPage(currentPage - 1);
  }
});

paginationControls.querySelector('.btn-next').addEventListener('click', () => {
  if (currentPage < totalPages) {
    loadPage(currentPage + 1);
  }
});

paginationControls.querySelector('.items-per-page').addEventListener('change', (e) => {
  itemsPerPage = parseInt(e.target.value);
  loadPage(1);
});

searchControls.querySelector('.search-input').addEventListener('input', debounce((e) => {
  searchTerm = e.target.value;
  loadPage(1);
}, 300));

searchControls.querySelector('.status-filter').addEventListener('change', (e) => {
  statusFilter = e.target.value;
  loadPage(1);
});

searchControls.querySelector('.sort-by').addEventListener('change', (e) => {
  sortBy = e.target.value;
  loadPage(1);
});

searchControls.querySelector('.sort-order').addEventListener('change', (e) => {
  sortOrder = e.target.value;
  loadPage(1);
});

// Função debounce para otimizar a busca
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Exportar módulo
window.paginationModule = {
  paginationControls,
  searchControls,
  loadPage
};