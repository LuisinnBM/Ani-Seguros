document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('meus-relatorios');
  const updatesList = document.querySelector('.atualizacoes__lista');
  if (!container || !updatesList) return;

  async function sendFeedback(reportId, message) {
    const res = await fetch(`/api/reports/${reportId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: message })
    });
    return res.ok;
  }

  function renderUpdates(reports) {
    // Clear previous items
    updatesList.innerHTML = '';

    // Mostrar apenas as 3 denúncias mais recentes EM ANDAMENTO (não concluídas)
    const active = (reports || [])
      .filter(d => d.etapa < 6)  // Apenas denúncias em andamento
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 3);  // Apenas as 3 mais recentes
    
    function getStatusInfo(status) {
      const statusMap = {
        'CRIADA': {
          title: 'Denúncia Registrada',
          text: 'Aguardando análise inicial pela autoridade',
          etapa: 1,
          cor: '#7DB283'
        },
        'EM_ANALISE': {
          title: 'Em Análise',
          text: 'Autoridade está avaliando a denúncia',
          etapa: 2,
          cor: '#f1c40f'
        },
        'EM_INVESTIGACAO': {
          title: 'Em Investigação',
          text: 'Equipe está trabalhando no caso',
          etapa: 3,
          cor: '#e67e22'
        },
        'AGUARDANDO_INSPECAO': {
          title: 'Aguardando Inspeção',
          text: 'Equipe designada para verificação local',
          etapa: 4,
          cor: '#9b59b6'
        },
        'RESOLVIDA': {
          title: 'Resolvida',
          text: 'Problema foi resolvido',
          etapa: 5,
          cor: '#27ae60'
        },
        'CONCLUIDA': {
          title: 'Concluída',
          text: 'Denúncia finalizada e arquivo fechado',
          etapa: 6,
          cor: '#16a085'
        }
      };
      return statusMap[status] || { title: 'Status Desconhecido', text: 'Status não reconhecido', etapa: 0 };
    }

    if (!active || active.length === 0) {
      // Single neutral block when there are no active reports
      const li = document.createElement('li');
      li.className = 'atualizacao__item';
      li.style = 'align-items:flex-start;';

      const conteudo = document.createElement('div');
      conteudo.className = 'atualizacao__conteudo';
      const h3 = document.createElement('h3');
      h3.textContent = 'Nenhuma Denúncia Ativa';
      const p = document.createElement('p');
      p.textContent = 'No momento você não possui denúncias ativas.';
      conteudo.appendChild(h3);
      conteudo.appendChild(p);

      li.appendChild(conteudo);
      updatesList.appendChild(li);
      return;
    }

    // For each active report, render a compact update item (no green blocks/icons).
    active.forEach(r => {
      const li = document.createElement('li');
      li.className = 'atualizacao__item';
      li.style = 'align-items:flex-start;';

      const conteudo = document.createElement('div');
      conteudo.className = 'atualizacao__conteudo';
      const statusInfo = getStatusInfo(r.status);
      const progressPercent = (statusInfo.etapa / 6) * 100;

      // Criar barra de progresso
      const progressBar = document.createElement('div');
      progressBar.className = 'denuncia-progresso';
      progressBar.innerHTML = `
        <div class="progresso-barra">
          <div class="progresso-preenchimento" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progresso-etapa">Etapa ${statusInfo.etapa}/6</div>
      `;
      conteudo.appendChild(progressBar);

      const title = statusInfo.title;
      const text = `${statusInfo.text} (Protocolo: ${r.protocolo})`;

      const h3 = document.createElement('h3'); h3.textContent = title;
      const p = document.createElement('p'); p.textContent = text;
      conteudo.appendChild(h3);
      conteudo.appendChild(p);

      // no evaluate button for 'Concluída' in updates — evaluation only in 'Terminada' cards

      li.appendChild(conteudo);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'atualizacao__data';
      timeSpan.textContent = new Date(r.createdAt || Date.now()).toLocaleString();
      li.appendChild(timeSpan);

      updatesList.appendChild(li);
    });
  }

  function renderCards(reports) {
    container.innerHTML = '';
    if (!reports || reports.length === 0) {
      container.innerHTML = '<p style="color: #888; font-style: italic;">Você ainda não tem denúncias concluídas.</p>';
      return;
    }

    // Filtrar APENAS denúncias concluídas (etapa === 6) do usuário atual e pegar as 3 mais recentes
    const minhasDenunciasConcluidas = reports
      .filter(r => r.createdBy === window.userId && r.etapa === 6)
      .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
      .slice(0, 3);

    if (minhasDenunciasConcluidas.length === 0) {
      container.innerHTML = '<p style="color: #888; font-style: italic;">Você ainda não tem denúncias concluídas.</p>';
      return;
    }

    // Renderizar as 3 últimas denúncias concluídas
    minhasDenunciasConcluidas.forEach(r => {
      const statusInfo = getStatusInfo(r.status);
      const tipoDisplay = r.tipo ? r.tipo.replace(/_/g, ' ').charAt(0).toUpperCase() + r.tipo.replace(/_/g, ' ').slice(1) : 'N/A';
      const progressPercent = (statusInfo.etapa / 6) * 100;

      const card = document.createElement('div');
      card.className = 'card-denuncia';
      card.style = `border-left: 4px solid ${statusInfo.cor}; padding:12px; margin-bottom:12px; border-radius:8px; background:#f8fdf6;`;
      
      card.innerHTML = `
        <strong style="color: ${statusInfo.cor};">${r.protocolo}</strong> — <em>${statusInfo.title}</em>
        <p><strong>Tipo:</strong> ${tipoDisplay} | <strong>Bairro:</strong> ${r.bairro || '-'} | <strong>Espécie:</strong> ${r.especie || '-'}</p>
        <p>${r.descricao ? r.descricao.substring(0,100) : ''}</p>
        <div class="denuncia-progresso">
          <div class="progresso-barra">
            <div class="progresso-preenchimento" style="width: ${progressPercent}%; background-color: ${statusInfo.cor};"></div>
          </div>
          <div class="progresso-etapa" style="color: ${statusInfo.cor}; font-weight: bold;">Etapa ${statusInfo.etapa}/6</div>
        </div>
      `;

      // Apenas usuários normais podem avaliar denúncias que atingiram etapa 6 (concluídas) e ainda não avaliaram
      if (r.etapa === 6 && !window.isAuthority && r.createdBy === window.userId && !r.feedback) {
        const btn = document.createElement('button');
        btn.textContent = 'Avaliar';
        btn.style = 'margin-top:8px;padding:8px 12px;border-radius:6px;border:none;background:#659c6b;color:white;cursor:pointer;';
        btn.addEventListener('click', async () => {
          const feedback = prompt('Envie seu feedback sobre esta denúncia:');
          if (!feedback || feedback.trim() === '') {
            return alert('Feedback não pode ser vazio.');
          }
          try {
            const ok = await sendFeedback(r.id, feedback);
            if (ok) {
              alert('Feedback enviado com sucesso!');
              loadReports();
            } else {
              alert('Erro ao enviar feedback.');
            }
          } catch (err) {
            console.error('Erro ao enviar feedback:', err);
            alert('Erro ao enviar feedback: ' + err.message);
          }
        });
        card.appendChild(btn);
      }

      container.appendChild(card);
    });
  }

  function getStatusInfo(status) {
    const statusMap = {
      'CRIADA': { title: 'Criada', etapa: 1, cor: '#7DB283' },
      'EM_ANALISE': { title: 'Em Análise', etapa: 2, cor: '#f1c40f' },
      'EM_INVESTIGACAO': { title: 'Em Investigação', etapa: 3, cor: '#e67e22' },
      'AGUARDANDO_INSPECAO': { title: 'Aguardando Inspeção', etapa: 4, cor: '#9b59b6' },
      'RESOLVIDA': { title: 'Resolvida', etapa: 5, cor: '#27ae60' },
      'CONCLUIDA': { title: 'Concluída', etapa: 6, cor: '#16a085' }
    };
    return statusMap[status] || { title: 'Desconhecido', etapa: 0, cor: '#95a5a6' };
  }

  function renderAuthButtons(card, report) {
    if (!window.isAuthority) return;

    // NÃO mostrar botões para denúncias concluídas
    const etapasAndamento = ['CRIADA', 'EM_ANALISE', 'EM_INVESTIGACAO', 'AGUARDANDO_INSPECAO'];
    if (!etapasAndamento.includes(report.status)) {
      return; // Sair se denúncia não está em andamento
    }

    // Botão de aceitar para denúncias novas
    if (report.status === 'CRIADA') {
      const btnAceitar = document.createElement('button');
      btnAceitar.textContent = 'Aceitar Denúncia';
      btnAceitar.className = 'btn-action';
      btnAceitar.style = 'margin:8px 4px;padding:8px 12px;border-radius:6px;border:none;background:#2ecc71;color:white;cursor:pointer;';
      btnAceitar.onclick = async () => {
        try {
          const res = await fetch(`/api/reports/${report.id}/aceitar`, { method: 'POST' });
          if (!res.ok) throw new Error('Falha ao aceitar denúncia');
          loadReports();
        } catch (err) {
          alert(err.message);
        }
      };
      card.appendChild(btnAceitar);
    }

    // Botões adicionais para denúncias que a autoridade é responsável
    if (report.autoridade?.id === window.userId) {
      const divBotoes = document.createElement('div');
      divBotoes.style = 'margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;';

      // Botão de avançar etapa
      if (['EM_ANALISE', 'EM_INVESTIGACAO', 'AGUARDANDO_INSPECAO'].includes(report.status)) {
        const btnAvancar = document.createElement('button');
        btnAvancar.textContent = 'Avançar Etapa';
        btnAvancar.className = 'btn-action';
        btnAvancar.style = 'padding:8px 12px;margin-right:8px;border-radius:6px;border:none;background:#7DB283;color:white;cursor:pointer;';
        btnAvancar.onclick = async () => {
          try {
            if (!confirm('Tem certeza que deseja avançar para a próxima etapa?')) {
              return;
            }

            const res = await fetch(`/api/reports/${report.id}/avancar-etapa`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            if (!res.ok) throw new Error('Falha ao avançar etapa');
            loadReports();
          } catch (err) {
            alert(err.message);
          }
        };
        divBotoes.appendChild(btnAvancar);
      }

      // Botão de prioridade
      const btnPrioridade = document.createElement('button');
      btnPrioridade.textContent = `Prioridade: ${report.prioridade || 'MEDIA'}`;
      btnPrioridade.className = 'btn-action';
      btnPrioridade.style = 'padding:8px 12px;margin-right:8px;border-radius:6px;border:none;background:#e67e22;color:white;cursor:pointer;';
      btnPrioridade.onclick = async () => {
        const prioridades = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
        const novaPrioridade = prompt('Selecione a nova prioridade: ' + prioridades.join(', '));
        if (novaPrioridade && prioridades.includes(novaPrioridade.toUpperCase())) {
          try {
            const res = await fetch(`/api/reports/${report.id}/prioridade`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prioridade: novaPrioridade.toUpperCase() })
            });
            if (!res.ok) throw new Error('Falha ao atualizar prioridade');
            loadReports();
          } catch (err) {
            alert(err.message);
          }
        }
      };
      divBotoes.appendChild(btnPrioridade);

      // Botão de comentário
      const btnComentar = document.createElement('button');
      btnComentar.textContent = 'Adicionar Comentário';
      btnComentar.className = 'btn-action';
      btnComentar.style = 'padding:8px 12px;border-radius:6px;border:none;background:#9b59b6;color:white;cursor:pointer;';
      btnComentar.onclick = async () => {
        const comentario = prompt('Digite seu comentário:');
        if (comentario && comentario.trim()) {
          try {
            const res = await fetch(`/api/reports/${report.id}/comentar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ comentario: comentario.trim() })
            });
            if (!res.ok) throw new Error('Falha ao adicionar comentário');
            loadReports();
          } catch (err) {
            alert(err.message);
          }
        }
      };
      divBotoes.appendChild(btnComentar);

      card.appendChild(divBotoes);
    }
  }

  async function loadReports() {
    try {
      // Verificar tipo de usuário
      const userRes = await fetch('/api/me');
      if (!userRes.ok) {
        window.location.href = 'login.html';
        return;
      }
      const userData = await userRes.json();
      window.isAuthority = userData.user.role === 'authority';
      window.userId = userData.user.id;

      // Carregar denúncias
      const res = await fetch('/api/reports');
      if (!res.ok) {
        container.innerHTML = '<p>Não foi possível carregar suas denúncias.</p>';
        return;
      }
      const data = await res.json();
      const reports = data.reports || [];

      // Separar denúncias em andamento
      const denunciasEmAndamento = reports.filter(d => d.etapa >= 1 && d.etapa < 6);

      // Renderizar denúncias em andamento com barra de progresso
      renderUpdates(denunciasEmAndamento);
      
      // Renderizar as 3 últimas denúncias do usuário
      renderCards(reports);

      // Atualizar automaticamente a cada 10 segundos
      setTimeout(loadReports, 10000);
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p>Erro ao carregar denúncias.</p>';
    }
  }

  loadReports();
});
 
