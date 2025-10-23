
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { NoaProvider } from './contexts/NoaContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import Layout from './components/Layout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
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
import NotFound from './pages/NotFound'

function App() {
  return (
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <NoaProvider>
                <RealtimeProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login />} />
              <Route path="/termos-lgpd" element={<TermosLGPD />} />
              <Route path="/pre-anamnese" element={<PreAnamnese />} />
              <Route path="/experiencia-paciente" element={<ExperienciaPaciente />} />
              <Route path="/curso-eduardo-faveret" element={<CursoEduardoFaveret />} />
              
              <Route path="/" element={<Layout />}>
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
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="ai-documents" element={<AIDocumentChat />} />
                <Route path="patients" element={<Patients />} />
                <Route path="evaluations" element={<Evaluations />} />
                <Route path="reports" element={<Reports />} />
                <Route path="debate/:debateId" element={<DebateRoom />} />
                <Route path="patient-chat/:patientId" element={<PatientDoctorChat />} />
                <Route path="appointments" element={<Profile />} />
                <Route path="admin/users" element={<AdminDashboard />} />
                <Route path="admin/courses" element={<AdminDashboard />} />
                <Route path="admin/analytics" element={<AdminDashboard />} />
                <Route path="admin/system" element={<AdminDashboard />} />
                <Route path="admin/reports" element={<AdminDashboard />} />
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