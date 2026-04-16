-- ==========================================
-- 🩺 MEDCANNLAB: AUDITORIA DE VOLUMETRIA LOGA
-- Rode no SQL Editor para verificar SEU CENÁRIO DE DADOS ATUAL
-- ==========================================

-- 1. Quantos usuários, divididos por nível (médicos x pacientes) existem hojes?
SELECT type as "Perfil", COUNT(*) as "Volume" FROM users GROUP BY type;

-- 2. Quantas consultas estão agendadas no total? (É aqui que a grana entra)
SELECT status as "Status do Agendamento", COUNT(*) as "Total_de_Consultas" FROM appointments GROUP BY status;

-- 3. Quantas sessões de Chat as IAs já rodaram na história do sistema?
SELECT COUNT(*) as "Interacoes_Totais_com_a_Nôa" FROM ai_chat_interactions;

-- 4. Tem dinheiro na mesa? Quantos registros de Transações batem aqui?
SELECT type as "Situação_Financeira", COUNT(*) as "Transacoes", SUM(amount) as "Valor_Movimentado" FROM transactions GROUP BY type;

-- 5. Os médicos têm agendas de configuração batendo nas disponibilidades?
SELECT COUNT(*) as "Regras_Horarios_Configuradas" FROM professional_availability;
