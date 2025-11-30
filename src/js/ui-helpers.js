// Estado global de loading
let isLoading = false;

// Elemento de loading
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = `
  <div class="loading-spinner"></div>
  <p class="loading-text">Carregando...</p>
`;
document.body.appendChild(loadingOverlay);

// Função para mostrar loading
function showLoading(message = 'Carregando...') {
    isLoading = true;
    loadingOverlay.querySelector('.loading-text').textContent = message;
    loadingOverlay.style.display = 'flex';
}

// Função para esconder loading
function hideLoading() {
    isLoading = false;
    loadingOverlay.style.display = 'none';
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.classList.add('notification--fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Função para tratar erros de API
function handleApiError(error) {
    console.error('Erro:', error);
    
    if (error.response) {
        // Erro do servidor com resposta
        const message = error.response.data.error || 'Erro ao processar sua requisição';
        showNotification(message, 'error');
    } else if (error.request) {
        // Erro de rede
        showNotification('Erro de conexão. Verifique sua internet.', 'error');
    } else {
        // Outros erros
        showNotification('Ocorreu um erro inesperado', 'error');
    }
}

// Interceptor para adicionar loading automático
function withLoading(promise, loadingMessage = 'Carregando...') {
    showLoading(loadingMessage);
    
    return promise
        .finally(() => {
            hideLoading();
        });
}

// Exportar funções
window.uiHelpers = {
    showLoading,
    hideLoading,
    showNotification,
    handleApiError,
    withLoading
};