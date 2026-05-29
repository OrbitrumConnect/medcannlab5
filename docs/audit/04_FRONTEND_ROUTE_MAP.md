# 04_FRONTEND_ROUTE_MAP — Mapa de Rotas + Páginas Órfãs — 29/05/2026

**Método**: grep `App.tsx` + listagem `src/pages/` cruzada.

---

## TL;DR

1. **81 páginas em `src/pages/`** + ~85 rotas em `App.tsx` (algumas são `<Navigate>` redirects)
2. **8 buckets Storage**: 7 privados + 1 público (`avatar`, esperado)
3. **Rotas legacy redirecionadoras** (~15) — manter pra retrocompatibilidade
4. **Páginas em `pages/` SEM import App.tsx** identificadas: `AdminAIGovernance`, `ExternalLiterature`, `Home`, `LessonPage`, `Login`, `PatientFinancialDashboard` (importada mas não roteada?), outras
5. **Imports SEM uso real**: investigar

---

## §1 — Rotas públicas (sem `/app/` prefix, ~15)

```
/                              → Landing
/paciente                      → LandingPaciente
/medico                        → LandingMedico
/aluno                         → LandingAluno
/reset-password                → ResetPassword
/invite                        → InvitePatient
/termos-lgpd                   → TermosLGPD
/termos                        → TermosDeUso
/privacidade                   → PoliticaPrivacidade
/experiencia-paciente          → ExperienciaPaciente
/curso-eduardo-faveret         → CursoEduardoFaveret
/curso-jardins-de-cura         → CursoJardinsDeCura
/patient-onboarding            → PatientOnboarding
/eixo/:eixo/tipo/:tipo         → EixoRotaRedirect
/selecionar-eixo               → EixoSelector
```

---

## §2 — Rotas autenticadas (`/app/*`, ~70 incluindo redirects)

### Eixo Clínica (~15 rotas)
```
/app/clinica/profissional/dashboard         → ProfessionalDashboardRouter (ProtectedRoute profissional)
/app/clinica/profissional/relatorios        → Reports
/app/clinica/profissional/tea               → KpisTea (ProtectedRoute)
/app/clinica/profissional/chat-profissionais → ProfessionalChat
/app/clinica/profissional/certificados      → CertificateManagement (ProtectedRoute)
/app/clinica/prescricoes                    → Prescriptions
/app/clinica/paciente/dashboard             → PatientDashboard
/app/clinica/paciente/relatorios            → Reports
/app/clinica/paciente/agendamentos          → PatientAppointments
/app/clinica/paciente/chat-profissional[/:patientId] → PatientDoctorChat
/app/clinica/paciente/chat-noa              → PatientNOAChat
```
+ 4 Navigate redirects (legacy `eduardo-faveret-dashboard`, `ricardo-valenca-dashboard`, etc)

### Eixo Ensino (~12 rotas)
```
/app/ensino/profissional/dashboard          → EnsinoDashboard
/app/ensino/profissional/preparacao-aulas   → LessonPreparation
/app/ensino/profissional/arte-entrevista-clinica → ArteEntrevistaClinica
/app/ensino/profissional/pos-graduacao-cannabis → CursoEduardoFaveret
/app/ensino/profissional/gestao-alunos      → GestaoAlunos
/app/ensino/profissional/aula/:moduleId/:lessonId → LessonDetail
/app/ensino/aluno/dashboard                 → AlunoDashboard
/app/ensino/aluno/cursos                    → Courses
/app/ensino/aluno/biblioteca                → Library
/app/ensino/aluno/gamificacao               → Gamificacao
```

### Eixo Pesquisa (~13 rotas)
```
/app/pesquisa/profissional/dashboard        → PesquisaDashboard
/app/pesquisa/profissional/forum-casos      → PesquisaDashboard (initialTab='forum')
/app/pesquisa/profissional/base-conhecimento → PesquisaDashboard (initialTab='library')
/app/pesquisa/profissional/protocolos       → PesquisaDashboard (initialTab='protocols')
/app/pesquisa/profissional/cidade-amiga-dos-rins → PesquisaDashboard
/app/pesquisa/profissional/medcann-lab      → MedCannLab
/app/pesquisa/profissional/jardins-de-cura  → JardinsDeCura
/app/pesquisa/profissional/casos-similares  → PesquisaDashboard (initialTab='casos-similares')
/app/pesquisa/aluno/dashboard               → PesquisaDashboard
/app/pesquisa/aluno/forum-casos             → ForumCasosClinicos
```

