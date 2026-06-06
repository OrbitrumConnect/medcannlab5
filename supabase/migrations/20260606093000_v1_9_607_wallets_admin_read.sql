-- V1.9.607: policy admin-read em wallets (fecha sub-contagem do grounding da Nôa).
--
-- ACHADO (05/06, teste grounding): a Nôa dizia "1 carteira" mas há 4. Causa: buildAdminContext
-- consulta wallets com a sessão do user; wallets só tinha `wallets_owner_select`
-- (auth.uid()=user_id) → admin via só a própria. Outros stats (users/appointments/documents)
-- batem global porque têm RLS admin-readable; wallets não tinha.
--
-- FIX: policy SELECT adicional gated por is_admin() (canônica, user_roles — mesma de 21 policies
-- e do clinical_reports V1.9.574). ADITIVA: policies permissivas são OR → owner vê a própria,
-- admin vê todas. NÃO toca escrita/saldo/policy existente. Zero regressão.
--
-- Verificado via RLS real: admin (Pedro 17345b36) passou a ver 4 (era 1); usuário comum inalterado.

DROP POLICY IF EXISTS wallets_admin_select ON public.wallets;
CREATE POLICY wallets_admin_select ON public.wallets
  FOR SELECT TO public
  USING (is_admin());
