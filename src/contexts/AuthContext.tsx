import React, { createContext, useContext, useState } from 'react'

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

  const login = async (email: string, _password: string) => {
    // Simulação de login - em produção seria com Supabase
    let userType: 'patient' | 'professional' | 'student' | 'admin' = 'patient'
    let userName = 'Usuário Teste'
    let crm = undefined
    let cro = undefined

    if (email === 'phpg69@gmail.com') {
      userType = 'admin'
      userName = 'Administrador'
    } else if (email === 'passosmir4@gmail.com') {
      userType = 'professional'
      userName = 'Dr. Passos Mir'
      crm = '12345-SP'
    } else if (email === 'breakinglegs@hotmail.com') {
      userType = 'patient'
      userName = 'Paciente Breaking Legs'
    }

    const mockUser: User = {
      id: '1',
      email: email,
      type: userType,
      name: userName,
      crm: crm,
      cro: cro
    }
    setUser(mockUser)
  }

  const logout = async () => {
    setUser(null)
  }

  const register = async (email: string, _password: string, userType: string, name: string) => {
    // Simulação de registro - em produção seria com Supabase
    let crm = undefined
    let cro = undefined

    // Adicionar CRM para profissionais
    if (userType === 'professional' && email === 'passosmir4@gmail.com') {
      crm = '12345-SP'
    }
    
    // Definir nome específico para paciente
    if (userType === 'patient' && email === 'breakinglegs@hotmail.com') {
      name = 'Paciente Breaking Legs'
    }

    const mockUser: User = {
      id: '1',
      email: email,
      type: userType as 'patient' | 'professional' | 'student' | 'admin',
      name: name,
      crm: crm,
      cro: cro
    }
    setUser(mockUser)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}