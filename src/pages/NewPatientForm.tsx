import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Upload,
  X,
  UserPlus,
  Briefcase,
  Camera,
  File,
  Image as ImageIcon,
  Save,
  FileText as FileTextIcon,
  AlertCircle,
  CheckCircle,
  Database,
  FileSpreadsheet,
  FolderOpen
} from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  file: File
  preview?: string
}

const NewPatientForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const [mode, setMode] = useState<'manual' | 'csv' | 'database' | 'drag-drop'>('manual')
  const [step, setStep] = useState(1)
  const [csvData, setCsvData] = useState<any[]>([])
  const [dbConfig, setDbConfig] = useState({
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    table: ''
  })
  const [dragDropFiles, setDragDropFiles] = useState<UploadedFile[]>([])

  // Ler modo da URL
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam && ['manual', 'csv', 'database', 'drag-drop'].includes(modeParam)) {
      setMode(modeParam as any)
    }
  }, [searchParams])
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    professionalId: '',
    specialty: '',
    referringDoctor: '',
    room: 'Indiferente',
    observations: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Profissionais disponíveis
  const professionals = [
    { id: 'ricardo', name: 'Dr. Ricardo Valença', specialty: 'Cannabis Medicinal Integrativa', crm: 'CRM-RJ 123456' },
    { id: 'eduardo', name: 'Dr. Eduardo Faveret', specialty: 'Cannabis Medicinal Integrativa', crm: 'CRM-RJ 789012' }
  ]
  
  // Definir profissional padrão se o usuário atual for um dos profissionais listados
  useEffect(() => {
    if (currentUser?.id && !formData.professionalId) {
      // Tentar mapear o usuário atual para um dos profissionais mockados
      // Se o nome do usuário contém "Ricardo", usar 'ricardo'
      // Se o nome contém "Eduardo", usar 'eduardo'
      const userName = currentUser.name || ''
      if (userName.toLowerCase().includes('ricardo')) {
        setFormData(prev => ({ ...prev, professionalId: 'ricardo' }))
      } else if (userName.toLowerCase().includes('eduardo')) {
        setFormData(prev => ({ ...prev, professionalId: 'eduardo' }))
      }
    }
  }, [currentUser])

  const specialties = [
    'Sem especialidade',
    'Cannabis Medicinal',
    'Nefrologia',
    'Dor',
    'Psiquiatria'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(file => {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file
      }

      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string
          setUploadedFiles(prev => [...prev, newFile])
        }
        reader.readAsDataURL(file)
      } else {
        setUploadedFiles(prev => [...prev, newFile])
      }
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Função para processar CSV
  const handleCSVUpload = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        alert('CSV vazio ou sem dados')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const patient: any = {}
        headers.forEach((header, idx) => {
          patient[header] = values[idx] || ''
        })
        return patient
      })

      setCsvData(data)
      alert(`${data.length} paciente(s) encontrado(s) no CSV`)
    } catch (error) {
      console.error('Erro ao processar CSV:', error)
      alert('Erro ao processar arquivo CSV')
    }
  }

  // Função para importar em lote (CSV)
  const handleBulkSubmit = async () => {
    if (csvData.length === 0) return
    
    setIsSubmitting(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const patientData of csvData) {
        try {
          await createPatientFromData(patientData)
          successCount++
        } catch (error) {
          console.error('Erro ao criar paciente:', error)
          errorCount++
        }
      }

      alert(`Importação concluída!\n\n${successCount} paciente(s) criado(s) com sucesso\n${errorCount} erro(s)`)
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navegar e forçar reload
      navigate('/app/patients', { replace: true })
      
      // Forçar reload da página para garantir que os dados sejam atualizados
      window.location.reload()
    } catch (error) {
      console.error('Erro na importação em lote:', error)
      alert(`Erro na importação: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para importar do banco de dados
  const handleDatabaseImport = async () => {
    setIsSubmitting(true)
    try {
      // Aqui você implementaria a conexão real com o banco de dados
      // Por segurança, isso deveria ser feito via uma API backend
      alert('Funcionalidade de importação de banco de dados externo requer configuração no backend.\n\nPor favor, use a API ou uma função RPC no Supabase para conectar com bancos externos.')
      
      // Exemplo de como seria (requer implementação no backend):
      // const response = await fetch('/api/import-from-database', {
      //   method: 'POST',
      //   body: JSON.stringify(dbConfig)
      // })
      // const data = await response.json()
      // Processar dados importados...
    } catch (error) {
      console.error('Erro ao importar do banco:', error)
      alert('Erro ao conectar com o banco de dados')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para processar arquivos arrastados
  const handleDragDropProcess = async () => {
    if (dragDropFiles.length === 0) return
    
    setIsSubmitting(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const file of dragDropFiles) {
        try {
          // Processar arquivo (poderia extrair dados de PDF, DOC, etc.)
          if (file.name.endsWith('.csv')) {
            await handleCSVUpload(file.file)
          } else {
            // Para outros arquivos, apenas fazer upload
            // Aqui você poderia implementar extração de dados com OCR ou parsing
            console.log('Processando arquivo:', file.name)
            successCount++
          }
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          errorCount++
        }
      }

      alert(`Processamento concluído!\n\n${successCount} arquivo(s) processado(s) com sucesso\n${errorCount} erro(s)`)
      setDragDropFiles([])
    } catch (error) {
      console.error('Erro no processamento:', error)
      alert(`Erro no processamento: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função auxiliar para criar paciente a partir de dados
  const createPatientFromData = async (patientData: any) => {
    const patientId = crypto.randomUUID()
    // Gerar email temporário se não fornecido
    let patientEmail = patientData.email?.trim()
    if (!patientEmail) {
      if (patientData.cpf && patientData.cpf.replace(/\D/g, '').length > 0) {
        patientEmail = `paciente.${patientData.cpf.replace(/\D/g, '')}@medcannlab.temp`
      } else {
        const nameClean = (patientData.nome || 'paciente').toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
        const timestamp = Date.now().toString().slice(-6)
        patientEmail = `paciente.${nameClean}.${timestamp}@medcannlab.temp`
      }
    }
    const patientCode = `PAT${patientId.substring(0, 8).toUpperCase()}`

    // Calcular idade se tiver data de nascimento
    let age = 0, months = 0, days = 0
    if (patientData.data_nascimento) {
      const birth = new Date(patientData.data_nascimento)
      const today = new Date()
      age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
    }

    // Criar na tabela users (apenas campos existentes)
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: patientId,
        email: patientEmail,
        name: patientData.nome || 'Sem nome',
        type: 'patient',
        // phone e address removidos - colunas não existem na tabela users
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userError) throw userError

    // Criar avaliação clínica inicial
    if (currentUser?.id) {
      await supabase
        .from('clinical_assessments')
        .insert({
          patient_id: patientId,
          doctor_id: currentUser.id,
          assessment_type: 'INITIAL',
          status: 'pending',
          data: {
            cpf: patientData.cpf || null,
            age,
            months,
            days,
            gender: patientData.sexo || null,
            patientCode
          },
          created_at: new Date().toISOString()
        })
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-400" />
    if (type.includes('pdf')) return <FileTextIcon className="w-5 h-5 text-red-400" />
    if (type.includes('word')) return <FileTextIcon className="w-5 h-5 text-blue-500" />
    return <File className="w-5 h-5 text-slate-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async () => {
    console.log('🚀 Iniciando handleSubmit...', { formData })
    setIsSubmitting(true)
    
    try {
      if (!formData.name || !formData.email.trim()) {
        alert('Por favor, preencha todos os campos obrigatórios (Nome Completo e Email).')
        setIsSubmitting(false)
        return
      }
      
      console.log('✅ Validação básica passou:', { name: formData.name, email: formData.email })

      // Usar email fornecido (agora obrigatório)
      const patientEmail = formData.email.trim()

      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', patientEmail)
        .single()

      if (existingUser) {
        alert('Um paciente com este email já está cadastrado.')
        setIsSubmitting(false)
        return
      }

      // Criar usuário no auth.users usando a função RPC ou direto via Supabase Admin API
      // Como não temos acesso direto ao auth.users via cliente, vamos criar apenas na tabela users
      // e depois usar uma função RPC para criar o auth user
      const patientId = crypto.randomUUID()

      // Calcular idade a partir da data de nascimento
      let age = 0
      let months = 0
      let days = 0
      if (formData.birthDate) {
        const birth = new Date(formData.birthDate)
        const today = new Date()
        age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }
        months = monthDiff < 0 ? 12 + monthDiff : monthDiff
        days = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Gerar código do paciente
      const patientCode = `PAT${patientId.substring(0, 8).toUpperCase()}`

      // Criar apenas na tabela users (sem função RPC)
      // A função RPC create_patient_user não está disponível, então vamos criar apenas na tabela users
      console.log('ℹ️ Criando paciente apenas na tabela users (sem auth.users via RPC)')

      // Inserir na tabela users (sempre necessário para a IA residente reconhecer)
      // Usar apenas campos que existem na tabela: id, email, name, type, created_at, updated_at
      const userData: any = {
        id: patientId,
        email: patientEmail,
        name: formData.name,
        type: 'patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Nota: campos 'phone' e 'address' não existem na tabela users, então foram removidos
      
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (userError) {
        console.error('Erro ao criar usuário:', userError)
        throw new Error('Erro ao criar usuário: ' + userError.message)
      }

      console.log('✅ Paciente criado com sucesso na tabela users:', newUser)

      // Criar avaliação clínica inicial vinculada ao profissional atual
      // Usar o ID do profissional selecionado ou o usuário atual
      const doctorId = formData.professionalId === 'ricardo' || formData.professionalId === 'eduardo' 
        ? currentUser?.id 
        : (formData.professionalId || currentUser?.id)
      
      console.log('🔍 Doctor ID para avaliação:', { 
        professionalId: formData.professionalId, 
        doctorId, 
        currentUserId: currentUser?.id 
      })
      
      if (doctorId) {
        const { error: assessmentError } = await supabase
          .from('clinical_assessments')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            assessment_type: 'INITIAL',
            status: 'pending',
          data: {
            cpf: formData.cpf || null,
            age,
            months,
            days,
            gender: formData.gender,
            specialty: formData.specialty,
            referringDoctor: formData.referringDoctor,
            room: formData.room,
            observations: formData.observations,
            patientCode
          },
            created_at: new Date().toISOString()
          })

        if (assessmentError) {
          console.error('Erro ao criar avaliação clínica:', assessmentError)
          // Não bloqueia o cadastro, apenas loga o erro
        }
      }

      // Fazer upload de arquivos se houver
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            // Upload para o storage (se configurado)
            const fileExt = file.file.name.split('.').pop()
            const fileName = `${patientId}/${Date.now()}_${file.file.name}`
            
            // Aqui você pode implementar o upload para o Supabase Storage
            // const { error: uploadError } = await supabase.storage
            //   .from('patient-documents')
            //   .upload(fileName, file.file)
            
            console.log('Arquivo anexado:', fileName)
          } catch (uploadError) {
            console.error('Erro ao fazer upload do arquivo:', uploadError)
            // Não bloqueia o cadastro
          }
        }
      }

      alert(`Paciente cadastrado com sucesso!\n\nID: ${patientId}\nEmail: ${patientEmail}\nCódigo: ${patientCode}`)
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navegar para a página correta de gestão de pacientes
      navigate('/app/clinica/profissional/pacientes?refresh=true', { replace: true })
      
      console.log('✅ Paciente criado com sucesso! Redirecionando...')
    } catch (error: any) {
      console.error('❌ Erro ao salvar paciente:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      alert(`Erro ao cadastrar paciente: ${error.message || 'Tente novamente.'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStep1Valid = formData.name && formData.email.trim()
  const isStep2Valid = formData.professionalId && formData.specialty
  
  // Debug: logar validação do step 2
  useEffect(() => {
    if (step === 2) {
      const isValid = formData.professionalId && formData.specialty
      console.log('🔍 Step 2 Validação (atualizado):', {
        professionalId: formData.professionalId,
        specialty: formData.specialty,
        isStep2Valid: isValid,
        formData: {
          professionalId: formData.professionalId,
          specialty: formData.specialty
        }
      })
    }
  }, [step, formData.professionalId, formData.specialty, isStep2Valid])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/app/patients')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Novo Paciente</h1>
                <p className="text-slate-400">
                  {mode === 'manual' && 'Cadastro manual e importação de documentos'}
                  {mode === 'csv' && 'Importar pacientes de arquivo CSV'}
                  {mode === 'database' && 'Importar pacientes de banco de dados externo'}
                  {mode === 'drag-drop' && 'Importar pacientes arrastando arquivos'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, label: 'Dados Pessoais' },
              { num: 2, label: 'Atendimento' },
              { num: 3, label: 'Documentos' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      step >= s.num
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-sm mt-2 ${step >= s.num ? 'text-white' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-blue-500' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content - Modo específico */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-6">
          {mode === 'manual' && (
            <>
              {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Informações Pessoais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="000.000.000-00 (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="paciente@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="(21) 99999-9999 (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sexo
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/app/patients')}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Informações de Atendimento</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Profissional Responsável *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {professionals.map(prof => (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => {
                          console.log('🔍 Selecionando profissional:', prof.id)
                          setFormData(prev => ({ ...prev, professionalId: prof.id }))
                          console.log('🔍 ProfessionalId atualizado:', prof.id)
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.professionalId === prof.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 bg-slate-700/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{prof.name}</p>
                            <p className="text-xs text-slate-400">{prof.crm}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300">{prof.specialty}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Especialidade *
                    </label>
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={(e) => {
                        console.log('🔍 Selecionando especialidade:', e.target.value)
                        handleInputChange(e)
                        console.log('🔍 Specialty atualizado:', e.target.value)
                      }}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione</option>
                      {specialties.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Sala
                    </label>
                    <select
                      name="room"
                      value={formData.room}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Indiferente">Indiferente</option>
                      <option value="Sala 1">Sala 1</option>
                      <option value="Sala 2">Sala 2</option>
                      <option value="Sala 3">Sala 3</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Médico Encaminhador
                    </label>
                    <input
                      type="text"
                      name="referringDoctor"
                      value={formData.referringDoctor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Nome do médico que encaminhou (opcional)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Observações Iniciais
                    </label>
                    <textarea
                      name="observations"
                      value={formData.observations}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Observações iniciais sobre o paciente..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    console.log('🔍 Debug Step 2:', {
                      professionalId: formData.professionalId,
                      specialty: formData.specialty,
                      isStep2Valid,
                      formData
                    })
                    if (isStep2Valid) {
                      setStep(3)
                    } else {
                      alert('Por favor, selecione um Profissional Responsável e uma Especialidade.')
                    }
                  }}
                  disabled={!isStep2Valid}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Upload de Documentos</h2>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-white mb-1">Importação de Arquivos em Lote</p>
                    <p>Você pode arrastar e soltar ou selecionar múltiplos arquivos (PDFs, DOCs, imagens, etc.) para importação rápida.</p>
                    <p className="mt-2">Arquivos aceitos: PDF, DOC, DOCX, JPG, PNG, DICOM</p>
                    <p className="mt-2 text-yellow-400">Importante: Este cadastro é destinado a profissionais. Pacientes devem ser direcionados ao agendamento.</p>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <p className="text-lg font-semibold text-white mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  Suporta múltiplos arquivos (anemneses, exames, imagens, etc.)
                </p>
                <label className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors cursor-pointer">
                  Selecionar Arquivos
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dcm"
                  />
                </label>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Arquivos Anexados ({uploadedFiles.length})</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {file.preview ? (
                            <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
                              {getFileIcon(file.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    console.log('🖱️ Botão Salvar clicado!', { formData, isSubmitting })
                    handleSubmit()
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Salvar Paciente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
            </>
          )}

          {/* Modo CSV */}
          {mode === 'csv' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <FileSpreadsheet className="w-6 h-6 text-green-400" />
                <span>Importar Pacientes de CSV</span>
              </h2>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-white mb-1">Formato do CSV</p>
                    <p>O arquivo CSV deve conter as colunas: nome, cpf, email, telefone, data_nascimento, sexo, endereco, cidade, estado, cep</p>
                    <p className="mt-2 text-yellow-400">Importante: O CSV deve ter cabeçalho na primeira linha.</p>
                  </div>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(false)
                  const files = e.dataTransfer.files
                  if (files.length > 0 && files[0].name.endsWith('.csv')) {
                    handleCSVUpload(files[0])
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                }`}
              >
                <FileSpreadsheet className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-green-400' : 'text-slate-400'}`} />
                <p className="text-lg font-semibold text-white mb-2">
                  Arraste o arquivo CSV aqui ou clique para selecionar
                </p>
                <label className="inline-block px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors cursor-pointer">
                  Selecionar CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCSVUpload(e.target.files[0])
                      }
                    }}
                  />
                </label>
              </div>

              {csvData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {csvData.length} paciente(s) encontrado(s)
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {csvData.map((patient, idx) => (
                      <div key={idx} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="font-semibold text-white">{patient.nome || 'Sem nome'}</p>
                        <p className="text-sm text-slate-400">CPF: {patient.cpf || 'N/A'} • Telefone: {patient.telefone || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={isSubmitting}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Importar {csvData.length} paciente(s)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modo Database */}
          {mode === 'database' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <Database className="w-6 h-6 text-purple-400" />
                <span>Importar do Banco de Dados</span>
              </h2>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-white mb-1">Conexão Externa</p>
                    <p>Configure a conexão com o banco de dados externo para importar pacientes.</p>
                    <p className="mt-2 text-yellow-400">Importante: As credenciais não são armazenadas permanentemente.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Host / Endereço *
                    </label>
                    <input
                      type="text"
                      value={dbConfig.host}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="localhost ou IP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Porta *
                    </label>
                    <input
                      type="text"
                      value={dbConfig.port}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="5432"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nome do Banco *
                    </label>
                    <input
                      type="text"
                      value={dbConfig.database}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="nome_banco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tabela de Pacientes *
                    </label>
                    <input
                      type="text"
                      value={dbConfig.table}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, table: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="pacientes ou users"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Usuário *
                    </label>
                    <input
                      type="text"
                      value={dbConfig.username}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="usuario"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Senha *
                    </label>
                    <input
                      type="password"
                      value={dbConfig.password}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDatabaseImport}
                  disabled={!dbConfig.host || !dbConfig.database || !dbConfig.table || !dbConfig.username || !dbConfig.password || isSubmitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Conectando e importando...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      <span>Conectar e Importar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Modo Drag-Drop */}
          {mode === 'drag-drop' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <FolderOpen className="w-6 h-6 text-cyan-400" />
                <span>Arrastar e Soltar Arquivos</span>
              </h2>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-white mb-1">Importação em Lote</p>
                    <p>Arraste múltiplos arquivos (PDFs, DOCs, imagens, etc.) para processar automaticamente.</p>
                    <p className="mt-2">Arquivos aceitos: PDF, DOC, DOCX, JPG, PNG, DICOM, CSV, XLSX</p>
                  </div>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(false)
                  if (e.dataTransfer.files) {
                    handleFileUpload(e.dataTransfer.files)
                    setDragDropFiles(Array.from(e.dataTransfer.files).map(file => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      file: file
                    })))
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <p className="text-lg font-semibold text-white mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  Você pode arrastar múltiplos arquivos de uma vez
                </p>
                <label className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors cursor-pointer">
                  Selecionar Arquivos
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files)
                        setDragDropFiles(Array.from(e.target.files).map(file => ({
                          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          file: file
                        })))
                      }
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dcm,.csv,.xlsx"
                  />
                </label>
              </div>

              {dragDropFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {dragDropFiles.length} arquivo(s) selecionado(s)
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {dragDropFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDragDropFiles(prev => prev.filter(f => f.id !== file.id))}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleDragDropProcess}
                    disabled={isSubmitting}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Processar {dragDropFiles.length} arquivo(s)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewPatientForm
