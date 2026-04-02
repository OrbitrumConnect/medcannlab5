import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import LoginDebugPanel from '../components/LoginDebugPanel'
import { normalizeUserType, getDefaultRouteByType } from '../lib/userTypes'
import {
  Shield,
  Brain,
  Database,
  Users,
  MessageSquare,
  FileText,
  UserPlus,
  Stethoscope,
  CheckCircle2,
  Globe,
  Heart,
  Activity,
  Lock,
  Menu,
  X,
  Monitor,
  Smartphone,
  Download,
  Zap,
  Star,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   Win2K utility: raised / inset bevel borders
───────────────────────────────────────────── */
const raised = 'border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]'
const inset  = 'border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]'
const win2kBtn =
  'px-4 py-1.5 bg-[#C0C0C0] text-[#000000] text-[13px] font-[\'Tahoma\',\'Verdana\',sans-serif] ' +
  'border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] ' +
  'active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] ' +
  'hover:bg-[#d0d0d0] cursor-pointer select-none whitespace-nowrap'
const win2kBtnPrimary =
  'px-4 py-1.5 bg-[#000080] text-[#ffffff] text-[13px] font-[\'Tahoma\',\'Verdana\',sans-serif] ' +
  'border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#0000ff] border-l-[#0000ff] border-r-[#000040] border-b-[#000040] ' +
  'active:border-t-[#000040] active:border-l-[#000040] active:border-r-[#0000ff] active:border-b-[#0000ff] ' +
  'hover:bg-[#0000a0] cursor-pointer select-none whitespace-nowrap font-bold'
const win2kInput =
  'w-full px-2 py-1.5 bg-[#ffffff] text-[#000000] text-[13px] font-[\'Tahoma\',\'Verdana\',sans-serif] ' +
  'border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] ' +
  'outline-none focus:outline-dotted focus:outline-1 focus:outline-[#000080]'
const win2kPanel =
  'bg-[#C0C0C0] border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]'

/* ─────────────────────────────────────────────
   TitleBar — navy gradient with classic chrome
───────────────────────────────────────────── */
const TitleBar = ({ title, onClose }: { title: string; onClose?: () => void }) => (
  <div
    className="flex items-center justify-between px-2 py-0.5 select-none"
    style={{
      background: 'linear-gradient(to right, #000080, #1084d0)',
      minHeight: '22px',
    }}
  >
    <div className="flex items-center gap-1.5">
      <img src="/brain.png" alt="" className="w-4 h-4 object-contain" style={{ imageRendering: 'pixelated' }} />
      <span className="text-white text-[12px] font-bold" style={{ fontFamily: 'Tahoma, Verdana, sans-serif', textShadow: '1px 1px #000040' }}>
        {title}
      </span>
    </div>
    {onClose && (
      <div className="flex gap-0.5">
        <button
          className="w-[18px] h-[16px] bg-[#C0C0C0] text-[#000000] text-[10px] flex items-center justify-center leading-none
            border-t border-l border-r border-b border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]
            active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]
            hover:bg-[#d0d0d0] cursor-pointer font-bold"
          style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
          title="Minimize"
        >_</button>
        <button
          className="w-[18px] h-[16px] bg-[#C0C0C0] text-[#000000] text-[10px] flex items-center justify-center leading-none
            border-t border-l border-r border-b border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]
            active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]
            hover:bg-[#d0d0d0] cursor-pointer"
          style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
          title="Maximize"
        >□</button>
        <button
          onClick={onClose}
          className="w-[18px] h-[16px] bg-[#C0C0C0] text-[#000000] text-[11px] font-bold flex items-center justify-center leading-none
            border-t border-l border-r border-b border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]
            active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]
            hover:bg-red-500 hover:text-white cursor-pointer"
          style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
          title="Close"
        >✕</button>
      </div>
    )}
  </div>
)

