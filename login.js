// login-toggle.js

// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtns = document.querySelectorAll('.login-cadastro__toggle-btn');
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'ativo' de todos os botões e adiciona no clicado
            toggleBtns.forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');

            // Atualiza os placeholders conforme o botão clicado
            if (btn.textContent.trim() === 'Usuário') {
                emailInput.placeholder = 'E-mail';
                passwordInput.placeholder = 'Senha';
            } else if (btn.textContent.trim() === 'Autoridade') {
                emailInput.placeholder = 'E-mail da Instituição';
                passwordInput.placeholder = 'Senha';
            }
        });
    });
    // Wire up form to call backend
    const form = document.querySelector('.login-cadastro__form');
    const submitBtn = form.querySelector('.login-cadastro__botao');

    // Prevent default anchor behavior and perform login
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.querySelector('input[type="email"]').value.trim();
        const password = document.querySelector('input[type="password"]').value.trim();
        const isAuthority = document.querySelector('.login-cadastro__toggle-btn.ativo').textContent.trim() === 'Autoridade';

        if (!email || !password) {
            alert('Por favor, preencha e-mail e senha.');
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, isAuthority })
            });
            const data = await res.json();
            if (!res.ok) return alert(data.error || 'Falha ao autenticar');

            // Redirecionar baseado no tipo de usuário
            if (data.user.role === 'authority') {
                if (!isAuthority) {
                    alert('Este é um perfil de autoridade. Por favor, selecione a opção "Autoridade" para fazer login.');
                    return;
                }
                window.location.href = 'autoridade-dashboard.html';
            } else {
                if (isAuthority) {
                    alert('Este é um perfil de usuário comum. Por favor, selecione a opção "Usuário" para fazer login.');
                    return;
                }
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            console.error(err);
            alert('Erro de rede ao tentar logar');
        }
    });
});
