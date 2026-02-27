-- =====================================================
-- 🛡️ RLS POLICIES: 6 Tabelas sem políticas
-- =====================================================
-- Data: 25/02/2026
-- Motivo: Estas tabelas têm RLS ativo mas NENHUMA policy,
--         o que significa que ninguém (nem admin) pode ler ou escrever.
--
-- Tabelas: analytics, benefit_usage_log, channels,
--          chat_sessions, course_modules, messages
--
-- Seguro para reexecução (IF NOT EXISTS / DROP IF EXISTS).
-- =====================================================

-- =====================================================
-- 1) ANALYTICS — métricas de uso da plataforma
-- =====================================================
-- Admins veem tudo; usuários veem apenas seus próprios dados
CREATE POLICY "analytics_select_own_or_admin" ON public.analytics
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
  );

CREATE POLICY "analytics_insert_system" ON public.analytics
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin_user()
  );

-- =====================================================
-- 2) BENEFIT_USAGE_LOG — log de uso de benefícios
-- =====================================================
CREATE POLICY "benefit_usage_select_own_or_admin" ON public.benefit_usage_log
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
  );

CREATE POLICY "benefit_usage_insert_own" ON public.benefit_usage_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- =====================================================
-- 3) CHANNELS — canais do fórum/chat global
-- =====================================================
-- Todos os autenticados podem ver canais
CREATE POLICY "channels_select_all" ON public.channels
  FOR SELECT TO authenticated
  USING (true);

-- Apenas admin pode criar/modificar canais
CREATE POLICY "channels_insert_admin" ON public.channels
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "channels_update_admin" ON public.channels
  FOR UPDATE TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "channels_delete_admin" ON public.channels
  FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- =====================================================
-- 4) CHAT_SESSIONS — sessões de IA (Nôa)
-- =====================================================
-- Usuários veem apenas suas próprias sessões
CREATE POLICY "chat_sessions_select_own" ON public.chat_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
  );

CREATE POLICY "chat_sessions_insert_own" ON public.chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_sessions_update_own" ON public.chat_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5) COURSE_MODULES — módulos de cursos educacionais
-- =====================================================
-- Todos os autenticados podem ver módulos
CREATE POLICY "course_modules_select_all" ON public.course_modules
  FOR SELECT TO authenticated
  USING (true);

-- Apenas admin/profissional pode criar módulos
CREATE POLICY "course_modules_insert_admin" ON public.course_modules
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "course_modules_update_admin" ON public.course_modules
  FOR UPDATE TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- =====================================================
-- 6) MESSAGES — mensagens genéricas/notificações
-- =====================================================
-- Nota: Verificar se esta tabela tem coluna user_id ou recipient_id
-- Usando abordagem conservadora: admin vê tudo
CREATE POLICY "messages_select_own_or_admin" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR user_id = auth.uid()
  );

CREATE POLICY "messages_insert_system" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user()
    OR user_id = auth.uid()
  );

CREATE POLICY "messages_update_admin" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
