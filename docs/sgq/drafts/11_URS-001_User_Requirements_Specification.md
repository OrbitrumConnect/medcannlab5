# URS-001 — User Requirements Specification

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.2.1 + IEC 62366-1 §5.1

---

## 1. Objetivo

Catalogar as necessidades dos usuários do MedCannLab 3.0 com identificação única para rastreabilidade bidirecional via Traceability Matrix (TRM-001).

## 2. Convenção de IDs

```
URS-<PAPEL>-<NN>
```

Onde `<PAPEL>` ∈ { **MED** (médico) / **PAC** (paciente) / **ALU** (aluno) / **ADM** (administrador) / **GLB** (transversal) }

Cada URS rastreia para SRS, RSK, CTL, TST e EVD via TRM-001.

## 3. Papéis e contagem empírica (29/05/2026 via PAT)

| Papel | DB enum | Contagem real |
|---|---|---:|
| Médico profissional | `type='professional'` | 11 |
| Paciente | `type='patient'` | 31 |
| Administrador | `type='admin'` | 5 |
| Aluno | `type='aluno'` | **0** (papel especificado, sem usuário ainda) |

## 4. Requisitos do MÉDICO (URS-MED-XX)

### URS-MED-01 — Cadastro de paciente externo offline
**Necessidade:** Médico precisa cadastrar paciente que ainda não baixou o app (idoso, terceiro responsável).
**Justificativa:** CFM 2.314 + Manual MedCannLab permitem prontuário sem login app.
**Memória:** `feedback_padrao_orfaos_public_users_validos_29_05` (Nível 1)

### URS-MED-02 — Conduzir AEC com paciente
**Necessidade:** Conduzir Avaliação Estruturada com Cannabis em sessão estruturada de 13+ fases determinísticas.
**Justificativa:** Método AEC criado por Dr. Ricardo Valença, implementado em FSM.

### URS-MED-03 — Revisar relatório gerado pela IA antes de devolver ao paciente
**Necessidade:** Auditar conteúdo antes de assinar e compartilhar.
**Justificativa:** Lock V1.9.388-A.3 — médico no loop em TODA decisão.

### URS-MED-04 — Aplicar múltiplas racionalidades médicas
**Necessidade:** Gerar análise sob ótica Biomédica, MTC, Ayurvédica, Homeopática ou Integrativa.
**Justificativa:** Modelo de cuidado integrativo MedCannLab.

### URS-MED-05 — Assinar prescrição com ICP-Brasil PBAD AD-RB
**Necessidade:** Emitir prescrição juridicamente vinculante e validável em Portal ITI.
**Justificativa:** CFM 2.381 (prescrição digital) + lock V1.9.299.

### URS-MED-06 — Visualizar AECs interrompidas órfãs com decisão
**Necessidade:** Saber quais pacientes abandonaram AEC e decidir (invalidar com motivo / marcar concluída).
**Justificativa:** Auditabilidade LGPD + workflow operacional.
**Implementado:** V1.9.500 InterruptedAECsCard.

### URS-MED-07 — Anexar exames / laudos externos ao prontuário
**Necessidade:** Centralizar evidências clínicas no histórico do paciente.
**Justificativa:** ExamRequestModule V1.9.326.

### URS-MED-08 — Compartilhar relatório com outro médico (referência)
**Necessidade:** Cross-account sharing para 2º opinião.
**Justificativa:** Validado empíricamente 27/05 (Eduardo recebeu de Ricardo).

### URS-MED-09 — Acompanhar evolução longitudinal do paciente
**Necessidade:** Ver trajetória do paciente no tempo separada por fonte (AEC IA / FOLLOW_UP médico / chat IA).
**Justificativa:** Princípio meta cristalizado `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05`.
**Implementado:** V1.9.487 separação semântica aba Evolução.

### URS-MED-10 — Consultar bula ANVISA em contexto de prescrição
**Necessidade:** Bula como infraestrutura cognitiva no fluxo, não documento decontextualizado.
**Justificativa:** Memória `feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05`.
**Implementado:** V1.9.466 BulaContextPopover + V1.9.468-A Matrix Z2 + Bula.

