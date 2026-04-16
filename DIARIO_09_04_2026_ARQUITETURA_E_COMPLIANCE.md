# DIÁRIO DE BORDO: 09 DE ABRIL DE 2026
## Maturidade Arquitetural, Blindagem Jurídica e "O Pitch Real"

### 🎯 Resumo Executivo
Os últimos embates estratégicos (entre o dia 08 e 09) nos tiraram oficialmente da posição de construir apenas uma "solução de software" para o patamar de formar uma **HealthTech/EdTech auditável em nível C-Level**. Não fechamos código em tela, mas construímos a estrutura jurídica societária inquebrável, selamos a estabilidade da Universidade Digital no banco de dados e olhamos para as entranhas do nosso código com os olhos frios de uma auditoria de plano de saúde.

Abaixo, a tríade mestre de tudo que definimos e selamos no GitHub!

---

### 🏛️ 1. O Novo Contrato Social: De Amadorismo para "Investment-Ready"
*(Refletido integralmente no arquivo `acordo_quotistas_juridico.md`)*

Ouvimos conselhos executivos e refizemos a antiga divisão "25x4 engessada". O que mudou:
- **A Torta e a Tesouraria:** O Cap Table agora é de `20%` para cada Cofundador + um baú formidável de **`20% no Equity Pool Estratégico`** (da empresa, gerido por aprovação de 75%). Esse baú serve como ESOP (para reter dev/médico estrela) e Growth (Advisors/Eventos), evitando a diluição do core original na primeira rodada.
- **Divisão "Salário x Sociedade":** Entendemos que médicos que geram atendimento na plataforma NÃO ganham "pró-labore". Eles faturam via nota fiscal pela sua PJ como "prestadores da infraestrutura", blindando a plataforma do CFM e deixando claro que "quem traciona, ganha independentemente de ser dono das cotas".
- **Travinha de Falência e "Buyout":** Um sócio-problema não pode mais exigir pagamento de recompra que quebre o fluxo de caixa ou leve 3x a receita bruta repentinamente. O novo contrato obriga 20% de deságio e trava o pagamento limite do caixa da empresa (mantendo os salários vitais salvos da "recompra obrigatória").
- **Tornozeleira Ajustada:** O Non-Compete perigoso de 3 anos caiu para `24 meses`, apenas no nicho idêntico cirúrgico (Inteligência Artificial Nativa com IMRE).

---

### 🎓 2. A Universidade Nôa: O Plano Não-Destrutivo
*(Refletido integralmente no arquivo `PLANO_EXECUCAO_EIXO_ENSINO_SEGURO.md`)*

Entramos num impasse se deletávamos tabelas vazias no banco de dados, o que *infalivelmente* resultaria em tela branca (`NotFoundError`) porque o React ainda faz chamadas burras à URL. O plano final:
- **`noa_lessons` é a Tabela Rainha:** Tudo ocorrerá nela. Nós iremos expandi-la gradativamente (adicionando `video_url`, `content_type`, `pdf_url`) onde o Frontend já tem tentáculos. 
- **O Respeito à Ordem (`order_index`):** Fixamos a premissa de que aluno não abre curso no caos. Todo módulo e toda aula exigirão uma ordem linear na resposta (banco relacional padrão).
- **Sem Mais "Aulas Esquecidas":** Aprovada a criação da inédita `user_lesson_progress`. Nosso aplicativo parará de ser um "PDF solto" e guardará onde exatamente o aluno de especialização parou (a pedra base das EdTechs escaláveis).

---

### 🛡️ 3. A Auditoria Clínica Final (O que Falar Pra Faria Lima)
Você executou o prompt supremo: *"E se uma seguradora virasse meu sistema pelo avesso?".*
A IA foi impiedosamente pragmática ao ler o TradeVision e o nosso Supabase:
1. **Riscos Inerentes RLS/LGPD:** Mandamos Json livre com a queixa do paciente para a OpenAI (EUA) rodar algoritmos. Faltava a confissão dura de que não somos isentos da LGPD; dependemos ativamente do Opt-in maciço nos T&C no primeiro clique do app.
2. **Sistema não prescreve saúde, corta cronômetro:** Decidimos a "Sincronia do Discurso". A MedCannLab entra na sala da operadora falando que *desenvolveram uma Nôa focada em antecipação de Anamnese*, diminuindo radicalmente em 20 minutos a burocracia do atendimento, evitando SaMD (Software As a Medical Device regulamentado pesado pela ANVISA).
3. **Escala Certa:** Nossa infraestrutura PGBouncer supota centenas de milhares, mas é a Governança das Edges que prova para o mercado corporativo *"Sim, as informações e dores da minha mãe não vazam, elas ficam limitadas ao RLS fechado no Banco da Empresa de vocês".*

---

### 🚀 Próximos Passos
Tudo isso está salvo e "Commitado" nas branches `main` e `master` do GitHub. O diário de hoje encerra a Era da Filosofia. 

**O primeiro bloco focado do amanhã deverá ser:** Iniciar a injeção SQL no Supabase cumprindo precisamente o Plano de Ensino, botando os Metadados nas tabelas e subindo silenciosamente a "Arte da Entrevista Clínica". A história de formatação parou. Começa a de execução.