/* ─────────────────────────────────────────────
   Windows-style Dialog / Modal
───────────────────────────────────────────── */
const Win2KModal = ({
  isOpen,
  onClose,
  title,
  children,
  width = 380,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
}) => {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={win2kPanel}
        style={{ width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <TitleBar title={title} onClose={onClose} />
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Win2K FeatureCard — resembles a "group box"
───────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="bg-[#C0C0C0] p-3" style={{ border: '2px inset #808080' }}>
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-8 h-8 flex items-center justify-center bg-[#C0C0C0]"
        style={{ border: '2px inset #808080' }}
      >
        <Icon className="w-4 h-4 text-[#000080]" />
      </div>
      <span className="text-[13px] font-bold text-[#000000]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
        {title}
      </span>
    </div>
    <p className="text-[12px] text-[#000000] leading-relaxed" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
      {description}
    </p>
  </div>
)

/* ─────────────────────────────────────────────
   StepCard — looks like a list-box entry
───────────────────────────────────────────── */
const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="flex items-start gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-default">
    <div
      className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#000080] text-white text-[12px] font-bold"
      style={{ fontFamily: 'Tahoma, Verdana, sans-serif', border: '2px inset #000040' }}
    >
      {number}
    </div>
    <div>
      <div className="text-[13px] font-bold text-[#000000] group-hover:text-white" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
        {title}
      </div>
      <div className="text-[12px] text-[#000000] group-hover:text-[#c0c0c0]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
        {description}
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────
   Win2K Separator / Divider
───────────────────────────────────────────── */
const Win2KDivider = () => (
  <div className="w-full">
    <div className="w-full border-t border-[#808080]" />
    <div className="w-full border-t border-[#ffffff]" />
  </div>
)

/* ─────────────────────────────────────────────
   Win2K GroupBox
───────────────────────────────────────────── */
const GroupBox = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <fieldset
    className={`border-2 border-[#808080] bg-[#C0C0C0] px-3 pb-3 pt-1 ${className}`}
    style={{ borderStyle: 'groove' }}
  >
    <legend
      className="px-1 text-[12px] font-bold text-[#000000]"
      style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
    >
      {label}
    </legend>
    {children}
  </fieldset>
)

/* ─────────────────────────────────────────────
   Main Landing Component
───────────────────────────────────────────── */
const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { register, login, isLoading: authLoading, user } = useAuth()
  const { success, error } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'solucao' | 'funciona' | 'planos' | 'filosofia'>('solucao')
  const [statusText, setStatusText] = useState('Pronto')
  const [clock, setClock] = useState('')

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [adminLoginData, setAdminLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'profissional' as any,
    councilType: '',
    councilNumber: '',
    councilState: '',
  })

  // Clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const inviteRedirect = localStorage.getItem('invite_redirect')
      if (inviteRedirect) {
        localStorage.removeItem('invite_redirect')
        navigate(inviteRedirect)
        return
      }
      navigate(getDefaultRouteByType(normalizeUserType(user.type)))
    }
  }, [user, authLoading, navigate])

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) return error('Preencha todos os campos')
    setIsLoading(true)
    setStatusText('Autenticando...')
    try {
      await login(loginData.email, loginData.password)
      success('Bem-vindo de volta!')
      setShowLogin(false)
    } catch {
      error('Credenciais inválidas.')
    } finally {
      setIsLoading(false)
      setStatusText('Pronto')
    }
  }

  const handleAdminLogin = async () => {
    if (!adminLoginData.email || !adminLoginData.password) return error('Preencha os campos')
    setIsLoading(true)
    setStatusText('Verificando acesso administrativo...')
    try {
      await login(adminLoginData.email, adminLoginData.password)
      success('Acesso administrativo concedido.')
      setShowAdminLogin(false)
    } catch {
      error('Acesso negado.')
    } finally {
      setIsLoading(false)
      setStatusText('Pronto')
    }
  }

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) return error('Campos obrigatórios faltando')
    if (registerData.password !== registerData.confirmPassword) return error('Senhas não conferem')
    setIsLoading(true)
    setStatusText('Criando conta...')
    try {
      const userTypeToRegister = registerData.userType || localStorage.getItem('selectedUserType') || 'paciente'
      await register(
        registerData.email,
        registerData.password,
        userTypeToRegister,
        registerData.name,
        registerData.councilType,
        registerData.councilNumber,
        registerData.councilState
      )
      success('Conta criada com sucesso!')
      navigate(getDefaultRouteByType(normalizeUserType(userTypeToRegister)))
    } catch (err: any) {
      error(err?.message || 'Erro ao registrar.')
    } finally {
      setIsLoading(false)
      setStatusText('Pronto')
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return error('Digite seu email')
    setIsLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      success('Email enviado! Verifique sua caixa de entrada.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
    } catch (err: any) {
      error(err?.message || 'Erro ao enviar email de recuperação.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#008080]">
        <div className={`${win2kPanel} p-6 text-center`} style={{ width: 320 }}>
          <TitleBar title="MedCannLab — Carregando..." />
          <div className="p-4 flex flex-col items-center gap-3">
            <div className="w-full h-4 bg-[#ffffff]" style={{ border: '2px inset #808080' }}>
              <div className="h-full bg-[#000080] animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
              Inicializando MedCannLab Plataforma 3.0...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'solucao', label: 'Solução' },
    { key: 'funciona', label: 'Como Funciona' },
    { key: 'planos', label: 'Planos' },
    { key: 'filosofia', label: 'Filosofia' },
  ]

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: '#008080',
        fontFamily: 'Tahoma, Verdana, Arial, sans-serif',
      }}
    >
      {/* ─── Taskbar at top (nav) ─── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-1 py-0.5"
        style={{
          background: '#C0C0C0',
          borderBottom: '2px solid #808080',
          height: '36px',
        }}
      >
        {/* Start button */}
        <button
          className={`${win2kBtn} flex items-center gap-1.5 font-bold`}
          onClick={() => setShowLogin(true)}
          style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
        >
          <img src="/brain.png" alt="" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          <span className="font-bold text-[13px]">Iniciar</span>
        </button>

        {/* Taskbar apps */}
        <div className="hidden md:flex items-center gap-1 mx-2 flex-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-0.5 text-[12px] flex items-center gap-1
                ${activeTab === t.key
                  ? 'bg-[#C0C0C0] border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]'
                  : 'bg-[#C0C0C0] border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]'
                } cursor-pointer hover:bg-[#d0d0d0]`}
              style={{ fontFamily: 'Tahoma, Verdana, sans-serif', minWidth: 90 }}
            >
              <Brain className="w-3 h-3 text-[#000080]" />
              {t.label}
            </button>
          ))}
        </div>

        {/* System tray */}
        <div
          className="flex items-center gap-2 px-2 py-0.5"
          style={{
            border: '2px inset #808080',
            background: '#C0C0C0',
            fontSize: '12px',
            fontFamily: 'Tahoma, Verdana, sans-serif',
          }}
        >
          <Shield className="w-3.5 h-3.5 text-[#000080]" />
          <Activity className="w-3.5 h-3.5 text-[#008000]" />
          <Globe className="w-3.5 h-3.5 text-[#000080]" />
          <Win2KDivider />
          <span className="text-[12px] font-bold">{clock}</span>
        </div>
      </div>

      {/* ─── Desktop area (content below taskbar) ─── */}
      <div className="pt-9 pb-8 px-2 md:px-6 flex flex-col gap-3">

        {/* ── Window: Hero / Welcome ── */}
        <div className={win2kPanel} style={{ width: '100%' }}>
          <TitleBar title="MedCannLab Plataforma 3.0 — A Primeira IA de Escuta Clínica" />

          {/* Menu bar */}
          <div
            className="flex items-center gap-0 px-1 py-0.5 border-b border-[#808080]"
            style={{ background: '#C0C0C0' }}
          >
            {['Arquivo', 'Editar', 'Exibir', 'Ajuda'].map((m) => (
              <button
                key={m}
                className="px-3 py-0.5 text-[12px] hover:bg-[#000080] hover:text-white cursor-default"
                style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div
            className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-[#808080]"
            style={{ background: '#C0C0C0' }}
          >
            <button onClick={() => setShowRegister(true)} className={win2kBtnPrimary}>
              ► Acessar Plataforma
            </button>
            <button onClick={() => setShowLogin(true)} className={win2kBtn}>
              Entrar
            </button>
            <div className="w-0.5 h-5 mx-1" style={{ borderLeft: '1px solid #808080', borderRight: '1px solid #ffffff' }} />
            <button
              onClick={() => {
                alert('📱 No seu celular:\n• iPhone/Safari: Toque em "Compartilhar" → "Adicionar à Tela Início"\n• Android/Chrome: Menu ⋮ → "Instalar aplicativo"')
              }}
              className={win2kBtn}
            >
              <Smartphone className="w-3 h-3 inline mr-1" />
              Instalar App
            </button>
          </div>

          {/* Hero content */}
          <div className="p-4 flex flex-col lg:flex-row gap-4">
            {/* Left: info */}
            <div className="flex-1">
              <GroupBox label="Bem-vindo ao MedCannLab" className="mb-3">
                <div className="flex items-start gap-3 mt-2">
                  <div
                    className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-[#C0C0C0]"
                    style={{ border: '2px inset #808080' }}
                  >
                    <img src="/brain.png" alt="MedCannLab" className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#000080] mb-1" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                      MedCannLab — Plataforma 3.0
                    </p>
                    <p className="text-[12px] text-[#000000]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                      A Primeira IA Treinada na Arte da Escuta Clínica.
                      Onde a Neurociência encontra a Cannabis Medicinal numa plataforma de alta performance.
                    </p>
                  </div>
                </div>
              </GroupBox>

              <GroupBox label="Detalhes do Sistema" className="mb-3">
                <table className="w-full text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                  <tbody>
                    <tr>
                      <td className="font-bold pr-4 py-0.5 text-[#000080] w-40">Versão:</td>
                      <td>MedCannLab 3.0 Build 2026</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4 py-0.5 text-[#000080]">IA:</td>
                      <td>Nôa Esperanza 3.0 • Online</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4 py-0.5 text-[#000080]">Protocolo:</td>
                      <td>AEC 001 — Escuta Estruturada IMRE</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4 py-0.5 text-[#000080]">Segurança:</td>
                      <td>Criptografia AES-256 • LGPD Conforme</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-4 py-0.5 text-[#000080]">Trial:</td>
                      <td className="text-[#008000] font-bold">3 dias de acesso livre</td>
                    </tr>
                  </tbody>
                </table>
              </GroupBox>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowRegister(true)} className={win2kBtnPrimary}>
                  ► Começar Agora
                </button>
                <button onClick={() => setShowLogin(true)} className={win2kBtn}>
                  Já tenho conta
                </button>
                <button
                  onClick={() => setActiveTab('planos')}
                  className={win2kBtn}
                >
                  Ver Planos
                </button>
              </div>
            </div>

            {/* Right: NOA status window */}
            <div style={{ width: 280, flexShrink: 0 }}>
              <div className={win2kPanel}>
                <TitleBar title="Nôa Esperanza — Status" />
                <div className="p-3">
                  <div
                    className="flex items-center justify-center p-4 mb-3 bg-[#000000]"
                    style={{ border: '2px inset #808080' }}
                  >
                    <img
                      src="/noa-avatar.png"
                      alt="Nôa Esperanza"
                      className="w-20 h-20 object-cover"
                      style={{ imageRendering: 'auto', filter: 'brightness(1.1)' }}
                      onError={(e) => { e.currentTarget.src = '/brain.png' }}
                    />
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'Status', value: '● Online', color: '#008000' },
                      { label: 'Memória', value: 'Ativa', color: '#000000' },
                      { label: 'Protocolo', value: 'AEC 001', color: '#000000' },
                      { label: 'Uptime', value: '99.98%', color: '#000080' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                        <span className="font-bold text-[#000000]">{item.label}:</span>
                        <span style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <Win2KDivider />
                  <div className="mt-2">
                    <div className="text-[11px] mb-1 text-[#000000]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                      Processamento:
                    </div>
                    <div className="w-full h-3 bg-[#ffffff]" style={{ border: '2px inset #808080' }}>
                      <div className="h-full bg-[#000080]" style={{ width: '73%' }} />
                    </div>
                    <div className="text-[10px] text-right text-[#000000] mt-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>73%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div
            className="flex items-center gap-4 px-2 py-0.5 border-t border-[#808080] text-[11px]"
            style={{ background: '#C0C0C0', fontFamily: 'Tahoma, Verdana, sans-serif' }}
          >
            <span style={{ border: '1px inset #808080', padding: '0 8px', flex: 1 }}>{statusText}</span>
            <span style={{ border: '1px inset #808080', padding: '0 8px' }}>Seguro</span>
            <span style={{ border: '1px inset #808080', padding: '0 8px' }}>medcannlab.com.br</span>
          </div>
        </div>

        {/* ── Tabbed content area ── */}
        <div className={win2kPanel}>
          <TitleBar title={`MedCannLab — ${tabs.find(t => t.key === activeTab)?.label}`} />

          {/* Tab buttons */}
          <div className="flex flex-wrap border-b border-[#808080]" style={{ background: '#C0C0C0' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-1.5 text-[12px] -mb-px cursor-pointer
                  ${activeTab === t.key
                    ? 'bg-[#C0C0C0] border-t-2 border-l-2 border-r-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-0 font-bold'
                    : 'bg-[#A0A0A0] border-t border-l border-r border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] hover:bg-[#B0B0B0]'
                  }`}
                style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">

            {/* ── Tab: Solução ── */}
            {activeTab === 'solucao' && (
              <div>
                <p className="text-[13px] font-bold text-[#000080] mb-3" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                  A Medicina Moderna enfrenta um colapso de atenção — MedCannLab resolve isso.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <FeatureCard icon={Database} title="Perda de Dados" description="80% das informações clínicas relevantes se perdem em anotações desestruturadas ou memória falha." />
                  <FeatureCard icon={Brain} title="Sobrecarga Cognitiva" description="Médicos tomam centenas de decisões por dia, levando à fadiga decisória e burnout silencioso." />
                  <FeatureCard icon={Users} title="Desumanização" description="A tecnologia atual transformou o paciente em uma linha de planilha, afastando o olhar clínico." />
                </div>
                <Win2KDivider />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GroupBox label="Capacidades do Sistema">
                    <div className="space-y-1 mt-1">
                      {[
                        { icon: MessageSquare, text: 'Escuta Ativa com 28 Blocos Semânticos' },
                        { icon: FileText, text: 'Síntese em Relatório IMRE Padrão Ouro' },
                        { icon: Stethoscope, text: 'Apoio à Decisão Canabinoide Clínica' },
                        { icon: Lock, text: 'Segurança AES-256 e conformidade LGPD' },
                        { icon: Activity, text: 'Memória Clínica Inteligente Persistente' },
                      ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-2 text-[12px] py-0.5 hover:bg-[#000080] hover:text-white px-1 cursor-default" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          <input type="checkbox" defaultChecked readOnly className="accent-[#000080] w-3 h-3 flex-shrink-0" />
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          {text}
                        </div>
                      ))}
                    </div>
                  </GroupBox>
                  <GroupBox label="Protocolo AEC 001">
                    <div className="mt-2 space-y-1">
                      <StepCard number="01" title="A Escuta Ativa" description="Nôa conduz uma conversa imersiva antes da consulta." />
                      <StepCard number="02" title="Síntese Cognitiva" description="IA estrutura o relato em relatório clínico padrão ouro." />
                      <StepCard number="03" title="O Encontro Médico" description="Médico recebe mapa clínico completo. 20 min viram cuidado." />
                    </div>
                  </GroupBox>
                </div>
              </div>
            )}

            {/* ── Tab: Como Funciona ── */}
            {activeTab === 'funciona' && (
              <div>
                <p className="text-[13px] font-bold text-[#000080] mb-3" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                  Como a Plataforma MedCannLab Funciona
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <GroupBox label="Nôa Esperanza: Inteligência que cuida">
                      <p className="text-[12px] mt-2 mb-3" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                        Não substituímos médicos. Amplificamos sua capacidade clínica com uma arquitetura cognitiva desenhada para a saúde.
                      </p>
                      <div className="space-y-1">
                        <StepCard number="01" title="Memória Clínica Inteligente" description="Organiza histórico e padrões do paciente automaticamente." />
                        <StepCard number="02" title="Escuta Estruturada (Protocolo IMRE)" description="Nossa IA conduz entrevistas seguindo rigorosos protocolos de anamnese." />
                        <StepCard number="03" title="Apoio à Decisão Canabinoide" description="Cruza dados clínicos com evidências científicas para sugerir caminhos terapêuticos." />
                      </div>
                    </GroupBox>
                  </div>

                  <div>
                    {/* Simulated chat interface */}
                    <div className={win2kPanel} style={{ height: '100%' }}>
                      <TitleBar title="Nôa — Terminal de Escuta Clínica" />
                      <div className="p-3 flex flex-col gap-2">
                        <div
                          className="h-40 overflow-y-auto p-2 bg-[#ffffff] text-[12px]"
                          style={{ border: '2px inset #808080', fontFamily: 'Courier New, monospace' }}
                        >
                          <div className="text-[#000080]">[Nôa]: Olá! Vou conduzi-lo pela avaliação clínica inicial.</div>
                          <div className="text-[#000080] mt-1">[Nôa]: Por favor, descreva seus sintomas principais.</div>
                          <div className="text-[#008000] mt-1">[Paciente]: Tenho dores crônicas e dificuldade para dormir.</div>
                          <div className="text-[#000080] mt-1">[Nôa]: Entendido. Há quanto tempo você tem esses sintomas?</div>
                          <div className="text-[#000080] mt-1 animate-pulse">▌</div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Digite sua resposta..."
                            className={`${win2kInput} flex-1`}
                            readOnly
                          />
                          <button className={win2kBtn}>Enviar</button>
                        </div>
                        <div className="text-[11px] text-[#808080]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          Analisando padrão de sono e ansiedade... ● System Active
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Planos ── */}
            {activeTab === 'planos' && (
              <div>
                <p className="text-[13px] font-bold text-[#000080] mb-3" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                  Acesso Transparente e Direto — Selecione um Plano
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Paciente */}
                  <div className={win2kPanel}>
                    <TitleBar title="Plano Paciente (SaaS)" />
                    <div className="p-3">
                      <div
                        className="flex items-center justify-center py-2 mb-3 bg-[#000080]"
                        style={{ border: '2px inset #000040' }}
                      >
                        <UserPlus className="w-6 h-6 text-white" />
                        <span className="text-white text-[13px] font-bold ml-2" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          Paciente
                        </span>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-[24px] font-bold text-[#000000]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          R$ 60
                        </div>
                        <div className="text-[11px] text-[#808080]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          /mês + R$ 19,90 taxa única
                        </div>
                      </div>
                      <Win2KDivider />
                      <div className="space-y-1 mt-2 text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                        {[
                          'Avaliação Clínica (Nôa AI)',
                          'Histórico Criptografado',
                          'Agendador de Especialistas',
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#008000] flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowRegister(true)} className={`${win2kBtn} w-full mt-3 justify-center`}>
                        Assinar Plataforma
                      </button>
                    </div>
                  </div>

                  {/* Acadêmico — destacado com dourado */}
                  <div className={win2kPanel} style={{ outline: '2px solid #FFD700' }}>
                    <div
                      className="text-center text-[11px] font-bold py-0.5"
                      style={{ background: '#FFD700', color: '#000000', fontFamily: 'Tahoma, Verdana, sans-serif' }}
                    >
                      ★ ACESSO EDUCACIONAL ★
                    </div>
                    <TitleBar title="Plano Acadêmico" />
                    <div className="p-3">
                      <div
                        className="flex items-center justify-center py-2 mb-3 bg-[#806600]"
                        style={{ border: '2px inset #604400' }}
                      >
                        <FileText className="w-6 h-6 text-[#FFD700]" />
                        <span className="text-[#FFD700] text-[13px] font-bold ml-2" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          Acadêmico
                        </span>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-[24px] font-bold text-[#000000]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          R$ 149,90
                        </div>
                        <div className="text-[11px] text-[#808080]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          /mês · Base Biblioteca Vitalícia
                        </div>
                      </div>
                      <Win2KDivider />
                      <div className="space-y-1 mt-2 text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                        {[
                          'Todos os Cursos EAD',
                          'Simulador Clínico Nôa AI',
                          'Biblioteca Literária Avançada',
                          'Fórum Comunitário Educacional',
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#008000] flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowRegister(true)}
                        className={`${win2kBtnPrimary} w-full mt-3 justify-center`}
                        style={{ background: '#806600', borderColor: '#FFD700' }}
                      >
                        Acessar Formação
                      </button>
                    </div>
                  </div>

                  {/* Profissional */}
                  <div className={win2kPanel}>
                    <TitleBar title="Pro MedCannLab" />
                    <div className="p-3">
                      <div
                        className="flex items-center justify-center py-2 mb-3 bg-[#006040]"
                        style={{ border: '2px inset #004020' }}
                      >
                        <Stethoscope className="w-6 h-6 text-[#00ff80]" />
                        <span className="text-[#00ff80] text-[13px] font-bold ml-2" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          Profissional
                        </span>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-[24px] font-bold text-[#000000]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          R$ 99,90
                        </div>
                        <div className="text-[11px] text-[#808080]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                          /mês · Split 70/30 incluso
                        </div>
                      </div>
                      <Win2KDivider />
                      <div className="space-y-1 mt-2 text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                        {[
                          'Prontuário NLP Mastigado',
                          'Assinatura Digital ICP-Brasil',
                          'Liquidação Connect Automático',
                          'Pacientes Ilimitados',
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#008000] flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowRegister(true)} className={`${win2kBtn} w-full mt-3 justify-center`}>
                        Assinar Licença Pro
                      </button>
                    </div>
                  </div>
                </div>

                {/* Legal notice */}
                <div
                  className="mt-4 p-3 bg-[#ffffc0] text-[11px]"
                  style={{ border: '2px inset #808080', fontFamily: 'Tahoma, Verdana, sans-serif' }}
                >
                  <strong>⚠ Aviso de Governança Médica (CFM):</strong> A MedCannLab atua exclusivamente como software (SaaS) de inteligência artificial clínica. Nós não prestamos o ato médico, não diagnosticamos doenças e não operamos como Clínica Médica ou Plano de Saúde Suplementar.
                </div>
              </div>
            )}

            {/* ── Tab: Filosofia ── */}
            {activeTab === 'filosofia' && (
              <div>
                <GroupBox label="Manifesto V1.1 — Uma epistemologia do cuidado">
                  <div className="mt-2 p-3" style={{ border: '2px inset #808080', background: '#ffffff' }}>
                    <p className="text-[13px] text-[#000080] italic leading-relaxed" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                      "Enquanto a maioria aposta na automação desumanizante, a MedCannLab propõe uma{' '}
                      <strong>economia da escuta</strong>. Nôa Esperanza não é um chatbot; é um artefato cognitivo
                      desenhado para preservar a humanidade na medicina."
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[11px] text-[#808080]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                      <img src="/brain.png" alt="" className="w-4 h-4 grayscale" />
                      <span>— MedCannLab, Manifesto V1.1</span>
                    </div>
                  </div>
                </GroupBox>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <FeatureCard icon={Heart} title="Humanidade" description="Tecnologia a serviço do cuidado humano, não o contrário." />
                  <FeatureCard icon={Brain} title="Cognição" description="Arquitetura cognitiva baseada em neurociência clínica aplicada." />
                  <FeatureCard icon={Shield} title="Ética" description="Conformidade LGPD, CFM e protocolos de governança médica." />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/termos" className={win2kBtn}>Termos de Uso</Link>
                  <Link to="/privacidade" className={win2kBtn}>Política de Privacidade</Link>
                  <button onClick={() => setShowRegister(true)} className={win2kBtnPrimary}>► Começar Gratuitamente</button>
                </div>
              </div>
            )}

          </div>

          {/* Status bar */}
          <div
            className="flex items-center gap-2 px-2 py-0.5 border-t border-[#808080] text-[11px]"
            style={{ background: '#C0C0C0', fontFamily: 'Tahoma, Verdana, sans-serif' }}
          >
            <span style={{ border: '1px inset #808080', padding: '0 8px', flex: 1 }}>
              {tabs.find(t => t.key === activeTab)?.label} — MedCannLab 3.0
            </span>
            <span style={{ border: '1px inset #808080', padding: '0 8px' }}>
              <Globe className="w-3 h-3 inline mr-1" />
              Internet
            </span>
          </div>
        </div>

        {/* ── Desktop icons row ── */}
        <div className="flex flex-wrap gap-4 px-2 mt-2">
          {[
            { icon: UserPlus, label: 'Novo Cadastro', action: () => setShowRegister(true) },
            { icon: Lock, label: 'Entrar', action: () => setShowLogin(true) },
            { icon: Brain, label: 'Nôa AI', action: () => setActiveTab('funciona') },
            { icon: FileText, label: 'Planos', action: () => setActiveTab('planos') },
            { icon: Shield, label: 'Segurança', action: () => setActiveTab('filosofia') },
            { icon: Monitor, label: 'Instalar App', action: () => { alert('Instale o MedCannLab como PWA no seu dispositivo!') } },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onDoubleClick={action}
              onClick={action}
              className="flex flex-col items-center gap-1 p-2 hover:bg-[#000080]/30 cursor-pointer"
              style={{ width: 64 }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center bg-[#C0C0C0]"
                style={{ border: '2px outset #C0C0C0', imageRendering: 'pixelated' }}
              >
                <Icon className="w-6 h-6 text-[#000080]" />
              </div>
              <span
                className="text-[11px] text-white text-center leading-tight"
                style={{ fontFamily: 'Tahoma, Verdana, sans-serif', textShadow: '1px 1px #000000' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* ─── Bottom Taskbar / Footer ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-0.5"
        style={{
          background: '#C0C0C0',
          borderTop: '2px solid #ffffff',
          height: '32px',
        }}
      >
        <div className="flex items-center gap-2 text-[11px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
          <span>© 2026 MedCannLab</span>
          <Link to="/termos" className="hover:underline text-[#000080]">Termos</Link>
          <Link to="/privacidade" className="hover:underline text-[#000080]">Privacidade</Link>
          <span
            className="cursor-pointer hover:underline text-[#000080]"
            onClick={() => setShowAdminLogin(true)}
          >
            Admin
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-2 text-[11px]"
          style={{ border: '1px inset #808080', fontFamily: 'Tahoma, Verdana, sans-serif' }}
        >
          <div className="w-2 h-2 rounded-full bg-[#008000]" />
          <span>medcannlab.com.br</span>
        </div>
      </div>

      {/* ════════════════════════════════
          MODALS (Win2K Dialog style)
      ════════════════════════════════ */}

      {/* Login Dialog */}
      <Win2KModal isOpen={showLogin} onClose={() => setShowLogin(false)} title="Entrar — MedCannLab" width={340}>
        <GroupBox label="Credenciais de Acesso">
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                &amp;Email:
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className={win2kInput}
                placeholder="seu@email.com"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                &amp;Senha:
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={win2kInput}
                placeholder="••••••••"
              />
            </div>
          </div>
        </GroupBox>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={handleLogin} disabled={isLoading} className={win2kBtnPrimary}>
            {isLoading ? 'Aguarde...' : 'OK'}
          </button>
          <button onClick={() => setShowLogin(false)} className={win2kBtn}>Cancelar</button>
          <button
            onClick={() => { setShowLogin(false); setShowForgotPassword(true) }}
            className={win2kBtn}
          >
            Esqueci...
          </button>
        </div>
        <Win2KDivider />
        <div className="mt-2 text-center">
          <span
            className="text-[11px] text-[#000080] cursor-pointer hover:underline"
            style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
            onClick={() => { setShowLogin(false); setShowRegister(true) }}
          >
            Não tem conta? Registrar novo usuário »
          </span>
        </div>
      </Win2KModal>

      {/* Forgot Password */}
      <Win2KModal
        isOpen={showForgotPassword}
        onClose={() => { setShowForgotPassword(false); setForgotPasswordEmail('') }}
        title="Recuperar Senha — MedCannLab"
        width={340}
      >
        <div
          className="flex items-center gap-2 p-2 mb-3 bg-[#ffffc0]"
          style={{ border: '2px inset #808080' }}
        >
          <Shield className="w-6 h-6 text-[#000080] flex-shrink-0" />
          <p className="text-[12px]" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
            Digite seu email para receber um link de redefinição de senha.
          </p>
        </div>
        <div className="mb-3">
          <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
            Endereço de &amp;Email:
          </label>
          <input
            type="email"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
            className={win2kInput}
            placeholder="seu@email.com"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={handleForgotPassword} disabled={isLoading} className={win2kBtnPrimary}>
            {isLoading ? 'Enviando...' : 'Enviar Link'}
          </button>
          <button onClick={() => { setShowForgotPassword(false); setShowLogin(true) }} className={win2kBtn}>
            Voltar
          </button>
        </div>
      </Win2KModal>

      {/* Register Dialog */}
      <Win2KModal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Criar Nova Conta — MedCannLab" width={420}>
        <GroupBox label="Tipo de Usuário">
          <div className="flex gap-4 mt-1">
            {['paciente', 'profissional', 'aluno'].map((type) => (
              <label
                key={type}
                className="flex items-center gap-1 text-[12px] cursor-pointer"
                style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
              >
                <input
                  type="radio"
                  name="userType"
                  value={type}
                  checked={registerData.userType === type}
                  onChange={() => setRegisterData({ ...registerData, userType: type as any })}
                  className="accent-[#000080]"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </GroupBox>

        <div className="mt-3 space-y-2">
          <div>
            <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
              Nome Completo:
            </label>
            <input
              type="text"
              placeholder="Nome Completo"
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              className={win2kInput}
            />
          </div>
          <div>
            <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
              Email:
            </label>
            <input
              type="email"
              placeholder="Email"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              className={win2kInput}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                Senha:
              </label>
              <input
                type="password"
                placeholder="Senha"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className={win2kInput}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
                Confirmar:
              </label>
              <input
                type="password"
                placeholder="Confirmar Senha"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                className={win2kInput}
              />
            </div>
          </div>

          {registerData.userType === 'profissional' && (
            <GroupBox label="Registro Profissional">
              <div className="grid grid-cols-3 gap-2 mt-1">
                <select
                  value={registerData.councilType}
                  onChange={(e) => setRegisterData({ ...registerData, councilType: e.target.value })}
                  className={win2kInput}
                >
                  <option value="">Conselho</option>
                  <option value="CRM">CRM</option>
                  <option value="CRO">CRO</option>
                  <option value="CRP">CRP</option>
                  <option value="CRF">CRF</option>
                </select>
                <input
                  type="text"
                  placeholder="Número/UF"
                  value={registerData.councilNumber}
                  onChange={(e) => setRegisterData({ ...registerData, councilNumber: e.target.value })}
                  className={`${win2kInput} col-span-2`}
                />
              </div>
            </GroupBox>
          )}

          {registerData.userType === 'aluno' && (
            <div
              className="p-2 text-[12px] bg-[#e0f0ff]"
              style={{ border: '2px inset #808080', fontFamily: 'Tahoma, Verdana, sans-serif' }}
            >
              🎓 Acesso exclusivo para estudantes. A matrícula será validada pela instituição.
            </div>
          )}
        </div>

        <Win2KDivider />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={handleRegister} disabled={isLoading} className={win2kBtnPrimary}>
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
          <button onClick={() => setShowRegister(false)} className={win2kBtn}>Cancelar</button>
        </div>
        <div className="text-center mt-2">
          <span
            className="text-[11px] text-[#000080] cursor-pointer hover:underline"
            style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}
            onClick={() => { setShowRegister(false); setShowLogin(true) }}
          >
            Já tem conta? Entrar »
          </span>
        </div>
      </Win2KModal>

      {/* Admin Login */}
      <Win2KModal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} title="Acesso Administrativo — Restrito" width={340}>
        <div
          className="flex items-center gap-2 p-2 mb-3 bg-[#ffffc0]"
          style={{ border: '2px inset #808080' }}
        >
          <Shield className="w-6 h-6 text-[#cc8800] flex-shrink-0" />
          <p className="text-[12px] font-bold" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
            ⚠ Área restrita à governança do sistema.
          </p>
        </div>
        <div className="space-y-2">
          <div>
            <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
              Admin Email:
            </label>
            <input
              type="email"
              placeholder="admin@medcannlab.com.br"
              value={adminLoginData.email}
              onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
              className={win2kInput}
            />
          </div>
          <div>
            <label className="block text-[12px] mb-0.5" style={{ fontFamily: 'Tahoma, Verdana, sans-serif' }}>
              Admin Key:
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={adminLoginData.password}
              onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              className={win2kInput}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={handleAdminLogin} disabled={isLoading} className={win2kBtnPrimary}>
            {isLoading ? 'Verificando...' : 'Acessar Core'}
          </button>
          <button onClick={() => setShowAdminLogin(false)} className={win2kBtn}>Cancelar</button>
        </div>
      </Win2KModal>

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-10 right-4 z-50">
          <LoginDebugPanel />
        </div>
      )}
    </div>
  )
}

export default Landing