### URS-MED-11 — Receber notificações de AEC concluída + agendamento
**Necessidade:** Saber quando paciente terminou avaliação e quando há agendamento.
**Justificativa:** Workflow contínuo + V1.9.99-B video-call-reminders.

### URS-MED-12 — Visualizar custos IA por feature
**Necessidade:** Transparência operacional sobre uso de GPT-4o por Matrix / Escuta Clínica / Simulação.
**Justificativa:** Painel Observabilidade IA V1.9.374 + cost tracking V1.9.238.

## 5. Requisitos do PACIENTE (URS-PAC-XX)

### URS-PAC-01 — Iniciar AEC autonomamente após convite do médico
**Necessidade:** Conduzir entrevista clínica orientada por IA.
**Justificativa:** Eixo Clínica MedCannLab.

### URS-PAC-02 — Consentimento explícito antes de prosseguir para etapas sensíveis
**Necessidade:** Paciente deve autorizar formalmente uso de seus dados.
**Justificativa:** REGRA HARD §1 anti-kevlar — "Consentimento ≠ Agendamento".
**Implementado:** Pirâmide camada 4 AEC Gate V1.5.

### URS-PAC-03 — Retomar AEC interrompida sem perda de contexto
**Necessidade:** Auto-pause detector permite continuar sessão depois.
**Justificativa:** V1.9.299 auto-pause + V1.9.474 trigger reset invalidated_at.

### URS-PAC-04 — Visualizar relatório clínico final após assinatura médico
**Necessidade:** Acessar relatório que paciente leu (snapshot imutável).
**Justificativa:** Source da UI vem de `clinical_reports.content` (jsonb snapshot).

### URS-PAC-05 — Compartilhar relatório com 2º médico (referência)
**Necessidade:** Liberdade de buscar 2ª opinião.
**Justificativa:** Sharing cross-account validado empíricamente.

### URS-PAC-06 — Receber prescrição assinada ICP-Brasil
**Necessidade:** Documento juridicamente válido para retirar medicamento.
**Justificativa:** CFM 2.381 + lock V1.9.299 PBAD AD-RB.

### URS-PAC-07 — Solicitar agendamento de consulta com médico responsável
**Necessidade:** Marcar consulta presencial / telemedicina.
**Justificativa:** Eixo Clínica.

### URS-PAC-08 — Solicitar anonimização / remoção de dados LGPD
**Necessidade:** Direito de exclusão LGPD Art. 18.
**Justificativa:** RPC `anonymize_user_safely`.

### URS-PAC-09 — Acessar histórico de consultas e prescrições próprias
**Necessidade:** Visualizar timeline pessoal.
**Justificativa:** Direito de acesso LGPD Art. 9.

### URS-PAC-10 — Pseudonimização automática em texto livre IA
**Necessidade:** Nome paciente NÃO deve aparecer em campo `assessment` de racionalidades.
**Justificativa:** LGPD Art. 11 + V1.9.452 sanitize.
**Implementado:** Edge `tradevision-core` v423 + backfill 132 rows.

## 6. Requisitos do ALUNO (URS-ALU-XX)

### URS-ALU-01 — Inscrever-se em curso "Arte da Entrevista Clínica" (AEC)
**Necessidade:** Acessar conteúdo formativo.
**Justificativa:** Eixo Ensino MedCannLab.

### URS-ALU-02 — Realizar teste de nivelamento adaptativo
**Necessidade:** Identificar nível atual de conhecimento.
**Justificativa:** Avaliação pré-curso.

### URS-ALU-03 — Realizar simulação clínica com IA (paciente virtual)
**Necessidade:** Treinar entrevista AEC em ambiente seguro.
**Justificativa:** 10 sistemas (Respiratório / Urinário / Cardiovascular / etc) + 3 tipos (Geral / DRC / TEA).

### URS-ALU-04 — Solicitar mentoria com profissional cadastrado
**Necessidade:** Tirar dúvidas com Ricardo / Eduardo.
**Justificativa:** Sprint E V1.9.497 (Mentoria com agenda).

