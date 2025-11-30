document.addEventListener('DOMContentLoaded', () => {
  const cadUsuarioForm = document.getElementById('cadUsuarioForm');
  const cadAutoridadeForm = document.getElementById('cadAutoridadeForm');

  async function handleSubmit(e, role) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      cpf: formData.get('cpf'),
      phone: formData.get('phone'),
      role
    };
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Erro ao cadastrar');
      alert('Cadastro realizado com sucesso. Você já pode realizar o login.');
      window.location.href = 'login.html';
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao cadastrar.');
    }
  }

  if (cadUsuarioForm) cadUsuarioForm.addEventListener('submit', (e) => handleSubmit(e, 'user'));
  if (cadAutoridadeForm) cadAutoridadeForm.addEventListener('submit', (e) => handleSubmit(e, 'authority'));
});
