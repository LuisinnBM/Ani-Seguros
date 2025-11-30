# 📋 Regra de Negócio: Avanço de Etapas da Denúncia (Relação Mútua)

## 1. Definições de Perfis e Ações

### Perfil Usuário (Denunciante)
- **Ação Primária**: Criar a Denúncia (Etapa 1: CRIADA)
- **Ação Secundária**: Acompanhar o status em tempo real
- **Ação de Avanço Final**: Confirmar Solução (Etapa 3 → 4)

### Perfil Autoridade (Investigador/Solucionador)
- **Ação Primária de Avanço**: Botão "Solucionar" (Etapa 1 → 2)
- **Ação Secundária de Avanço**: Botão "Avançar Etapa" (Etapa 2 → 3)
- **Ação de Conclusão**: Confirmação automática (Etapa 4)

---

## 2. Fluxo de Etapas da Denúncia (Status)

| Etapa | Nome da Etapa | Status Interno | Descrição |
|-------|---------------|---|-----------|
| 1 | Denúncia Criada | `CRIADA` | Denúncia visível para ambos os perfis. Aguardando ação inicial da Autoridade. |
| 2 | Em Análise | `EM_ANALISE` | Denúncia sob a responsabilidade da Autoridade. Usuário acompanha. |
| 3 | Em Investigação | `EM_INVESTIGACAO` | Autoridade continua investigando. |
| 4 | Aguardando Inspeção | `AGUARDANDO_INSPECAO` | Autoridade finalizou investigação, aguarda confirmação do usuário. |
| 5 | Concluída | `CONCLUIDA` | Denúncia finalizada no sistema. |

---

## 3. Regra de Avanço (O Gatilho Mútuo)

A regra deve garantir que ambos os perfis vejam a mesma etapa, pois se trata da mesma denúncia.

### Gatilho de Avanço para Etapa 2 (Etapa 1 → 2)

**Condição**: O Perfil Autoridade clica no Botão "Solucionar" (na Etapa 1)

**Ação**: 
- O status da Denúncia é atualizado de `CRIADA` para `EM_ANALISE`
- A etapa avança de 1 para 2
- A autoridade é associada à denúncia

**Resultado Mútuo**: 
- Tanto para o Perfil Usuário quanto para o Perfil Autoridade, a Denúncia aparece como Etapa 2
- O botão "Solucionar" desaparece
- Novo botão "Avançar Etapa" aparece para a Autoridade

**Nota**: Este botão só deve estar visível e ativo para o Perfil Autoridade na Etapa 1.

**Endpoint**: `POST /api/reports/:id/aceitar`

---

### Gatilho de Avanço para Etapa 3 (Etapa 2 → 3)

**Condição**: O Perfil Autoridade clica no Botão "Avançar Etapa" (na Etapa 2)

**Ação**: 
- O status da Denúncia é atualizado de `EM_ANALISE` para `EM_INVESTIGACAO`
- A etapa avança de 2 para 3

**Resultado Mútuo**: 
- Ambos os perfis veem a denúncia na Etapa 3
- A Autoridade pode continuar adicionando evidências e comentários

**Endpoint**: `POST /api/reports/:id/avancar-etapa`

---

### Gatilho de Avanço para Etapa 4 (Etapa 3 → 4)

**Condição**: O Perfil Autoridade clica no Botão "Avançar Etapa" novamente (na Etapa 3)

**Ação**: 
- O status da Denúncia é atualizado de `EM_INVESTIGACAO` para `AGUARDANDO_INSPECAO`
- A etapa avança de 3 para 4
- Um botão "Confirmar Solução" aparece para o Usuário

**Resultado Mútuo**: 
- Ambos os perfis veem a denúncia na Etapa 4
- O Usuário recebe notificação para confirmar a solução

**Endpoint**: `POST /api/reports/:id/avancar-etapa`

---

### Gatilho de Avanço para Etapa 5 (Etapa 4 → 5) - CONCLUSÃO

**Condição**: O Perfil Usuário clica no Botão "Confirmar Solução" (na Etapa 4)

**Ação**: 
- O status da Denúncia é atualizado de `AGUARDANDO_INSPECAO` para `CONCLUIDA`
- A etapa avança de 4 para 5
- A denúncia é movida para o Histórico

**Resultado Mútuo**: 
- Ambos os perfis veem a denúncia como "Concluída"
- A denúncia desaparece dos painéis ativos
- Ambos podem visualizá-la no Histórico

**Endpoint**: `POST /api/reports/:id/avancar-etapa`

---

## 4. Regras Adicionais de Mutualidade

