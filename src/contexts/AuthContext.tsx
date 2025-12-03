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
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, userType: string, name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.warn('useAuth must be used within an AuthProvider - returning default values')
    return {
      user: null,
      isLoading: true,
      login: async () => {},
      logout: async () => {},
      register: async () => {}
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
    const email = authUser.email || ''
    
    // Detectar nome baseado no email ou metadados
    // Verificar emails especiais PRIMEIRO e guardar se é um email especial
    const isAdminEmail = email === 'rrvalenca@gmail.com' || 
                         email === 'rrvlenca@gmail.com' || 
                         email === 'profrvalenca@gmail.com' || 
                         email === 'iaianoaesperanza@gmail.com'
    const isPatientEmail = email.toLowerCase() === 'escutese@gmail.com' || email.toLowerCase() === 'escute-se@gmail.com'
    const isProfessionalEmail = email === 'eduardoscfaveret@gmail.com' || email.includes('faveret')
    
    if (isPatientEmail) {
      userName = 'Escutese'
      userType = 'paciente'
      console.log('✅ Email paciente especial detectado:', email)
    } else if (isAdminEmail) {
      // Apenas emails específicos do Dr. Ricardo Valença - SEMPRE admin
      userName = 'Dr. Ricardo Valença'
      userType = 'admin'
      console.log('✅ Email admin especial detectado:', email, '- Tipo FORÇADO como admin')
    } else if (isProfessionalEmail) {
      userName = 'Dr. Eduardo Faveret'
      userType = 'profissional'
      console.log('✅ Email profissional especial detectado:', email)
    } else {
      userName = authUser.user_metadata?.name || email.split('@')[0] || 'Usuário'
    }
    
    // Determinar tipo do usuário - Buscar da tabela users APENAS se não for email especial
    // Emails especiais têm PRIORIDADE ABSOLUTA sobre a tabela users
    if (!isAdminEmail && !isPatientEmail && !isProfessionalEmail) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('type, name, email')
          .eq('id', authUser.id)
          .maybeSingle()
        
        // Tratar erro 404 NOT_FOUND (tabela não existe ou sem acesso)
        if (userError) {
          if (userError.code === 'PGRST116' || userError.message?.includes('NOT_FOUND') || userError.message?.includes('404')) {
            console.warn('⚠️ Tabela users não encontrada ou sem acesso (404). Usando metadados do Supabase.')
          } else {
            console.warn('⚠️ Erro ao buscar tipo do usuário da tabela users:', userError.message)
          }
        } else if (userData && userData.type) {
          // Normalizar tipo (aceita tanto português quanto inglês)
          userType = normalizeUserType(userData.type)
          if (userData.name && !userData.name.match(/^(patient|professional|student|admin|aluno|paciente|profissional)$/i)) {
            userName = userData.name
          }
          console.log('✅ Tipo de usuário obtido da tabela users:', userData.type, '→ normalizado:', userType)
        } else {
          console.log('⚠️ Usuário não encontrado na tabela users, usando metadados')
        }
      } catch (error: any) {
        // Tratar erro 404 ou outros erros de forma mais robusta
        if (error?.code === 'PGRST116' || error?.message?.includes('NOT_FOUND') || error?.message?.includes('404')) {
          console.warn('⚠️ Tabela users não encontrada (404). Continuando com metadados do Supabase.')
        } else {
          console.warn('⚠️ Erro ao buscar tipo do usuário da tabela users:', error?.message || error)
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
      cro: authUser.user_metadata?.cro
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
        supabase.auth.signOut().catch(() => {})
        setUser(null)
        setIsLoading(false)
        return true
      }
      return false
    }

    // Verificar sessão inicial com retry logic
    const checkSession = async (retryCount = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Se houver erro com refresh token, limpar sessão
          if (handleTokenError(error)) {
            return
          }
          
          // Se for erro de rede (status 0) e ainda tiver tentativas, tentar novamente
          if ((error.status === 0 || error.message?.includes('Failed to fetch')) && retryCount < 3) {
            console.warn(`⚠️ Erro de rede ao verificar sessão (tentativa ${retryCount + 1}/3), tentando novamente...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Backoff exponencial
            return checkSession(retryCount + 1)
          }
          
          console.warn('⚠️ Erro ao verificar sessão:', error.message || error)
          setIsLoading(false)
          return
        }
        
        if (session?.user) {
          loadUser(session.user)
        } else {
          setIsLoading(false)
        }
      } catch (error: any) {
        // Capturar erros de refresh token durante inicialização
        if (handleTokenError(error)) {
          return
        }
        
        // Se for erro de rede e ainda tiver tentativas, tentar novamente
        if ((error?.status === 0 || error?.message?.includes('Failed to fetch')) && retryCount < 3) {
          console.warn(`⚠️ Erro de rede ao verificar sessão (tentativa ${retryCount + 1}/3), tentando novamente...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return checkSession(retryCount + 1)
        }
        
        console.warn('⚠️ Erro ao verificar sessão:', error?.message || error)
        setIsLoading(false)
      }
    }
    
    checkSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Tratar erro de refresh token inválido
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('⚠️ Token refresh falhou, limpando sessão...')
        await supabase.auth.signOut().catch(() => {})
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
      
      // Preparar dados de conselho profissional se for profissional
      const professionalData: any = {}
      if (normalizedType === 'profissional' || normalizedType === 'professional') {
        if (councilType) professionalData.council_type = councilType
        if (councilNumber) professionalData.council_number = councilNumber
        if (councilState) professionalData.council_state = councilState
      }

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
            // Dados de conselho profissional
            ...professionalData
          }
        }
      })

      // Após criar o usuário no auth, criar/atualizar registro na tabela users
      if (data.user && !error) {
        // Aguardar um pouco para garantir que o usuário foi criado
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Buscar ou criar registro na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: email,
            name: name,
            type: englishType,
            council_type: councilType || null,
            council_number: councilNumber || null,
            council_state: councilState || null,
            // Sincronizar campos legados
            crm: councilType === 'CRM' ? councilNumber : null,
            cro: councilType === 'CRO' ? councilNumber : null
          }, {
            onConflict: 'id'
          })
          .select()
          .single()

        if (userError) {
          // Tratar erro 404 NOT_FOUND (tabela não existe ou sem acesso)
          if (userError.code === 'PGRST116' || userError.message?.includes('NOT_FOUND') || userError.message?.includes('404')) {
            console.warn('⚠️ Tabela users não encontrada (404). Registro no auth.users foi criado, mas não foi possível criar na tabela users. Execute o script CORRIGIR_ERRO_404_LOGIN.sql no Supabase.')
          } else {
            console.warn('⚠️ Erro ao criar registro na tabela users:', userError.message || userError)
          }
          // Não falhar o registro se houver erro na tabela users - o usuário foi criado no auth.users
        } else {
          console.log('✅ Registro criado na tabela users:', userData)
        }
      }

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