import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import * as XLSX from 'xlsx'
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Upload,
  X,
  UserPlus,
  Image as ImageIcon,
  FileText as FileTextIcon,
  AlertCircle,
  CheckCircle,
  Database,
  Download,
  QrCode,
  Copy,
  Share2,
  ExternalLink
} from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  file: File
  preview?: string
}

interface CreatedPatientResult {
  id: string
  name: string
  email: string
  code: string
  inviteLink: string
}

const NewPatientForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const [mode, setMode] = useState<'manual' | 'csv' | 'database' | 'drag-drop' | null>(null)
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
  const [createdPatient, setCreatedPatient] = useState<CreatedPatientResult | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

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
    specialty: '',
    referringDoctor: '',
    room: 'Indiferente',
    observations: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dados do profissional logado
  const [currentProfessional, setCurrentProfessional] = useState<{
    id: string
    name: string
    crm?: string
    specialty?: string
  } | null>(null)

  // Carregar dados do profissional logado
  useEffect(() => {
    if (!currentUser?.id) return
    const loadProfessional = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name, crm, council_number, council_state, type')
        .eq('id', currentUser.id)
        .single()

      if (data) {
        const crmDisplay = data.crm || (data.council_number ? `CRM-${data.council_state || 'RJ'} ${data.council_number}` : '')
        setCurrentProfessional({
          id: data.id,
          name: data.name,
          crm: crmDisplay,
          specialty: 'Cannabis Medicinal Integrativa'
        })
      }
    }
    loadProfessional()
  }, [currentUser?.id])

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

  // Função para mapear colunas de diferentes sistemas
  const mapColumnName = (header: string): string => {
    const lower = header.toLowerCase().trim()
    const columnMap: Record<string, string> = {
      'nome': 'nome', 'nome completo': 'nome', 'paciente': 'nome', 'nome do paciente': 'nome', 'nome_paciente': 'nome',
      'cpf': 'cpf', 'documento': 'cpf', 'cpf/cnpj': 'cpf',
      'email': 'email', 'e-mail': 'email', 'correio eletrônico': 'email',
      'telefone': 'telefone', 'celular': 'telefone', 'fone': 'telefone', 'contato': 'telefone', 'telefone/celular': 'telefone',
      'data de nascimento': 'data_nascimento', 'data nascimento': 'data_nascimento', 'nascimento': 'data_nascimento',
      'dt nasc': 'data_nascimento', 'dt_nasc': 'data_nascimento', 'data_nascimento': 'data_nascimento',
      'sexo': 'sexo', 'genero': 'sexo', 'gênero': 'sexo',
      'endereço': 'endereco', 'endereco': 'endereco', 'rua': 'endereco', 'logradouro': 'endereco',
      'cidade': 'cidade', 'município': 'cidade', 'municipio': 'cidade',
      'estado': 'estado', 'uf': 'estado', 'estado/uf': 'estado',
      'cep': 'cep', 'código postal': 'cep', 'codigo postal': 'cep'
    }
    return columnMap[lower] || lower
  }

  const handleExcelUpload = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      if (jsonData.length < 2) { alert('Planilha vazia ou sem dados'); return }
      const headers = (jsonData[0] as string[]).map(h => mapColumnName(String(h || '')))
      const data = jsonData.slice(1)
        .filter(row => row && row.length > 0 && row.some(cell => cell))
        .map(row => {
          const patient: any = {}
          headers.forEach((header, idx) => {
            const value = row[idx]
            if (value !== null && value !== undefined) {
              if (header === 'data_nascimento' && typeof value === 'number') {
                const excelDate = XLSX.SSF.parse_date_code(value)
                if (excelDate) {
                  patient[header] = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
                } else { patient[header] = String(value) }
              } else { patient[header] = String(value).trim() }
            } else { patient[header] = '' }
          })
          return patient
        })
      setCsvData(data)
      alert(`${data.length} paciente(s) encontrado(s) na planilha`)
    } catch (error) {
      console.error('Erro ao processar Excel:', error)
      alert('Erro ao processar arquivo Excel.')
    }
  }

  const handleCSVUpload = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) { alert('CSV vazio ou sem dados'); return }
      const separator = lines[0].includes(';') ? ';' : ','
      const headers = lines[0].split(separator).map((h: string) => mapColumnName(h.trim()))
      const data = lines.slice(1)
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const values = line.split(separator).map((v: string) => v.trim().replace(/^["']|["']$/g, ''))
          const patient: any = {}
          headers.forEach((header: string, idx: number) => { patient[header] = values[idx] || '' })
          return patient
        })
        .filter((patient: any) => patient.nome && patient.nome.trim())
      setCsvData(data)
      alert(`${data.length} paciente(s) encontrado(s) no CSV`)
    } catch (error) {
      console.error('Erro ao processar CSV:', error)
      alert('Erro ao processar arquivo CSV')
    }
  }

  const handleSpreadsheetUpload = async (file: File) => {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      await handleExcelUpload(file)
    } else if (fileName.endsWith('.csv')) {
      await handleCSVUpload(file)
    } else {
      alert('Formato não suportado. Use arquivos CSV ou Excel (.xlsx, .xls)')
    }
  }

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
      await new Promise(resolve => setTimeout(resolve, 500))
      navigate('/app/patients', { replace: true })
      window.location.reload()
    } catch (error) {
      console.error('Erro na importação em lote:', error)
      alert(`Erro na importação: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDatabaseImport = async () => {
    setIsSubmitting(true)
    try {
      alert('Funcionalidade de importação de banco de dados externo requer configuração no backend.')
    } catch (error) {
      console.error('Erro ao importar do banco:', error)
      alert('Erro ao conectar com o banco de dados')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDragDropProcess = async () => {
    if (dragDropFiles.length === 0) return
    setIsSubmitting(true)
    let successCount = 0
    let errorCount = 0
    try {
      for (const file of dragDropFiles) {
        try {
          if (file.name.endsWith('.csv')) {
            await handleCSVUpload(file.file)
          } else {
            console.log('Processando arquivo:', file.name)
            successCount++
          }
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          errorCount++
        }
      }
      alert(`Processamento concluído!\n\n${successCount} arquivo(s) processado(s)\n${errorCount} erro(s)`)
      setDragDropFiles([])
    } catch (error) {
      console.error('Erro no processamento:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função auxiliar para criar paciente a partir de dados (CSV/bulk)
  const createPatientFromData = async (patientData: any) => {
    const patientId = crypto.randomUUID()
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

    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: patientId,
        email: patientEmail,
        name: patientData.nome || 'Sem nome',
        type: 'paciente',
        phone: patientData.telefone || null,
        cpf: patientData.cpf || null,
        gender: patientData.sexo ? (
          patientData.sexo.toLowerCase().startsWith('m') ? 'M' : 
          patientData.sexo.toLowerCase().startsWith('f') ? 'F' : 'Outro'
        ) : null,
        address: patientData.endereco || null,
        invited_by: currentUser?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userError) throw userError

    // Criar role
    await supabase.from('user_roles').insert({
      user_id: patientId,
      role: 'paciente'
    }).single()

    // Criar avaliação clínica inicial
    if (currentUser?.id) {
      await supabase.from('clinical_assessments').insert({
        patient_id: patientId,
        doctor_id: currentUser.id,
        assessment_type: 'INITIAL',
        status: 'pending',
        data: { cpf: patientData.cpf || null, gender: patientData.sexo || null },
        created_at: new Date().toISOString()
      })
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-400" />
    if (type.includes('pdf')) return <FileTextIcon className="w-5 h-5 text-red-400" />
    if (type.includes('word')) return <FileTextIcon className="w-5 h-5 text-blue-500" />
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return <Download className="w-5 h-5 text-green-400" />
    return <FileTextIcon className="w-5 h-5 text-slate-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Gerar link de convite
  const generateInviteLink = (professionalId: string): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/invite?doctor_id=${professionalId}`
  }

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
    }
  }

  const handleShareWhatsApp = (link: string, patientName: string) => {
    const message = encodeURIComponent(
      `Olá ${patientName}! 🌿\n\nVocê foi cadastrado(a) na plataforma MedCannLab pelo(a) ${currentProfessional?.name || 'seu profissional de saúde'}.\n\nPara acessar sua área de paciente, clique no link abaixo e crie sua conta:\n\n${link}\n\nEsse link já vincula você automaticamente ao seu profissional. 💚`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      if (!formData.name || !formData.email.trim()) {
        alert('Por favor, preencha Nome Completo e Email.')
        setIsSubmitting(false)
        return
      }

      if (!currentProfessional?.id) {
        alert('Erro: profissional não identificado. Faça login novamente.')
        setIsSubmitting(false)
        return
      }

      const patientEmail = formData.email.trim().toLowerCase()

      // Verificar se email já existe
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

      const patientId = crypto.randomUUID()
      const patientCode = `PAT${patientId.substring(0, 8).toUpperCase()}`

      // Calcular idade
      let age = 0
      if (formData.birthDate) {
        const birth = new Date(formData.birthDate)
        const today = new Date()
        age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
      }

      // Inserir na tabela users com tipo CORRETO e vínculo ao profissional
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: patientId,
          email: patientEmail,
          name: formData.name,
          type: 'paciente',
          cpf: formData.cpf || null,
          phone: formData.phone || null,
          birth_date: formData.birthDate || null,
          gender: formData.gender ? (
            formData.gender.toLowerCase().startsWith('m') ? 'M' : 
            formData.gender.toLowerCase().startsWith('f') ? 'F' : 'Outro'
          ) : null,
          address: formData.address ? `${formData.address}, ${formData.city} - ${formData.state}` : null,
          invited_by: currentProfessional.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (userError) {
        console.error('Erro ao criar usuário:', userError)
        throw new Error('Erro ao criar usuário: ' + userError.message)
      }

      // Criar role 'paciente'
      await supabase.from('user_roles').insert({
        user_id: patientId,
        role: 'paciente'
      })

      // Criar avaliação clínica inicial vinculada ao profissional REAL
      const { error: assessmentError } = await supabase
        .from('clinical_assessments')
        .insert({
          patient_id: patientId,
          doctor_id: currentProfessional.id,
          assessment_type: 'INITIAL',
          status: 'pending',
          data: {
            cpf: formData.cpf || null,
            age,
            gender: formData.gender,
            specialty: formData.specialty,
            referringDoctor: formData.referringDoctor,
            room: formData.room,
            observations: formData.observations,
            patientCode,
            registeredBy: currentProfessional.name
          },
          created_at: new Date().toISOString()
        })

      if (assessmentError) {
        console.error('Erro ao criar avaliação clínica:', assessmentError)
      }

      // Criar agendamento inicial (link profissional-paciente via appointments)
      await supabase.from('appointments').insert({
        patient_id: patientId,
        professional_id: currentProfessional.id,
        appointment_date: new Date().toISOString(),
        title: 'Cadastro Inicial',
        status: 'completed',
        description: `Paciente cadastrado por ${currentProfessional.name}. ${formData.observations || ''}`
      })

      // Upload de arquivos
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            const fileName = `${patientId}/${Date.now()}_${file.file.name}`
            console.log('Arquivo anexado:', fileName)
            // TODO: Implementar upload para Supabase Storage quando bucket estiver configurado
          } catch (uploadError) {
            console.error('Erro ao fazer upload:', uploadError)
          }
        }
      }

      // Gerar link de convite
      const inviteLink = generateInviteLink(currentProfessional.id)

      // Mostrar tela de sucesso com QR Code
      setCreatedPatient({
        id: patientId,
        name: formData.name,
        email: patientEmail,
        code: patientCode,
        inviteLink
      })
      setStep(4) // Step 4 = Tela de sucesso

    } catch (error: any) {
      console.error('❌ Erro ao salvar paciente:', error)
      alert(`Erro ao cadastrar paciente: ${error.message || 'Tente novamente.'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStep1Valid = formData.name && formData.email.trim()
  const isStep2Valid = !!currentProfessional && !!formData.specialty

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
                  {mode === null && 'Escolha o método de cadastro'}
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
        {/* Tela de Seleção Inicial */}
        {mode === null && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Como deseja cadastrar os pacientes?</h2>
              <p className="text-slate-400 text-center mb-8">Escolha o método mais adequado para seu caso</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setMode('manual')}
                  className="group relative bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-2 border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 hover:from-blue-600/30 hover:to-blue-800/30 transition-all duration-300 text-left"
                >
                  <div className="flex flex-col items-start space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00c16a] to-[#00a85a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Cadastro Manual</h3>
                      <p className="text-slate-300 text-sm">
                        Cadastre pacientes um a um. Ao final, gere um link/QR Code para enviar ao paciente.
                      </p>
                    </div>
                    <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300">
                      <span>Começar cadastro manual</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('csv')}
                  className="group relative bg-gradient-to-br from-green-600/20 to-emerald-800/20 border-2 border-green-500/30 rounded-xl p-6 hover:border-green-500/60 hover:from-green-600/30 hover:to-emerald-800/30 transition-all duration-300 text-left"
                >
                  <div className="flex flex-col items-start space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Importação em Massa (CSV)</h3>
                      <p className="text-slate-300 text-sm">
                        Importe múltiplos pacientes de uma vez através de arquivo CSV ou Excel.
                      </p>
                    </div>
                    <div className="flex items-center text-green-400 font-semibold group-hover:text-green-300">
                      <span>Importar CSV</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-300">
                      <p className="font-semibold text-white mb-1">Dica:</p>
                      <p>Você pode importar planilhas do <strong>Apollo/Ninsaúde</strong> ou da <strong>Clínica de Rio Bonito</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {mode !== null && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[
                { num: 1, label: 'Dados Pessoais' },
                { num: 2, label: 'Atendimento' },
                { num: 3, label: 'Documentos' },
                ...(step === 4 ? [{ num: 4, label: 'Convite' }] : [])
              ].map((s, idx, arr) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s.num
                        ? step === 4 && s.num === 4
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                        }`}
                    >
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm mt-2 ${step >= s.num ? 'text-white' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-blue-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão Voltar */}
        {mode !== null && step < 4 && (
          <div className="mb-4">
            <button
              onClick={() => {
                setMode(null)
                setStep(1)
                setCsvData([])
                setDragDropFiles([])
              }}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para seleção</span>
            </button>
          </div>
        )}

        {/* ===== STEP 4: SUCESSO + QR CODE ===== */}
        {step === 4 && createdPatient && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 mb-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Paciente Cadastrado! 🎉</h2>
              <p className="text-slate-300">
                <strong>{createdPatient.name}</strong> foi adicionado(a) à plataforma e vinculado(a) a você.
              </p>
            </div>

            {/* Info do paciente */}
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-600/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Nome</p>
                  <p className="text-white font-semibold">{createdPatient.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="text-white font-semibold">{createdPatient.email}</p>
                </div>
                <div>
                  <p className="text-slate-400">Código</p>
                  <p className="text-white font-semibold font-mono">{createdPatient.code}</p>
                </div>
              </div>
            </div>

            {/* QR Code + Link */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <QrCode className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Link de Convite</h3>
              </div>
              <p className="text-slate-300 text-sm mb-6">
                Envie este link ou QR Code para o paciente. Ao acessar, ele poderá criar sua conta e já ficará vinculado a você automaticamente.
              </p>

              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdPatient.inviteLink)}&color=0-0-0&bgcolor=255-255-255&format=png`}
                    alt="QR Code de Convite"
                    className="w-48 h-48"
                  />
                </div>

                {/* Ações */}
                <div className="flex-1 space-y-4 w-full">
                  {/* Link copiável */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Link de convite</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={createdPatient.inviteLink}
                        readOnly
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-mono border border-slate-600"
                      />
                      <button
                        onClick={() => handleCopyLink(createdPatient.inviteLink)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                          linkCopied 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-600 hover:bg-slate-500 text-white'
                        }`}
                      >
                        {linkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {linkCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Botão WhatsApp */}
                  <button
                    onClick={() => handleShareWhatsApp(createdPatient.inviteLink, createdPatient.name)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-semibold flex items-center justify-center gap-3 text-lg"
                  >
                    <Share2 className="w-5 h-5" />
                    Enviar via WhatsApp
                  </button>

                  {/* Botão compartilhar nativo */}
                  {navigator.share && (
                    <button
                      onClick={() => {
                        navigator.share({
                          title: 'Convite MedCannLab',
                          text: `Olá ${createdPatient.name}! Acesse sua área de paciente no MedCannLab:`,
                          url: createdPatient.inviteLink
                        })
                      }}
                      className="w-full px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Compartilhar de outra forma
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instrução */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-white mb-1">Como funciona para o paciente:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>O paciente recebe o link via WhatsApp ou outro meio</li>
                    <li>Acessa o link e cria sua conta com email e senha</li>
                    <li>Automaticamente fica vinculado a você como profissional</li>
                    <li>Já pode acessar o dashboard de paciente e iniciar o acompanhamento</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Botões finais */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => {
                  setCreatedPatient(null)
                  setStep(1)
                  setFormData({
                    name: '', cpf: '', email: '', phone: '', birthDate: '', gender: '',
                    address: '', city: '', state: '', zipCode: '', specialty: '',
                    referringDoctor: '', room: 'Indiferente', observations: ''
                  })
                  setUploadedFiles([])
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Cadastrar Outro Paciente
              </button>
              <button
                onClick={() => navigate('/app/patients')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                Voltar para Pacientes
              </button>
            </div>
          </div>
        )}

        {/* Form Content */}
        {mode !== null && step < 4 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-6">
            {mode === 'manual' && (
              <>
                {/* STEP 1 - Dados Pessoais */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Informações Pessoais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="Digite o nome completo" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">CPF</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="000.000.000-00 (opcional)" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="paciente@email.com" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="(21) 99999-9999 (opcional)" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Data de Nascimento</label>
                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Sexo</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                          <option value="">Selecione</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Endereço</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="Rua, número, complemento" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Cidade</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="Nome da cidade" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
                        <input type="text" name="state" value={formData.state} onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          placeholder="UF" maxLength={2} />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button onClick={() => navigate('/app/patients')}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={() => setStep(2)} disabled={!isStep1Valid}
                        className="px-6 py-2 bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Próximo
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 - Atendimento (profissional auto-selecionado) */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Informações de Atendimento</h2>
                    <div className="space-y-4">
                      {/* Profissional auto-detectado */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Profissional Responsável
                        </label>
                        {currentProfessional ? (
                          <div className="p-4 rounded-lg border-2 border-emerald-500 bg-emerald-500/10">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-white">{currentProfessional.name}</p>
                                {currentProfessional.crm && (
                                  <p className="text-xs text-slate-400">{currentProfessional.crm}</p>
                                )}
                              </div>
                              <div className="ml-auto">
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                                  ✓ Você
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-300">{currentProfessional.specialty || 'Cannabis Medicinal Integrativa'}</p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            Carregando dados do profissional...
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Especialidade *</label>
                          <select name="specialty" value={formData.specialty} onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="">Selecione</option>
                            {specialties.map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Sala</label>
                          <select name="room" value={formData.room} onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="Indiferente">Indiferente</option>
                            <option value="Sala 1">Sala 1</option>
                            <option value="Sala 2">Sala 2</option>
                            <option value="Sala 3">Sala 3</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Médico Encaminhador</label>
                          <input type="text" name="referringDoctor" value={formData.referringDoctor} onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            placeholder="Nome do médico que encaminhou (opcional)" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Observações Iniciais</label>
                          <textarea name="observations" value={formData.observations} onChange={handleInputChange} rows={4}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            placeholder="Observações iniciais sobre o paciente..." />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button onClick={() => setStep(1)}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                        Voltar
                      </button>
                      <button
                        onClick={() => { if (isStep2Valid) setStep(3) }}
                        disabled={!isStep2Valid}
                        className="px-6 py-2 bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Próximo
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 - Documentos */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Upload de Documentos</h2>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="text-sm text-slate-300">
                          <p className="font-semibold text-white mb-1">Importação de Arquivos em Lote</p>
                          <p>Arraste e solte ou selecione múltiplos arquivos (PDFs, DOCs, imagens, etc.).</p>
                          <p className="mt-2">Arquivos aceitos: PDF, DOC, DOCX, JPG, PNG, DICOM</p>
                        </div>
                      </div>
                    </div>

                    <div
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                        }`}
                    >
                      <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <p className="text-lg font-semibold text-white mb-2">Arraste arquivos aqui ou clique para selecionar</p>
                      <p className="text-sm text-slate-400 mb-4">Suporta múltiplos arquivos (anamneses, exames, imagens, etc.)</p>
                      <label className="inline-block px-6 py-2 bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors cursor-pointer">
                        Selecionar Arquivos
                        <input type="file" multiple className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dcm" />
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">Arquivos Anexados ({uploadedFiles.length})</h3>
                        <div className="space-y-2">
                          {uploadedFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
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
                              <button onClick={() => removeFile(file.id)} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-4">
                      <button onClick={() => setStep(2)}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                        Voltar
                      </button>
                      <button
                        onClick={handleSubmit}
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
                            <CheckCircle className="w-5 h-5" />
                            <span>Finalizar Cadastro</span>
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
                  <Download className="w-6 h-6 text-green-400" />
                  <span>Importar Pacientes em Massa</span>
                </h2>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-300">
                      <p className="font-semibold text-white mb-2">Formatos Suportados</p>
                      <p className="mb-2">✅ <strong>CSV</strong> (.csv) &bull; ✅ <strong>Excel</strong> (.xlsx, .xls)</p>
                      <p className="mt-2 text-green-400">💡 O sistema reconhece automaticamente diferentes nomes de colunas.</p>
                    </div>
                  </div>
                </div>
                <div
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); setDragActive(false)
                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                      const fileName = files[0].name.toLowerCase()
                      if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                        handleSpreadsheetUpload(files[0])
                      } else { alert('Formato não suportado.') }
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive
                    ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'}`}
                >
                  <Download className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-green-400' : 'text-slate-400'}`} />
                  <p className="text-lg font-semibold text-white mb-2">Arraste sua planilha aqui ou clique para selecionar</p>
                  <label className="inline-block px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors cursor-pointer">
                    Selecionar Planilha
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleSpreadsheetUpload(e.target.files[0]) }} />
                  </label>
                </div>
                {csvData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-4">{csvData.length} paciente(s) encontrado(s)</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {csvData.map((patient, idx) => (
                        <div key={idx} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                          <p className="font-semibold text-white">{patient.nome || 'Sem nome'}</p>
                          <p className="text-sm text-slate-400">CPF: {patient.cpf || 'N/A'} • Tel: {patient.telefone || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleBulkSubmit} disabled={isSubmitting}
                      className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
                      {isSubmitting ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Importando...</span></>
                      ) : (
                        <><CheckCircle className="w-5 h-5" /><span>Importar {csvData.length} paciente(s)</span></>
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
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Host *</label>
                      <input type="text" value={dbConfig.host} onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="localhost ou IP" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Porta *</label>
                      <input type="text" value={dbConfig.port} onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="5432" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Banco *</label>
                      <input type="text" value={dbConfig.database} onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="nome_banco" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tabela *</label>
                      <input type="text" value={dbConfig.table} onChange={(e) => setDbConfig(prev => ({ ...prev, table: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="pacientes ou users" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Usuário *</label>
                      <input type="text" value={dbConfig.username} onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="usuario" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Senha *</label>
                      <input type="password" value={dbConfig.password} onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="••••••••" />
                    </div>
                  </div>
                  <button onClick={handleDatabaseImport}
                    disabled={!dbConfig.host || !dbConfig.database || !dbConfig.table || !dbConfig.username || !dbConfig.password || isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
                    {isSubmitting ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Conectando...</span></>
                    ) : (
                      <><Database className="w-5 h-5" /><span>Conectar e Importar</span></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Modo Drag-Drop */}
            {mode === 'drag-drop' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-cyan-400" />
                  <span>Arrastar e Soltar Arquivos</span>
                </h2>
                <div
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); setDragActive(false)
                    if (e.dataTransfer.files) {
                      handleFileUpload(e.dataTransfer.files)
                      setDragDropFiles(Array.from(e.dataTransfer.files).map(file => ({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: file.name, type: file.type, size: file.size, file
                      })))
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive
                    ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'}`}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <p className="text-lg font-semibold text-white mb-2">Arraste arquivos aqui</p>
                  <label className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors cursor-pointer">
                    Selecionar Arquivos
                    <input type="file" multiple className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files)
                          setDragDropFiles(Array.from(e.target.files).map(file => ({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            name: file.name, type: file.type, size: file.size, file
                          })))
                        }
                      }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dcm,.csv,.xlsx" />
                  </label>
                </div>
                {dragDropFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-4">{dragDropFiles.length} arquivo(s)</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {dragDropFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">{getFileIcon(file.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{file.name}</p>
                              <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button onClick={() => setDragDropFiles(prev => prev.filter(f => f.id !== file.id))}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleDragDropProcess} disabled={isSubmitting}
                      className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
                      {isSubmitting ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Processando...</span></>
                      ) : (
                        <><CheckCircle className="w-5 h-5" /><span>Processar {dragDropFiles.length} arquivo(s)</span></>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewPatientForm
