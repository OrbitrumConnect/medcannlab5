
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { NoaProvider } from './contexts/NoaContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import ClinicalAssessment from './pages/ClinicalAssessment'
import Library from './pages/Library'
import ChatGlobal from './pages/ChatGlobal'
import PatientChat from './pages/PatientChat'
import ForumCasosClinicos from './pages/ForumCasosClinicos'
import Gamificacao from './pages/Gamificacao'
import PreAnamnese from './pages/PreAnamnese'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import ExperienciaPaciente from './pages/ExperienciaPaciente'
import CursoEduardoFaveret from './pages/CursoEduardoFaveret'
import TermosLGPD from './pages/TermosLGPD'
import TestPage from './pages/TestPage'
import AIDocumentChat from './pages/AIDocumentChat'
import Patients from './pages/Patients'
import Evaluations from './pages/Evaluations'
import Reports from './pages/Reports'
import DebateRoom from './pages/DebateRoom'
import PatientDoctorChat from './pages/PatientDoctorChat'
import PatientProfile from './pages/PatientProfile'
import ProfessionalScheduling from './pages/ProfessionalScheduling'
import PatientAppointments from './pages/PatientAppointments'
import PatientNOAChat from './pages/PatientNOAChat'
import NotFound from './pages/NotFound'

function App() {
  return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ToastProvider>
              <NoaProvider>
                <RealtimeProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/termos-lgpd" element={<TermosLGPD />} />
              <Route path="/pre-anamnese" element={<PreAnamnese />} />
              <Route path="/experiencia-paciente" element={<ExperienciaPaciente />} />
              <Route path="/curso-eduardo-faveret" element={<CursoEduardoFaveret />} />
              
              <Route path="/app" element={<Layout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="home" element={<Dashboard />} />
                <Route path="test" element={<TestPage />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route path="clinical-assessment" element={<ClinicalAssessment />} />
                <Route path="library" element={<Library />} />
                    <Route path="chat" element={<ChatGlobal />} />
                    <Route path="patient-chat" element={<PatientChat />} />
                    <Route path="forum" element={<ForumCasosClinicos />} />
                <Route path="gamificacao" element={<Gamificacao />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="ai-documents" element={<AIDocumentChat />} />
                <Route path="patients" element={
                  <ProtectedRoute requiredRole="professional">
                    <Patients />
                  </ProtectedRoute>
                } />
                <Route path="evaluations" element={<Evaluations />} />
                <Route path="reports" element={<Reports />} />
                <Route path="debate/:debateId" element={<DebateRoom />} />
                <Route path="patient-chat/:patientId" element={
                  <ProtectedRoute requiredRole="professional">
                    <PatientDoctorChat />
                  </ProtectedRoute>
                } />
                <Route path="patient/:patientId" element={<PatientProfile />} />
                <Route path="appointments" element={<Profile />} />
                <Route path="scheduling" element={
                  <ProtectedRoute requiredRole="professional">
                    <ProfessionalScheduling />
                  </ProtectedRoute>
                } />
                <Route path="patient-appointments" element={
                  <ProtectedRoute requiredRole="patient">
                    <PatientAppointments />
                  </ProtectedRoute>
                } />
                <Route path="patient-noa-chat" element={
                  <ProtectedRoute requiredRole="patient">
                    <PatientNOAChat />
                  </ProtectedRoute>
                } />
                <Route path="admin/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/courses" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/analytics" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/system" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/reports" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/upload" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/chat" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/forum" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/gamification" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/renal" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/unification" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/financial" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
                </RealtimeProvider>
              </NoaProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
  )
}

export default App