import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  UserType,
  normalizeUserType,
  toEnglishType,
  isValidUserType
} from '../lib/userTypes'

interface User {
  id: string
  email: string
  type: UserType // Usa tipos em português: 'aluno' | 'profissional' | 'paciente' | 'admin'
  name: string
  crm?: string
  cro?: string
  phone?: string
  location?: string
  bio?: string
  payment_status?: 'pending' | 'paid' | 'exempt'
  user_metadata?: any
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (
    email: string,
    password: string,
    userType: string,
    name: string,
    councilType?: string,
    councilNumber?: string,
    councilState?: string
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.warn('useAuth must be used within an AuthProvider - returning default values')
    return {
      user: null,
      isLoading: true,
      login: async () => { },
      logout: async () => { },
      register: async () => { }
    }
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Função auxiliar para carregar usuário
  const loadUser = async (authUser: any) => {
    let userType: UserType = 'paciente' // Padrão em português
    let userName = 'Usuário'
    let paymentStatus: 'pending' | 'paid' | 'exempt' = 'pending' // Default para pending
    const email = authUser.email || ''
    const isAdminEmail = ['ricardo.valenca@medcannlab.com.br', 'admin@medcannlab.com.br', 'phpg69@gmail.com', 'phpg69@hotmail.com'].includes(email.toLowerCase())
    const isProfessionalEmail = ['eduardo.faveret@medcannlab.com.br'].includes(email.toLowerCase())
    const isPatientEmail = ['paciente@medcannlab.com.br'].includes(email.toLowerCase())

    if (isAdminEmail) userType = 'admin'
    else if (isProfessionalEmail) userType = 'profissional'

    // Detectar nome baseado no email ou metadados
    // Logica de email especial substituída por metadados seguros (Phase 5)

    // Fallback de nome padrão
    if (!userName || userName === 'Usuário') {
      userName = authUser.user_metadata?.name || email.split('@')[0] || 'Usuário'
    }

    // Determinar tipo do usuário - Buscar da tabela users
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('type, name, email, payment_status')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!userError && userData) {
        // Verificar Flag de Admin Global (usando authUser.user_metadata diretamente)
        const isFlagAdmin = authUser.user_metadata?.flag_admin === true;

        if (isFlagAdmin) {
          userType = 'admin';
          console.log('🔒 Usuário identificado como ADMIN via flag_admin');
        } else if (userData.type) {
          userType = normalizeUserType(userData.type);
        }

        if (userData.name) {
          userName = userData.name;
        }
        if (userData.payment_status) {
          paymentStatus = userData.payment_status
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar perfil do usuário:', error);
    }

    // Determinar tipo do usuário - Buscar da tabela users APENAS se não for email especial
    // Emails especiais têm PRIORIDADE ABSOLUTA sobre a tabela users
    if (!isAdminEmail && !isPatientEmail && !isProfessionalEmail) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('type, name, email, payment_status')
          .eq('id', authUser.id)
          .maybeSingle()

        if (!userError && userData && userData.type) {
          // Normalizar tipo (aceita tanto português quanto inglês)
          userType = normalizeUserType(userData.type)
          if (userData.name && !userData.name.match(/^(patient|professional|student|admin|aluno|paciente|profissional)$/i)) {
            userName = userData.name
          }
          if (userData.payment_status) {
            paymentStatus = userData.payment_status
          }
          console.log('✅ Tipo de usuário obtido da tabela users:', userData.type, '→ normalizado:', userType)
        } else {
          // Erro de recursão infinita nas políticas RLS - usar metadados como fallback
          if (userError?.code === '42P17' || userError?.message?.includes('infinite recursion')) {
            // Silenciar erro conhecido de políticas RLS
          } else if (userError) {
            console.warn('⚠️ Erro ao buscar tipo do usuário da tabela users:', userError)
          }
          console.log('⚠️ Usuário não encontrado na tabela users, usando metadados')
        }
      } catch (error: any) {
        // Ignorar erros de recursão infinita nas políticas RLS
        if (error?.code !== '42P17' && !error?.message?.includes('infinite recursion')) {
          console.warn('⚠️ Erro ao buscar tipo do usuário da tabela users:', error)
        }
      }
    } else {
      console.log('🔒 Email especial detectado, ignorando tipo da tabela users (prioridade absoluta)')
    }

    // Fallback: Determinar tipo do usuário baseado em metadados ou localStorage
    // APENAS se não for email especial e ainda for o padrão 'paciente'
    if (!isAdminEmail && !isPatientEmail && !isProfessionalEmail && userType === 'paciente') {
      // Verificar localStorage primeiro
      const testUserType = localStorage.getItem('test_user_type')
      if (testUserType && isValidUserType(testUserType)) {
        userType = normalizeUserType(testUserType)
        console.log('✅ Tipo obtido do localStorage:', testUserType, '→ normalizado:', userType)
      }
      // Verificar metadados do Supabase
      else if (authUser.user_metadata?.type) {
        userType = normalizeUserType(authUser.user_metadata.type)
        console.log('✅ Tipo obtido dos metadados (type):', authUser.user_metadata.type, '→ normalizado:', userType)
      }
      else if (authUser.user_metadata?.user_type) {
        userType = normalizeUserType(authUser.user_metadata.user_type)
        console.log('✅ Tipo obtido dos metadados (user_type):', authUser.user_metadata.user_type, '→ normalizado:', userType)
      }
      else if (authUser.user_metadata?.role) {
        userType = normalizeUserType(authUser.user_metadata.role)
        console.log('✅ Tipo obtido dos metadados (role):', authUser.user_metadata.role, '→ normalizado:', userType)
      }
    }

