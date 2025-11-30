// UI Helpers para funcionalidades comuns
window.uiHelpers = {
    showLoading(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const loadingContent = document.createElement('div');
        loadingContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
        `;

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px auto;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        loadingContent.appendChild(spinner);
        loadingContent.appendChild(document.createTextNode(message || 'Carregando...'));
        loadingDiv.appendChild(loadingContent);
        document.head.appendChild(style);
        document.body.appendChild(loadingDiv);
    },

    hideLoading() {
        const loadingDiv = document.getElementById('loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    },

    handleApiError(error) {
        console.error('Erro na API:', error);
        alert(error.message || 'Ocorreu um erro ao processar sua solicitação.');
        this.hideLoading();
    },

    showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message--${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.5s ease-out;
        `;

        if (type === 'success') {
            messageDiv.style.backgroundColor = '#2ecc71';
            messageDiv.style.color = 'white';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#e74c3c';
            messageDiv.style.color = 'white';
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;

        messageDiv.textContent = message;
        document.head.appendChild(style);
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.5s ease-in';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
};