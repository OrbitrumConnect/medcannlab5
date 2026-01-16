# 📚 Dicionário de Métricas e KPIs - Med-Cann Lab (TradeVision Core)

Este documento define formalmente as métricas utilizadas no dashboard de Governança Clínica e Administrativa. Toda implementação de código ou BI deve seguir estritamente estas definições para garantir consistência longitudinal.

---

## 🏗️ 1. Camada Administrativa (Operacional)

Métricas focadas na saúde operacional da clínica e volume de atendimento.

| Métrica | Definição Técnica | Fonte de Dados (SQL) | Frequência de Atualização |
|:--- |:--- |:--- |:--- |
| **Total de Pacientes** | Contagem absoluta de usuários com role `patient` ativos na plataforma. | `SELECT count(*) FROM users WHERE type='patient'` | Realtime |
| **Consultórios Ativos** | Número de appointments com status diferente de `cancelled` ou `no_show`. (Proxy para atividade clínica). | `SELECT count(*) FROM appointments WHERE status NOT IN (...)` | Realtime |
| **Avaliações Completas** | Total de reports clínicos (`clinical_reports`) finalizados com sucesso. Indica produtividade médica. | `SELECT count(*) FROM clinical_reports WHERE status='completed'` | Realtime |

---

## 🧠 2. Camada Semântica (Inteligência Artificial)

Métricas derivadas da interação do paciente com a IA (Nôa) e Chat, processadas via NLP.

| Métrica | Definição Técnica | Regra de Negócio | Frequência |
|:--- |:--- |:--- |:--- |
| **Qualidade da Escuta** | Score (0-100) que mede o quanto o paciente se sentiu "ouvido" pela IA. Baseado na análise de sentimento das respostas do usuário após interações longas. | Média ponderada dos feedbacks explícitos (estrelas) e implícitos (análise de tom). | Diária (Batch) |
| **Engajamento** | Taxa (%) de pacientes que interagiram com a plataforma (login, chat ou check-in) nos últimos 7 dias. | `(Active Users 7d / Total Users) * 100`. | Snapshot Diário |
| **Aderência ao Tratamento** | Taxa (%) de dias em que o paciente realizou algum input positivo (medicação tomada, diário preenchido) em relação aos dias prescritos. | Requer inputs do módulo de Diário/Prescrição. | Semanal |

---

## 🏥 3. Camada Clínica (Biofeedback & Resultados)

Métricas de desfecho clínico real, integrando dados subjetivos (relato) e objetivos (wearables).

| Métrica | Definição Técnica | Fonte de Dados |
|:--- |:--- |:--- |
| **Wearables Ativos** | Contagem de dispositivos que enviaram pelo menos 1 pacote de dados (Heart Rate, Sleep, etc) nas últimas 24h. | Tabela `wearable_data` com timestamp recente. |
| **Episódios (Epilepsia)** | Soma total de eventos críticos reportados manualmente ou detectados automaticamente no dia atual. | Input do paciente ou trigger de dispositivo. |
| **Melhora de Sintomas** | Variação percentual da escala de dor/desconforto (VAS) entre a consulta atual e a anterior. | Comparação `current_score` vs `baseline_score` nos reports. |

---

## ⚙️ Regras de Implementação

1.  **Imutabilidade do Histórico:** Uma vez gravado um snapshot no `kpi_daily_snapshots`, ele não deve ser alterado retroativamente, exceto em correções de bugs críticos de cálculo.
2.  **Fonte da Verdade:** O Dashboard nunca calcula médias complexas no Frontend. Ele deve sempre ler de `v_dashboard_advanced_kpis` (para realtime) ou `kpi_daily_snapshots` (para tendências).
3.  **Fallback:** Se um dado não estiver disponível (ex: wearable desconectado), o sistema deve exibir `-` ou `0`, mas nunca inferir dados falsos.
