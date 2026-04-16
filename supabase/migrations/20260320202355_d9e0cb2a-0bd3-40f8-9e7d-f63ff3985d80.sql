-- ============================================================
-- MIGRAÇÃO DE SEGURANÇA: Polimento Final 20/03/2026
-- Corrige findings críticos do security scan
-- ============================================================

-- ============ BLOCO 1: DOCUMENTS ============
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users view all" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users upload" ON documents;

CREATE POLICY "docs_select_authenticated"
ON documents FOR SELECT TO authenticated
USING (
  uploaded_by = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'profissional')
  OR is_published = true
);

CREATE POLICY "docs_insert_own"
ON documents FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "docs_update_own"
ON documents FOR UPDATE TO authenticated
USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "docs_delete_own"
ON documents FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ============ BLOCO 2: NOA_MEMORIES ============
DROP POLICY IF EXISTS "Authenticated users can access all memories" ON noa_memories;

CREATE POLICY "noa_memories_select_own"
ON noa_memories FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "noa_memories_insert_own"
ON noa_memories FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "noa_memories_update_own"
ON noa_memories FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "noa_memories_delete_own"
ON noa_memories FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============ BLOCO 3: NOA_ARTICLES ============
DROP POLICY IF EXISTS "Authenticated users can access all articles" ON noa_articles;

CREATE POLICY "noa_articles_select"
ON noa_articles FOR SELECT TO authenticated USING (true);

CREATE POLICY "noa_articles_insert"
ON noa_articles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

CREATE POLICY "noa_articles_update"
ON noa_articles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "noa_articles_delete"
ON noa_articles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============ BLOCO 4: NOA_CLINICAL_CASES ============
DROP POLICY IF EXISTS "Authenticated users can access all clinical cases" ON noa_clinical_cases;

CREATE POLICY "noa_clinical_cases_select"
ON noa_clinical_cases FOR SELECT TO authenticated USING (true);

CREATE POLICY "noa_clinical_cases_insert"
ON noa_clinical_cases FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

CREATE POLICY "noa_clinical_cases_update"
ON noa_clinical_cases FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

CREATE POLICY "noa_clinical_cases_delete"
ON noa_clinical_cases FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============ BLOCO 5: NOA_LESSONS ============
DROP POLICY IF EXISTS "Authenticated users can access all lessons" ON noa_lessons;

CREATE POLICY "noa_lessons_select"
ON noa_lessons FOR SELECT TO authenticated USING (true);

CREATE POLICY "noa_lessons_insert"
ON noa_lessons FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

CREATE POLICY "noa_lessons_update"
ON noa_lessons FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

CREATE POLICY "noa_lessons_delete"
ON noa_lessons FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============ BLOCO 6: CONVERSATION_RATINGS ============
DROP POLICY IF EXISTS "Usuários autenticados podem ler avaliações" ON conversation_ratings;

CREATE POLICY "ratings_select_own"
ON conversation_ratings FOR SELECT TO authenticated
USING (
  patient_id = auth.uid()
  OR professional_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);