### URS-ALU-05 — Receber feedback estruturado pós-simulação
**Necessidade:** Saber pontos de melhoria.
**Justificativa:** Promessa do prompt simulação Nôa.
**⚠️ Gap atual:** feedback hoje vem como texto livre da IA — não há `simulation_runs` estruturado (parqueado pós-Marco 3).

### URS-ALU-06 — Visualizar histórico próprio de simulações e avaliações
**Necessidade:** Acompanhar progresso pessoal.
**Justificativa:** `evaluation_submissions` (Sprint E V1.9.496).

## 7. Requisitos do ADMINISTRADOR (URS-ADM-XX)

### URS-ADM-01 — Ver todos os pacientes do sistema (todos os médicos)
**Necessidade:** Auditoria + gestão.
**Justificativa:** RLS admin policy + `getAllPatients` em `adminPermissions`.

### URS-ADM-02 — Ver telemetria IA agregada (Observabilidade)
**Necessidade:** Acompanhar custos OpenAI, latências, distribuição por feature.
**Justificativa:** Painel V1.9.374 AdminAIGovernance.

### URS-ADM-03 — Criar / publicar notícias institucionais
**Necessidade:** Comunicação científica + eventos.
**Justificativa:** Sprint E V1.9.495 `news_items`.

### URS-ADM-04 — Criar / gerenciar instrumentos de avaliação
**Necessidade:** Configurar Pré-AEC, Pós-AEC, Avaliação Curso.
**Justificativa:** Sprint E V1.9.496 `evaluation_instruments`.

### URS-ADM-05 — Moderar fórum Cann Matrix
**Necessidade:** Aprovar / rejeitar posts.
**Justificativa:** Eixo Pesquisa + V1.9.418 fórum.

### URS-ADM-06 — Executar QA runs formais (`clinical_qa_runs`)
**Necessidade:** Audit de qualidade clínica de relatórios.
**Justificativa:** Framework PMF Audit V1.9.85 Memo 28/04.

### URS-ADM-07 — Anonimizar pacientes mediante solicitação
**Necessidade:** Cumprir LGPD Art. 18.
**Justificativa:** RPC `anonymize_user_safely`.

### URS-ADM-08 — Visualizar canal Feedback com escalação de urgentes
**Necessidade:** Atendimento a relatos de paciente / médico / aluno.
**Justificativa:** V1.9.486 Feedback.

## 8. Requisitos TRANSVERSAIS (URS-GLB-XX)

### URS-GLB-01 — Disponibilidade Web 24x7 via Vercel
**Necessidade:** Acesso contínuo.

### URS-GLB-02 — Segurança LGPD em trânsito (HTTPS) e em repouso (Postgres encrypted)
**Necessidade:** Proteção de dado sensível de saúde.

### URS-GLB-03 — Versionamento auditável de todas as mudanças
**Necessidade:** Rastreabilidade temporal completa.
**Justificativa:** Git + tags + diários + memórias.

### URS-GLB-04 — Resposta IA com latência aceitável (P50 < 5s, P95 < 12s)
**Necessidade:** UX clínico aceitável.
**Justificativa:** `ai_chat_interactions.processing_time` instrumentado.

### URS-GLB-05 — Custo OpenAI controlado e instrumentado por feature
**Necessidade:** Sustentabilidade econômica pré-Marco 3.
**Justificativa:** V1.9.238 cost tracking + V1.9.374 painel.

## 9. Inventário de URS

- Médico: 12 URS (URS-MED-01..12)
- Paciente: 10 URS (URS-PAC-01..10)
- Aluno: 6 URS (URS-ALU-01..06)
- Administrador: 8 URS (URS-ADM-01..08)
- Transversal: 5 URS (URS-GLB-01..05)

**Total: 41 URS catalogados.**

Cada URS deve aparecer em [TRM-001 Traceability Matrix](./14_TRM-001_Traceability_Matrix.md) mapeado para SRS / RSK / CTL / TST / EVD.

## 10. Não-cobertos intencionalmente (anti-overclaim)

- URS pós-Marco 3 (vitrine de médicos / monetização paciente / TRL ensino) — escopo posterior.
- URS pediátricos ou gestantes — requerem revisão clínica adicional.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