### ✓ Sincronização em Tempo Real
- Quando qualquer um dos perfis atualiza o status, a mudança é refletida imediatamente para o outro
- O `lastUpdateAt` é atualizado em cada mudança
- Um histórico detalhado registra todas as ações

### ✓ Permissões por Etapa

| Ação | Usuário | Autoridade | Etapa |
|------|---------|-----------|-------|
| Criar | ✓ | ✗ | 1 |
| Solucionar | ✗ | ✓ | 1 |
| Avançar Etapa | ✗ | ✓ | 2, 3 |
| Confirmar Solução | ✓ | ✗ | 4 |
| Adicionar Comentários | ✓ | ✓ | Qualquer |
| Adicionar Evidências | ✓ | ✓ | Qualquer |

### ✓ Bloqueios de Avanço
- Uma denúncia não pode pular etapas
- Uma autoridade não pode aceitar uma denúncia já aceita por outra
- O usuário não pode confirmar solução se a autoridade não tiver chegado à Etapa 4

### ✓ Histórico Completo
Cada ação é registrada com:
- `data`: Timestamp da ação
- `tipo`: Tipo de ação (CRIACAO, AVANCAR_ETAPA, COMENTARIO, etc)
- `autor`: ID do usuário que realizou a ação
- `descricao`: Descrição detalhada da ação

---

## 5. Fluxograma Visual

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário cria Denúncia (Etapa 1: CRIADA)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Autoridade clica "Solucionar"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Etapa 2: EM_ANALISE - Autoridade inicia análise            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Autoridade clica "Avançar Etapa"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Etapa 3: EM_INVESTIGACAO - Autoridade investiga            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Autoridade clica "Avançar Etapa"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Etapa 4: AGUARDANDO_INSPECAO - Aguarda confirmação         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Usuário clica "Confirmar Solução"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Etapa 5: CONCLUIDA - Denúncia finalizada                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Implementação Técnica

### Transições Permitidas (no código)

```javascript
const transicoes = {
  'CRIADA': { proximoStatus: 'EM_ANALISE', proximaEtapa: 2 },
  'EM_ANALISE': { proximoStatus: 'EM_INVESTIGACAO', proximaEtapa: 3 },
  'EM_INVESTIGACAO': { proximoStatus: 'AGUARDANDO_INSPECAO', proximaEtapa: 4 },
  'AGUARDANDO_INSPECAO': { proximoStatus: 'CONCLUIDA', proximaEtapa: 5 }
};
```

### Validações Obrigatórias

1. ✓ Verificar se o usuário tem permissão para a ação
2. ✓ Verificar se a denúncia está no status correto
3. ✓ Registrar a ação no histórico
4. ✓ Atualizar `lastUpdateAt`
5. ✓ Retornar o status atualizado para ambos os perfis

---

## 7. Exemplos de Casos de Uso

### Caso 1: Denúncia de Abandono de Gato
```
1. Usuário "João" cria denúncia de abandono
   → Status: CRIADA, Etapa: 1

2. Autoridade "Maria" clica "Solucionar"
   → Status: EM_ANALISE, Etapa: 2
   → João e Maria veem a mesma etapa

3. Maria clica "Avançar Etapa"
   → Status: EM_INVESTIGACAO, Etapa: 3
   → Ambos veem a etapa 3

4. Maria clica "Avançar Etapa" novamente
   → Status: AGUARDANDO_INSPECAO, Etapa: 4
   → João recebe notificação para confirmar

5. João clica "Confirmar Solução"
   → Status: CONCLUIDA, Etapa: 5
   → Denúncia vai para Histórico
```

### Caso 2: Rejeição de Avanço Inválido
```
1. Usuário tenta clicar "Avançar Etapa" na Etapa 1
   → ERRO: Usuário não tem permissão

2. Autoridade tenta aceitar denúncia já aceita
   → ERRO: Denúncia já está sendo tratada

3. Usuário tenta confirmar solução na Etapa 2
   → ERRO: A denúncia não chegou à Etapa 4 ainda
```

---

## 8. Benefícios da Regra

✅ **Transparência**: Ambos os perfis veem o mesmo status em tempo real
✅ **Segurança**: Apenas o perfil correto pode realizar cada ação
✅ **Rastreabilidade**: Histórico completo de todas as ações
✅ **Integridade**: Não permite pulos de etapas ou ações duplicadas
✅ **UX Melhorada**: Botões aparecem/desaparecem conforme a etapa
✅ **Escalabilidade**: Sistema pronto para novos status ou etapas

---

## Fim da Regra de Negócio
