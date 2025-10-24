import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  type: 'patient' | 'professional' | 'student' | 'admin' | 'unconfirmed'
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // --- REFS for concurrency control & caching ---
  // Map userId -> Promise that resolves to profile (so concurrent calls reuse same promise)
  const profilePromisesRef = useRef<Map<string, Promise<User | null>>>(new Map())
  // which userId already had profile loaded successfully this session
  const profileLoadedForUserRef = useRef<string | null>(null)
  // Optional flag just for debug/logging
  const profileLoadingRef = useRef<boolean>(false)

  // Verificar se o usuário já está logado
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    // Timeout de segurança para evitar loading infinito (aumentado para 20 segundos)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ Timeout de segurança - definindo isLoading como false')
        setIsLoading(false)
      }
    }, 20000) // 20 segundos

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, 'Session:', !!session, 'User:', session?.user?.id)
      if (isMounted) {
        // Limpar timeout se o auth state change funcionar
        clearTimeout(timeoutId)
        
        if (session?.user) {
          console.log('👤 Usuário no auth state change:', session.user.id)
          // Verificar se não é um evento de logout
          if (event === 'SIGNED_OUT') {
            console.log('🚪 Evento de logout detectado - definindo user como null')
            setUser(null)
          } else {
            await loadUserProfile(session.user.id)
            console.log('🔄 Após loadUserProfile - user state:', user)
          }
        } else {
          console.log('❌ Nenhum usuário no auth state change - fazendo logout')
          setUser(null)
        }
        console.log('🔄 Auth state change - definindo isLoading como false')
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  // Debug: verificar mudanças no user
  useEffect(() => {
    console.log('🔍 Estado do usuário atualizado:', user)
  }, [user])

  const loadUserProfile = async (userId: string) => {
    console.log('🔄 Iniciando carregamento do perfil...')
    
    // Sempre executar, mas controlar o estado
    setIsLoadingProfile(true)
    setIsLoading(true)
    
    // Timeout global REMOVIDO para evitar auto login
    // const globalTimeout = setTimeout(() => {
    //   console.log('⏰ Timeout global do loadUserProfile - criando usuário de emergência')
    //   const emergencyUser = {
    //     id: userId,
    //     email: 'admin@medcannlab.com',
    //     type: 'admin' as any,
    //     name: 'Administrador',
    //     crm: undefined,
    //     cro: undefined
    //   }
    //   setUser(emergencyUser)
    //   setIsLoading(false)
    //   setIsLoadingProfile(false)
    //   console.log('✅ Usuário de emergência criado por timeout global')
    // }, 10000) // 10 segundos para toda a função
    
    try {
      console.log('🔍 [loadUserProfile] Iniciando busca de perfil para userId:', userId)
      
      // Teste rápido de conectividade com Supabase com timeout
      console.log('🔍 [loadUserProfile] Testando conectividade com Supabase...')
      
      const connectPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
      
      try {
        const { data: testData, error: testError } = await Promise.race([connectPromise, timeoutPromise]) as any
        console.log('🔍 [loadUserProfile] Teste de conectividade - data:', testData, 'error:', testError)
        
        // Se o teste falhar, não criar usuário de emergência
        if (testError) {
          console.log('🚨 [loadUserProfile] Erro de conectividade detectado - NÃO criando usuário de emergência')
          setIsLoading(false)
          setIsLoadingProfile(false)
          return
        }
      } catch (timeoutError) {
        console.log('⏰ [loadUserProfile] Timeout de conectividade - NÃO criando usuário de emergência')
        setIsLoading(false)
        setIsLoadingProfile(false)
        return
      }
      
      // Usar dados diretamente do Supabase Auth com timeout mais longo
      console.log('🔍 [loadUserProfile] Carregando dados do usuário do Supabase Auth...')
      
      // Primeiro, tentar sem timeout para ver se funciona rapidamente
      let session, authUser
      try {
        console.log('🔍 [loadUserProfile] Tentando getSession sem timeout...')
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('🔍 [loadUserProfile] Session data:', sessionData)
        console.log('🔍 [loadUserProfile] Session error:', sessionError)
        session = sessionData.session
        authUser = session?.user
        console.log('✅ [loadUserProfile] Sessão obtida rapidamente:', authUser?.id)
      } catch (quickError) {
        console.log('⚠️ [loadUserProfile] Erro rápido, tentando com timeout...', quickError)
        
        // Se falhar rapidamente, tentar com timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
        
        console.log('🔍 [loadUserProfile] Tentando getSession com timeout...')
        const { data: { session: sessionData } } = await Promise.race([sessionPromise, timeoutPromise]) as any
        session = sessionData
        authUser = session?.user
        console.log('✅ [loadUserProfile] Sessão obtida com timeout:', authUser?.id)
      }
      
      if (!authUser) {
        console.log('❌ [loadUserProfile] Nenhum usuário encontrado no Auth')
        return
      }
      
      console.log('👤 [loadUserProfile] Auth user encontrado:', authUser.id, authUser.email)
      console.log('📧 [loadUserProfile] Email confirmado:', authUser.email_confirmed_at)
      
      // Verificar se o email foi confirmado
      if (!authUser.email_confirmed_at) {
        console.log('⚠️ [loadUserProfile] Email não confirmado')
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          type: 'unconfirmed' as any,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          crm: authUser.user_metadata?.crm,
          cro: authUser.user_metadata?.cro
        })
        return
      }
      
      // Consultar tabela profiles para dados adicionais
      console.log('🔍 [loadUserProfile] Consultando tabela profiles...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      console.log('📋 [loadUserProfile] Profile data:', profileData)
      console.log('⚠️ [loadUserProfile] Profile error:', profileError)
      
      if (profileError) {
        console.log('❌ [loadUserProfile] Erro ao consultar profiles:', profileError)
        // Continuar com dados do auth mesmo com erro na tabela profiles
      }
      
      console.log('👤 [loadUserProfile] Auth user:', authUser)
      console.log('📋 [loadUserProfile] User metadata:', authUser.user_metadata)
      console.log('📧 [loadUserProfile] Email:', authUser.email)
      console.log('🔍 [loadUserProfile] Metadata keys:', Object.keys(authUser.user_metadata || {}))
      console.log('🔍 [loadUserProfile] Metadata values:', JSON.stringify(authUser.user_metadata, null, 2))
      
      if (authUser) {
        // Determinar tipo de usuário baseado nos metadados
        let userType: 'patient' | 'professional' | 'student' | 'admin' = 'patient'
        let userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário'
        let userCrm = authUser.user_metadata?.crm
        let userCro = authUser.user_metadata?.cro
        
        // Se temos dados da tabela profiles, usar eles
        if (profileData) {
          console.log('✅ [loadUserProfile] Usando dados da tabela profiles')
          userName = profileData.name || userName
          userCrm = profileData.crm || userCrm
          userCro = profileData.cro || userCro
        }
        
        // Verificar se há metadados que indiquem o tipo de usuário (PRIORIDADE)
        if (authUser.user_metadata?.user_type) {
          userType = authUser.user_metadata.user_type
          console.log('✅ [loadUserProfile] Usando user_type dos metadados:', userType)
        } else if (authUser.user_metadata?.role) {
          userType = authUser.user_metadata.role
          console.log('✅ [loadUserProfile] Usando role dos metadados:', userType)
        } else if (authUser.email === 'phpg69@gmail.com' || authUser.email?.includes('admin') || authUser.email?.includes('philip')) {
          // Forçar admin apenas para emails específicos (APENAS se não houver metadados)
          userType = 'admin'
          console.log('✅ [loadUserProfile] Forçando admin por email:', userType)
        } else {
          // Default para patient
          userType = 'patient'
          console.log('✅ [loadUserProfile] Default patient:', userType)
        }
        
        console.log('🎯 [loadUserProfile] Tipo de usuário determinado:', userType)
        
        const userData = {
          id: authUser.id,
          email: authUser.email || '',
          type: userType,
          name: userName,
          crm: userCrm,
          cro: userCro
        }
        
        console.log('📋 [loadUserProfile] Dados do usuário a serem definidos:', userData)
        setUser(userData)
        console.log('✅ [loadUserProfile] Usuário configurado com sucesso!')
        console.log('🔄 [loadUserProfile] Finalizando loadUserProfile com sucesso')
        
        // Debug será feito via useEffect que observa mudanças no user
      } else {
        console.log('❌ Nenhum usuário encontrado no Auth')
      }
    } catch (error) {
      console.error('❌ [loadUserProfile] Erro ao carregar perfil do usuário:', error)
      
      // Se for timeout, tentar uma abordagem alternativa
      if (error instanceof Error && error.message === 'Timeout') {
        console.log('⏰ Timeout detectado, tentando abordagem alternativa...')
        
        // Tentar usar o userId diretamente para criar um usuário básico
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            console.log('✅ Sessão encontrada após timeout, criando usuário básico')
            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              type: 'admin' as any, // Assumir admin para evitar problemas de acesso
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              crm: session.user.user_metadata?.crm,
              cro: session.user.user_metadata?.cro
            }
            setUser(userData)
            console.log('✅ Usuário básico criado após timeout')
            return
          }
        } catch (fallbackError) {
          console.error('Erro no fallback:', fallbackError)
          
          // Não criar usuário de emergência
          console.log('🚨 Erro no fallback - NÃO criando usuário de emergência')
          setIsLoading(false)
          setIsLoadingProfile(false)
          return
        }
      }
      
      // Apenas definir como não carregando, mas NÃO definir usuário como null
      // para evitar logout desnecessário
      console.log('⚠️ Erro no carregamento, mas mantendo estado atual do usuário')
    } finally {
      console.log('🔄 Finalizando carregamento - definindo isLoading como false')
      setIsLoading(false)
      setIsLoadingProfile(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      // Não chamar loadUserProfile aqui - o onAuthStateChange já vai chamar
      console.log('✅ Login realizado com sucesso, aguardando onAuthStateChange...')
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🔄 Iniciando logout...')
      // Forçar logout no Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Erro no signOut do Supabase:', error)
      }
      // Forçar limpeza do usuário
      setUser(null)
      console.log('✅ Logout realizado com sucesso')
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      // Mesmo com erro, limpar o usuário
      setUser(null)
    }
  }

  const register = async (email: string, password: string, userType: string, name: string) => {
    try {
      console.log('🔄 Iniciando registro para:', email, 'tipo:', userType)
      
      // Registrar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`
        }
      })

      if (authError) {
        console.error('❌ Erro no Supabase Auth:', authError.message)
        throw new Error(authError.message)
      }

      if (authData.user) {
        console.log('✅ Usuário criado no Supabase Auth:', authData.user.id)
        console.log('📧 Email de confirmação enviado para:', email)
        
        // Para desenvolvimento: criar usuário temporário sem confirmação
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Modo desenvolvimento: criando usuário temporário')
          const tempUser = {
            id: authData.user.id,
            email: email,
            type: userType as any,
            name: name,
            crm: undefined,
            cro: undefined
          }
          setUser(tempUser)
          setIsLoading(false)
          return
        }
        
        // Carregar perfil do usuário (sem inserir na tabela usuarios)
        await loadUserProfile(authData.user.id)
        console.log('✅ Perfil carregado com sucesso')
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}