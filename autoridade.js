document.addEventListener('DOMContentLoaded', () => {
    const denunciasDisponiveis = document.getElementById('denunciasDisponiveis');
    const denunciaAtual = document.getElementById('denunciaAtual');
    let currentAuthority = null;

    // Carregar denúncias
    async function loadDenuncias() {
        try {
            window.uiHelpers.showLoading('Carregando denúncias...');
            
            const data = await window.paginationModule.loadPage(1);

            // Filtrar denúncias em aberto (status CRIADA) e sem autoridade atribuída
            const denunciasEmAberto = data.reports.filter(d => 
                !d.autoridade && 
                (d.status === 'CRIADA' || !d.status)
            );

            // Buscar denúncias desta autoridade separadas por status
            // Denúncias em andamento: etapas 2 a 5
            const denunciasDaAutoridade = data.reports.filter(d => 
                d.autoridade && 
                d.autoridade.id === currentAuthority.id &&
                d.etapa >= 2 && d.etapa < 6  // Em andamento: etapas 2 a 5
            );

            // Denúncias concluídas: etapa 6
            const denunciasConcluidas = data.reports.filter(d => 
                d.autoridade && 
                d.autoridade.id === currentAuthority.id &&
                d.etapa === 6  // Concluídas
            );

            // Configurar atualização automática a cada 15 segundos
            setTimeout(loadDenuncias, 15000);

            renderDenunciasDisponiveis(denunciasEmAberto);
            renderDenunciaEmAndamento(denunciasDaAutoridade);
            renderDenunciasConcluidas(denunciasConcluidas);
            
            window.uiHelpers.hideLoading();
        } catch (error) {
            window.uiHelpers.handleApiError(error);
        }
    }

    // Renderizar denúncias disponíveis
    function renderDenunciasDisponiveis(denuncias) {
        if (!denuncias || denuncias.length === 0) {
            denunciasDisponiveis.innerHTML = '<p>Nenhuma denúncia disponível no momento.</p>';
            return;
        }

        denunciasDisponiveis.innerHTML = denuncias.map(denuncia => `
            <div class="atualizacao__item">
                <img src="src/images/icon-denuncia.png" alt="Ícone denúncia" class="atualizacao__icone">
                <div class="atualizacao__conteudo">
                    <h3>Protocolo: ${denuncia.protocolo}</h3>
                    <p><strong>Denunciante:</strong> ${denuncia.denuncianteNome || 'Anônimo'}</p>
                    <p><strong>Local:</strong> ${denuncia.endereco}, ${denuncia.bairro}</p>
                    <p><strong>Tipo:</strong> ${formatTipo(denuncia.tipo)}</p>
                    <p><strong>Animal:</strong> ${formatEspecie(denuncia.especie)}</p>
                    <p><strong>Condição:</strong> ${formatCondicao(denuncia.condicao)}</p>
                    <p class="destaque">Data: ${new Date(denuncia.createdAt).toLocaleDateString('pt-BR')}</p>
                    <button onclick="solucionarDenuncia('${denuncia.id}')" class="card__botao">
                        Solucionar Denúncia
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Renderizar denúncias da autoridade
    function renderDenunciaEmAndamento(denuncias) {
        if (!denuncias || denuncias.length === 0) {
            denunciaAtual.innerHTML = `
                <div class="card">
                    <h3>Nenhuma denúncia sob sua responsabilidade</h3>
                    <p>Selecione uma denúncia disponível para começar.</p>
                </div>`;
            return;
        }

        denunciaAtual.innerHTML = denuncias.map(denuncia => {
            const etapaAtual = getEtapaAtual(denuncia);
            
            return `
                <div class="card" style="margin-bottom: 20px;">
                    <h3>Protocolo: ${denuncia.protocolo}</h3>
                    <p><strong>Local:</strong> ${denuncia.endereco}, ${denuncia.bairro}</p>
                    <p><strong>Tipo:</strong> ${formatTipo(denuncia.tipo)}</p>
                    <p><strong>Animal:</strong> ${formatEspecie(denuncia.especie)}</p>
                    <p><strong>Condição:</strong> ${formatCondicao(denuncia.condicao)}</p>
                    <p><strong>Status:</strong> <span style="color: ${getStatusColor(denuncia.status)}">${formatStatus(denuncia.status)}</span></p>
                    <div class="etapas-progresso">
                        <div class="etapa ${etapaAtual >= 1 ? 'completa' : ''}">
                            <span class="etapa-numero">1</span>
                            <p>Registrada</p>
                        </div>
                        <div class="etapa ${etapaAtual >= 2 ? 'completa' : ''}">
                            <span class="etapa-numero">2</span>
                            <p>Em Análise</p>
                        </div>
                        <div class="etapa ${etapaAtual >= 3 ? 'completa' : ''}">
                            <span class="etapa-numero">3</span>
                            <p>Em Investigação</p>
                        </div>
                        <div class="etapa ${etapaAtual >= 4 ? 'completa' : ''}">
                            <span class="etapa-numero">4</span>
                            <p>Aguardando Inspeção</p>
                        </div>
                        <div class="etapa ${etapaAtual >= 5 ? 'completa' : ''}">
                            <span class="etapa-numero">5</span>
                            <p>Resolvida</p>
                        </div>
                        <div class="etapa ${etapaAtual >= 6 ? 'completa' : ''}">
                            <span class="etapa-numero">6</span>
                            <p>Concluída</p>
                        </div>
                    </div>
                    ${getBotoesAcao(denuncia, etapaAtual)}
                    ${renderComentarios(denuncia)}
                </div>
            `;
        }).join('');
    }

    // Renderizar denúncias concluídas
    function renderDenunciasConcluidas(denuncias) {
        const historicoContainer = document.getElementById('denunciasConcluidas');
        if (!historicoContainer) return; // Container não existe no HTML ainda

        if (!denuncias || denuncias.length === 0) {
            historicoContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma denúncia concluída ainda.</p>';
            return;
        }

        historicoContainer.innerHTML = denuncias.map(denuncia => {
            const etapaAtual = getEtapaAtual(denuncia);
            
            return `
                <div class="card" style="margin-bottom: 20px; opacity: 0.85; background: #f5f5f5;">
                    <h3>Protocolo: ${denuncia.protocolo}</h3>
                    <p><strong>Local:</strong> ${denuncia.endereco}, ${denuncia.bairro}</p>
                    <p><strong>Tipo:</strong> ${formatTipo(denuncia.tipo)}</p>
                    <p><strong>Animal:</strong> ${formatEspecie(denuncia.especie)}</p>
                    <p><strong>Condição:</strong> ${formatCondicao(denuncia.condicao)}</p>
                    <p><strong>Status:</strong> <span style="color: ${getStatusColor(denuncia.status)}; font-weight: bold;">${formatStatus(denuncia.status)}</span></p>
                    <p><strong>Concluída em:</strong> ${denuncia.concludedAt ? new Date(denuncia.concludedAt).toLocaleString('pt-BR') : 'N/A'}</p>
                    <div class="etapas-progresso">
                        <div class="etapa completa">
                            <span class="etapa-numero">✓</span>
                            <p>Concluída</p>
                        </div>
                    </div>
                    ${renderComentarios(denuncia)}
                </div>
            `;
        }).join('');
    }
    function formatTipo(tipo) {
        const tipos = {
            violencia_fisica: 'Violência Física',
            negligencia: 'Negligência',
            abandono: 'Abandono',
            maus_tratos: 'Maus-tratos',
            comercio_ilegal: 'Comércio Ilegal',
            outro: 'Outros'
        };
        return tipos[tipo] || tipo;
    }

    // Formatar espécie
    function formatEspecie(especie) {
        const especies = {
            cao: 'Cão',
            gato: 'Gato',
            ave: 'Ave',
            outros: 'Outros'
        };
        return especies[especie] || especie;
    }

    // Formatar condição
    function formatCondicao(condicao) {
        const condicoes = {
            saudavel: 'Saudável',
            ferido: 'Ferido',
            desnutrido: 'Desnutrido',
            em_risco: 'Em risco de vida'
        };
        return condicoes[condicao] || condicao;
    }

    // Formatar status
    function formatStatus(status) {
        const statusMap = {
            'CRIADA': 'Denúncia Registrada',
            'EM_ANALISE': 'Em Análise',
            'EM_INVESTIGACAO': 'Em Investigação',
            'AGUARDANDO_INSPECAO': 'Aguardando Inspeção',
            'RESOLVIDA': 'Resolvida',
            'CONCLUIDA': 'Concluída',
            'ARQUIVADA': 'Arquivada'
        };
        return statusMap[status] || status;
    }

    // Obter etapa atual
    function getEtapaAtual(denuncia) {
        return denuncia.etapa || 1;
    }

    // Funções auxiliares para a interface
    function getStatusColor(status) {
        const colors = {
            'CRIADA': '#7DB283',
            'EM_ANALISE': '#f1c40f',
            'EM_INVESTIGACAO': '#e67e22',
            'AGUARDANDO_INSPECAO': '#9b59b6',
            'RESOLVIDA': '#2ecc71',
            'CONCLUIDA': '#27ae60',
            'ARQUIVADA': '#95a5a6'
        };
        return colors[status] || '#bdc3c7';
    }

    function renderComentarios(denuncia) {
        if (!denuncia.comentarios || denuncia.comentarios.length === 0) return '';

        return `
            <div class="comentarios" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0;">Últimos Comentários</h4>
                ${denuncia.comentarios.slice(-3).map(c => `
                    <div class="comentario" style="margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #eee;">
                        <strong>${c.autorEmail}</strong>
                        <span style="color: #666; font-size: 0.9em;"> - ${new Date(c.data).toLocaleString()}</span>
                        <p style="margin: 4px 0;">${c.texto}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Obter botões de ação apropriados para o estado atual
    function getBotoesAcao(denuncia, etapa) {
        const botoes = [];

        // Normalizar status para maiúsculo para comparação
        const statusNormalizado = (denuncia.status || '').toUpperCase();

        // Botão "Avançar Etapa" aparece até etapa 5 (RESOLVIDA)
        // A etapa 6 (CONCLUIDA) é a final
        if (['EM_ANALISE', 'EM_INVESTIGACAO', 'AGUARDANDO_INSPECAO', 'RESOLVIDA'].includes(statusNormalizado)) {
            const proximoEtapa = {
                'EM_ANALISE': '3 (Em Investigação)',
                'EM_INVESTIGACAO': '4 (Aguardando Inspeção)',
                'AGUARDANDO_INSPECAO': '5 (Resolvida)',
                'RESOLVIDA': '6 (Concluída - Final)'
            }[statusNormalizado];

            botoes.push(`
                <button onclick="avancarEtapa('${denuncia.id}', '${statusNormalizado}')" class="card__botao" style="margin-right: 12px; margin-bottom: 8px; background: #7DB283; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;" title="Avançar para etapa ${proximoEtapa}">
                    Avançar Etapa
                </button>
            `);
        }

        botoes.push(`
            <button onclick="adicionarComentario('${denuncia.id}')" class="card__botao" style="margin-right: 12px; margin-bottom: 8px; background: #9b59b6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                Adicionar Comentário
            </button>
        `);

        // Botão de prioridade aparece em todas as etapas (não há conclusão)
        botoes.push(`
            <button onclick="alterarPrioridade('${denuncia.id}')" class="card__botao" style="margin-right: 12px; margin-bottom: 8px; background: #e67e22; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                Prioridade: ${denuncia.prioridade || 'MEDIA'}
            </button>
        `);

        return `
            <div class="botoes-acao" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">
                ${botoes.join('')}
            </div>
        `;
    }

    // Funções de ação
    window.solucionarDenuncia = async (id) => {
        try {
            await window.apiHelpers.fetchAPI(`/api/reports/${id}/aceitar`, {
                method: 'POST'
            });
            
            await loadDenuncias();
            alert('Denúncia aceita com sucesso! Você pode começar a investigação.');
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
        }
    };

    window.avancarEtapa = async (id, statusAtual) => {
        try {
            // Confirmar com o usuário antes de avançar
            if (!confirm('Tem certeza que deseja avançar para a próxima etapa? Esta ação não pode ser desfeita.')) {
                return;
            }

            // O servidor determina o próximo status automaticamente
            const resultado = await window.apiHelpers.fetchAPI(`/api/reports/${id}/avancar-etapa`, {
                method: 'POST'
            });
            
            if (resultado.ok) {
                await loadDenuncias();
                alert(`Etapa avançada com sucesso! Denúncia agora está em: ${resultado.report.status}`);
            } else {
                alert(resultado.error || 'Erro ao avançar etapa');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao avançar etapa');
        }
    };

    window.adicionarComentario = async (id) => {
        try {
            const comentario = prompt('Digite seu comentário:');
            if (!comentario || !comentario.trim()) return;

            await window.apiHelpers.fetchAPI(`/api/reports/${id}/comentar`, {
                method: 'POST',
                body: JSON.stringify({ comentario: comentario.trim() })
            });

            await loadDenuncias();
            alert('Comentário adicionado com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
        }
    };

    window.alterarPrioridade = async (id) => {
        try {
            const prioridades = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
            const novaPrioridade = prompt('Selecione a nova prioridade: ' + prioridades.join(', '));
            
            if (!novaPrioridade || !prioridades.includes(novaPrioridade.toUpperCase())) {
                return;
            }

            await window.apiHelpers.fetchAPI(`/api/reports/${id}/prioridade`, {
                method: 'POST',
                body: JSON.stringify({ prioridade: novaPrioridade.toUpperCase() })
            });

            await loadDenuncias();
            alert('Prioridade atualizada com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
        }
    };

    // Removidas funções de avançar etapa e concluir denúncia pois agora
    // o avanço é feito automaticamente através dos logins correlacionados

    // Verificar autoridade atual e carregar denúncias
    async function init() {
        try {
            const res = await fetch('/api/me');
            if (!res.ok) {
                window.location.href = 'login.html';
                return;
            }
            const data = await res.json();
            if (data.user.role !== 'authority') {
                window.location.href = 'dashboard.html';
                return;
            }
            currentAuthority = data.user;
            loadDenuncias();
        } catch (error) {
            console.error('Erro:', error);
            window.location.href = 'login.html';
        }
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao fazer logout');
        }
    });

    // Inicializar controles de paginação
    document.getElementById('searchControlsContainer').appendChild(window.paginationModule.searchControls);
    document.getElementById('paginationControlsContainer').appendChild(window.paginationModule.paginationControls);

    // Inicializar
    init();
});