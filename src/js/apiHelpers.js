// Função para fazer requisições à API com tratamento de erros
async function fetchAPI(url, options = {}) {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        const data = await res.json();

        if (!res.ok) {
            // Se a sessão expirou, redirecionar para o login
            if (res.status === 401) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                window.location.href = 'login.html';
                return null;
            }
            throw new Error(data.error || 'Erro na operação');
        }

        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        if (error.message === 'Failed to fetch') {
            throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        }
        throw error;
    }
}

window.apiHelpers = { fetchAPI };