### Admin (~17 rotas — TODAS ProtectedRoute admin)
```
/app/admin                                  → AdminDashboardWrapper
/app/admin/clinical-governance              → AdminDashboardWrapper
/app/admin/users                            → AdminDashboardWrapper
/app/admin/courses                          → AdminDashboardWrapper
/app/admin/analytics                        → AdminDashboardWrapper
/app/admin/system                           → AdminDashboardWrapper
/app/admin/reports                          → AdminDashboardWrapper
/app/admin/news                             → NewsManagement
/app/admin/casos-similares                  → AdminCasosSimilares
/app/admin/upload                           → AdminDashboardWrapper
/app/admin/chat                             → AdminDashboardWrapper
/app/admin/forum                            → AdminDashboardWrapper
/app/admin/gamification                     → AdminDashboardWrapper
/app/admin/renal                            → AdminDashboardWrapper
/app/admin/unification                      → AdminDashboardWrapper
/app/admin/financial                        → AdminDashboardWrapper
/app/admin/feedbacks                        → AdminFeedbackList  ← V1.9.486
```

### Geral autenticada (~12)
```
/app/dashboard                              → Dashboard
/app/home                                   → SmartDashboardRedirect
/app/courses, study-area, library, chat, etc
/app/profile                                → Profile
/app/feedback                               → Feedback  ← V1.9.486-B
/app/patients, prescriptions, scheduling, etc
```

### Navigate legacy redirects (~15)
```
/app/patient-dashboard          → /app/clinica/paciente/dashboard
/app/professional-dashboard     → /app/clinica/profissional/dashboard
/app/aluno-dashboard            → /app/ensino/aluno/dashboard
/app/clinica-dashboard, ensino-dashboard, pesquisa-dashboard
/app/eduardo-faveret-dashboard, ricardo-valenca-dashboard
/app/clinica/paciente/avaliacao-clinica  → /app/clinica/paciente/chat-noa
/app/patient-agenda, patient-kpis, professional-my-dashboard
/app/admin-settings, professional-scheduling, professional-chat
/app/clinical-assessment, patient-appointments, patient-noa-chat
```

---

## §3 — Páginas em `pages/` SEM import em App.tsx (potenciais órfãs)

### Páginas importadas mas com rota só Navigate (legacy redirects)
- `PatientAgenda` (rota agora `/app/clinica/paciente/agendamentos`)
- `PatientKPIs` (rota redirect)
- `ProfessionalDashboard` (rota redirect — ProfessionalDashboardRouter ativo)
- `ProfessionalMyDashboard` (rota redirect)
- `ClinicaDashboard` (rota redirect — substituída por ProfessionalDashboardRouter)
- `Patients` (rota só leva pra `/app/patients` mas é ambígua com `PatientsManagement` em `/app/patients` real)
- `Login` (provavelmente redirect ou modal)
- `Home` (rota direta?)

### Páginas em `pages/` que **possivelmente** NÃO têm rota direta (precisa Grep manual)
- `AdminAIGovernance.tsx` — pode estar como tab interno em AdminDashboardWrapper
- `ExternalLiterature.tsx` — pode estar dentro PesquisaDashboard como tab
- `LessonPage.tsx` (vs `LessonDetail.tsx` que está em rota)
- `Home.tsx`
- `KnowledgeAnalytics.tsx` — pode ser tab AdminDashboardWrapper
- `AdminSettings.tsx` — importada mas rota é Navigate

### Decisão arquitetural conhecida
- **`AdminDashboardWrapper`** carrega múltiplas páginas como tabs internas (`section=` query param) — explica por que 14 rotas admin diferentes apontam pro mesmo Wrapper
- **`PesquisaDashboard`** com `initialTab=` faz o mesmo no eixo Pesquisa
- **Padrão arquitetural**: dashboards são SPAs com tabs internas, rotas são deep-links

---

## §4 — Hierarquia de risco (frontend)

### 🔐 Irreversíveis
- Nenhum identificado pra rotas (mudanças triviais)

### 🔴 Quebra uso real
- Nenhum confirmado — rotas legacy mantidas pra retrocompatibilidade

### 🟡 Atrito de fluxo
- 81 páginas em `pages/` vs ~70 rotas únicas (~15 são Navigate redirects) — sobra ~5-10 páginas potencialmente órfãs
- Confusão `Patients` vs `PatientsManagement` (2 componentes, 1 rota só → `PatientsManagement`)
- Tabs internas via query string (`?section=X`) — médico não vê URL semântica

### ⚫ Polish/arquitetura
- Auditar páginas órfãs pra confirmar mortas vs tabs internas
- Considerar dropar páginas legacy substituídas (LessonPage se LessonDetail é canônica, etc)

---

## §5 — Pendências Sprint 3 / Sprint 5

1. **Sprint 3** — quais rotas REAL são visitadas (logs Vercel? ou inferir via DB activity)
2. **Sprint 5** — consolidar quais páginas órfãs droppable após Marco 2
