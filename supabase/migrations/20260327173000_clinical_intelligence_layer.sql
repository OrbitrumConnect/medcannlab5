-- ============================================================================
-- CLINICAL INTELLIGENCE LAYER — MedCannLab
-- Migration: clinical_rationalities + clinical_axes + KPI traceability
-- Date: 2026-03-27 (APPLIED via Supabase Management API)
-- ============================================================================

-- 1. TABLE: clinical_rationalities
CREATE TABLE IF NOT EXISTS public.clinical_rationalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.clinical_reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rationality_type TEXT NOT NULL CHECK (rationality_type IN (
    'biomedical', 'traditional_chinese', 'ayurvedic', 'homeopathic', 'integrative'
  )),
  assessment TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  considerations TEXT,
  approach TEXT,
  generated_by TEXT DEFAULT 'noa_ai' CHECK (generated_by IN ('noa_ai', 'professional', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, rationality_type)
);
ALTER TABLE public.clinical_rationalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON public.clinical_rationalities FOR ALL USING (public.is_admin());
CREATE POLICY "professional_read_linked" ON public.clinical_rationalities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.appointments a WHERE a.professional_id = auth.uid() AND a.patient_id = clinical_rationalities.patient_id)
  OR EXISTS (SELECT 1 FROM public.clinical_assessments ca WHERE ca.doctor_id = auth.uid() AND ca.patient_id = clinical_rationalities.patient_id)
);
CREATE POLICY "patient_read_own" ON public.clinical_rationalities FOR SELECT USING (patient_id = auth.uid());
CREATE INDEX idx_clinical_rationalities_report ON public.clinical_rationalities(report_id);
CREATE INDEX idx_clinical_rationalities_patient ON public.clinical_rationalities(patient_id);

-- 2. TABLE: clinical_axes
CREATE TABLE IF NOT EXISTS public.clinical_axes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.clinical_reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  axis_name TEXT NOT NULL CHECK (axis_name IN (
    'sintomatico', 'funcional', 'etiologico', 'terapeutico', 'prognostico'
  )),
  summary TEXT NOT NULL,
  indicators JSONB DEFAULT '[]'::jsonb,
  source_rationality_id UUID REFERENCES public.clinical_rationalities(id) ON DELETE SET NULL,
  confidence NUMERIC(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, axis_name)
);
ALTER TABLE public.clinical_axes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON public.clinical_axes FOR ALL USING (public.is_admin());
CREATE POLICY "professional_read_linked" ON public.clinical_axes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.appointments a WHERE a.professional_id = auth.uid() AND a.patient_id = clinical_axes.patient_id)
  OR EXISTS (SELECT 1 FROM public.clinical_assessments ca WHERE ca.doctor_id = auth.uid() AND ca.patient_id = clinical_axes.patient_id)
);
CREATE POLICY "patient_read_own" ON public.clinical_axes FOR SELECT USING (patient_id = auth.uid());
CREATE INDEX idx_clinical_axes_report ON public.clinical_axes(report_id);
CREATE INDEX idx_clinical_axes_patient ON public.clinical_axes(patient_id);
CREATE INDEX idx_clinical_axes_rationality ON public.clinical_axes(source_rationality_id);

-- 3. TRACEABILITY: Add columns to clinical_kpis
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_kpis' AND column_name = 'axis_id') THEN
    ALTER TABLE public.clinical_kpis ADD COLUMN axis_id UUID REFERENCES public.clinical_axes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_kpis' AND column_name = 'rationality_id') THEN
    ALTER TABLE public.clinical_kpis ADD COLUMN rationality_id UUID REFERENCES public.clinical_rationalities(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_kpis' AND column_name = 'source_signals') THEN
    ALTER TABLE public.clinical_kpis ADD COLUMN source_signals JSONB DEFAULT NULL;
  END IF;
END;
$$;
