document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('denunciaForm');
  const steps = Array.from(form.querySelectorAll('.form-step'));
  const nextBtns = Array.from(form.querySelectorAll('.btn-proximo'));
  const prevBtns = Array.from(form.querySelectorAll('.btn-voltar'));
  const progressSteps = Array.from(document.querySelectorAll('.progress-steps li'));
  const termsCheckbox = document.querySelector('.denuncia__termos input[type="checkbox"]');
  let current = 0;

  function updateNextButtons() {
    const enabled = termsCheckbox ? termsCheckbox.checked : true;
    nextBtns.forEach(btn => {
      if (enabled) {
        btn.removeAttribute('disabled');
        btn.classList.remove('disabled');
      } else {
        btn.setAttribute('disabled', 'true');
        btn.classList.add('disabled');
      }
    });
  }

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('active', i === index));
    progressSteps.forEach((p, i) => p.classList.toggle('active', i <= index));
    
    // Atualizar barra de progresso começando com 25%
    const progress = document.querySelector('.progress');
    const progressBase = 25; // 25% inicial
    const remainingProgress = 75; // 75% restante para distribuir
    const progressPercent = progressBase + (index / (steps.length - 2)) * remainingProgress;
    progress.style.width = `${progressPercent}%`;
  }

  function validateStep(index) {
    const step = steps[index];
    const required = Array.from(step.querySelectorAll('[required]'));
    for (const el of required) {
      if (el.type === 'checkbox') {
        if (!el.checked) return { valid: false, field: el };
      } else if (el.type === 'file') {
        // ensure at least one file selected
        if (el.files.length === 0) return { valid: false, field: el };
      } else if (!el.value || el.value.trim() === '') {
        return { valid: false, field: el };
      }
    }
    return { valid: true, field: null };
  }

  nextBtns.forEach(btn => btn.addEventListener('click', () => {
    // global terms checkbox enforcement
    if (termsCheckbox && !termsCheckbox.checked) {
      alert('Você precisa concordar com os termos antes de prosseguir.');
      return;
    }
    const validation = validateStep(current);
    if (!validation.valid) {
      alert('Por favor, preencha os campos obrigatórios antes de prosseguir.');
      if (validation.field) validation.field.focus();
      return;
    }
    current = Math.min(current + 1, steps.length - 1);
    showStep(current);
  }));

  prevBtns.forEach(btn => btn.addEventListener('click', () => {
    current = Math.max(current - 1, 0);
    showStep(current);
  }));

  // Final submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // validate last step
    if (termsCheckbox && !termsCheckbox.checked) {
      alert('Você precisa concordar com os termos antes de enviar.');
      return;
    }
    const validation = validateStep(current);
    if (!validation.valid) {
      alert('Por favor, preencha os campos obrigatórios antes de enviar.');
      if (validation.field) validation.field.focus();
      return;
    }

    // collect data
    // Preparar informações dos arquivos
    const fileInput = document.getElementById('file');
    const arquivos = Array.from(fileInput.files).map(file => ({
      name: file.name,
      size: file.size
    }));

    // Validar que pelo menos um arquivo foi enviado
    if (arquivos.length === 0) {
      alert('Por favor, anexe pelo menos um arquivo como evidência.');
      return;
    }

    const payload = {
      endereco: document.getElementById('endereco').value.trim(),
      bairro: document.getElementById('bairro').value.trim(),
      tipo: document.querySelector('.denuncia__select').value.trim(),
      especie: document.getElementById('especie').value.trim(),
      condicao: document.getElementById('condicao').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
      autorNome: document.getElementById('nome-suspeito').value.trim(),
      outrasInfo: document.getElementById('outras-info').value.trim(),
      arquivos
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        // Mostrar mensagem de erro detalhada
        const errorMsg = data.error || 'Erro ao enviar denúncia';
        console.error('Erro ao enviar denúncia:', errorMsg);
        return alert(errorMsg);
      }
      // show final step if exists
      const final = document.getElementById('final-step');
      if (final) {
        steps.forEach(s => s.classList.remove('active'));
        final.classList.add('active');
        // optionally show protocolo
        const proto = final.querySelector('strong');
        if (proto) proto.textContent = data.report.protocolo;
      } else {
        alert('Denúncia enviada! Protocolo: ' + data.report.protocolo);
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      console.error('Erro de rede ao enviar denúncia:', err);
      alert('Erro de rede ao enviar denúncia. Verifique sua conexão e tente novamente.');
    }
  });

  // expose to the page
  showStep(current);
  // initialize next buttons state based on terms checkbox
  updateNextButtons();
  if (termsCheckbox) termsCheckbox.addEventListener('change', updateNextButtons);
});
