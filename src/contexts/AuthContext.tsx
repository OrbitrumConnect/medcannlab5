import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  type: 'patient' | 'professional' | 'student' | 'admin'
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Verificar se o usuário já está logado
  useEffect(() => {
    let isMounted = true

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, 'Session:', !!session)
      if (isMounted) {
        if (session?.user) {
          console.log('👤 Usuário no auth state change:', session.user.id)
          await loadUserProfile(session.user.id)
        } else {
          console.log('❌ Nenhum usuário no auth state change')
          setUser(null)
        }
        console.log('🔄 Auth state change - definindo isLoading como false')
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    // Evitar chamadas duplicadas
    if (isLoadingProfile) {
      console.log('⏳ Já carregando perfil, ignorando chamada duplicada')
      return
    }

    setIsLoadingProfile(true)
    console.log('🔄 Iniciando carregamento do perfil...')
    
    try {
      console.log('🔍 Carregando perfil para userId:', userId)
      
      // Usar dados diretamente do Supabase Auth
      console.log('🔍 Carregando dados do usuário do Supabase Auth...')
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('👤 Auth user:', authUser)
      
      if (authUser) {
        // Determinar tipo de usuário baseado nos metadados
        let userType: 'patient' | 'professional' | 'student' | 'admin' = 'patient'
        
        // Verificar se há metadados que indiquem o tipo de usuário
        if (authUser.user_metadata?.user_type) {
          userType = authUser.user_metadata.user_type
        } else if (authUser.user_metadata?.role) {
          userType = authUser.user_metadata.role
        } else {
          // Default para patient
          userType = 'patient'
        }
        
        console.log('🎯 Tipo de usuário determinado:', userType)
        
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          type: userType,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          crm: authUser.user_metadata?.crm,
          cro: authUser.user_metadata?.cro
        })
        
        console.log('✅ Usuário configurado com sucesso!')
      } else {
        console.log('❌ Nenhum usuário encontrado no Auth')
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error)
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

      if (data.user) {
        await loadUserProfile(data.user.id)
      }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const register = async (email: string, password: string, userType: string, name: string) => {
    try {
      // Registrar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (authData.user) {
        // Criar perfil na tabela usuarios
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            nome: name,
            nivel: userType,
            permissoes: {
              crm: userType === 'professional' ? null : undefined,
              cro: userType === 'professional' ? null : undefined
            }
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }

        // Carregar perfil do usuário
        await loadUserProfile(authData.user.id)
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}