    // Garantir que o nome não seja um tipo válido (verificar se o nome é exatamente um tipo, não apenas contém)
    if (userName && isValidUserType(userName.toLowerCase().trim())) {
      console.warn(`⚠️ Nome do usuário é um tipo válido (${userName}), usando email como nome`)
      userName = email.split('@')[0] || 'Usuário'
    }

    // Verificar se o nome contém um tipo válido (como "Mário Valença" não deve ser confundido com tipo)
    // Se o nome for exatamente igual a um tipo válido, usar email como nome
    const nameLower = userName.toLowerCase().trim()
    if (['aluno', 'profissional', 'paciente', 'admin', 'student', 'professional', 'patient'].includes(nameLower)) {
      console.warn(`⚠️ Nome do usuário é exatamente um tipo válido (${userName}), usando email como nome`)
      userName = email.split('@')[0] || 'Usuário'
    }

    // Garantir que o tipo seja válido (normalizeUserType já faz isso, mas garantimos aqui)
    if (!isValidUserType(userType)) {
      console.warn(`⚠️ Tipo de usuário inválido após normalização: ${userType}, usando padrão 'paciente'`)
      userType = 'paciente'
    }

    const debugUser: User = {
      id: authUser.id,
      email: email,
      type: userType, // Sempre em português
      name: userName,
      crm: authUser.user_metadata?.crm,
      cro: authUser.user_metadata?.cro,
      payment_status: paymentStatus
    }

    console.log('✅ Usuário carregado:', { email, type: userType, name: userName })
    setUser(debugUser)
    setIsLoading(false)
  }

  // Verificar se o usuário já está logado
  useEffect(() => {
    // Tratamento global para erros de refresh token
    const handleTokenError = (error: any) => {
      if (error?.message?.includes('Refresh Token') ||
        error?.message?.includes('refresh_token') ||
        error?.message?.includes('Invalid Refresh Token')) {
        console.warn('⚠️ Erro de refresh token detectado, limpando autenticação...')
        // Limpar localStorage do Supabase (todas as chaves que começam com 'sb-')
        try {
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith('sb-') && key.includes('auth-token')) {
              localStorage.removeItem(key)
            }
          })
        } catch (e) {
          // Ignorar erros ao limpar
        }
        supabase.auth.signOut().catch(() => { })
        setUser(null)
        setIsLoading(false)
        return true
      }
      return false
    }

    // Verificar sessão inicial
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // Se houver erro com refresh token, limpar sessão
          if (handleTokenError(error)) {
            return
          }
          setIsLoading(false)
          return
        }

        if (session?.user) {
          loadUser(session.user)
        } else {
          setUser(null)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        // Capturar erros de refresh token durante inicialização
        if (!handleTokenError(error)) {
          console.warn('⚠️ Erro ao verificar sessão:', error)
          setIsLoading(false)
        }
      })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Tratar erro de refresh token inválido
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('⚠️ Token refresh falhou, limpando sessão...')
        await supabase.auth.signOut().catch(() => { })
        setUser(null)
        setIsLoading(false)
        return
      }

      if (session?.user) {
        loadUser(session.user)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erro no login:', error.message)
        throw new Error(error.message)
      }

      if (data.user) {
        console.log('✅ Login realizado com sucesso para:', email)
      }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Erro no logout:', error.message)
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      try {
        // Remover tokens do Supabase armazenados localmente
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('sb-') && key.includes('auth-token')) {
            localStorage.removeItem(key)
          }
        })
      } catch (e) {
        // Ignorar erros ao limpar tokens
      }

      // Limpar estados derivados
      localStorage.removeItem('viewAsUserType')
      localStorage.removeItem('selectedUserType')
      localStorage.removeItem('test_user_type')
      setUser(null)
      setIsLoading(false)
      console.log('✅ Logout concluído (estado local limpo)')
    }
  }

  const register = async (
    email: string,
    password: string,
    userType: string,
    name: string,
    councilType?: string,
    councilNumber?: string,
    councilState?: string
  ) => {
    try {
      setIsLoading(true)

      // Normalizar tipo de usuário para português
      const normalizedType = normalizeUserType(userType)
      // Converter para inglês para salvar no Supabase (compatibilidade)
      const englishType = toEnglishType(normalizedType)

      console.log('📝 Tentando registrar:', { email, userType, normalizedType, englishType, name })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            type: englishType, // Salvar em inglês no Supabase para compatibilidade
            name: name,
            user_type: englishType,
            // Também salvar em português para referência futura
            type_pt: normalizedType,
            // Dados do conselho (opcionais)
            council_type: councilType,
            council_number: councilNumber,
            council_state: councilState
          }
        }
      })

      if (error) {
        console.error('❌ Erro no Supabase Auth:', error)
        console.error('❌ Mensagem de erro:', error.message)
        console.error('❌ Status do erro:', error.status)
        throw new Error(error.message || 'Erro ao criar conta')
      }

      if (data.user) {
        console.log('✅ Registro realizado com sucesso para:', email)
        console.log('✅ Dados do usuário:', data.user)

        // Se o Supabase exigir confirmação de email, o usuário pode não estar confirmado ainda
        if (!data.session) {
          console.log('⚠️ Usuário criado mas email precisa ser confirmado')
        }
      } else {
        console.warn('⚠️ Registro concluído mas data.user está vazio')
        throw new Error('Usuário não foi criado. Verifique as configurações do Supabase.')
      }
    } catch (error: any) {
      console.error('❌ Erro no registro:', error)
      console.error('❌ Stack trace:', error.stack)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔍 Estado do usuário atualizado:', user)
  }, [user])

  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}