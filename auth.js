// auth.js - Gerenciamento de autenticação global

document.addEventListener('DOMContentLoaded', () => {
  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        const res = await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          // Redirecionar para login após logout bem-sucedido
          window.location.href = 'login.html';
        } else {
          alert('Erro ao fazer logout');
        }
      } catch (err) {
        console.error('Erro ao fazer logout:', err);
        alert('Erro ao fazer logout. Tente novamente.');
      }
    });
  }

  // Verificar autenticação no carregamento da página
  // Se não autenticado, redirecionar para login
  if (window.location.pathname.includes('dashboard') || 
      window.location.pathname.includes('nova-denuncia') ||
      window.location.pathname.includes('autoridade-dashboard') ||
      window.location.pathname.includes('historico-denuncias')) {
    
    fetch('/api/me')
      .then(res => {
        if (!res.ok) {
          window.location.href = 'login.html';
        }
      })
      .catch(err => {
        console.error('Erro ao verificar autenticação:', err);
        window.location.href = 'login.html';
      });
  }
});
