import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Smile, 
  Image, 
  FileText, 
  Download, 
  Share2, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  ThumbsUp,
  Reply,
  Pin,
  Star,
  Archive,
  Trash2,
  Edit,
  Copy,
  Flag,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Calendar,
  MapPin,
  Mail,
  Phone as PhoneIcon
} from 'lucide-react'

const PatientDoctorChat: React.FC = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPatientInfo, setShowPatientInfo] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dados dos pacientes (simulados) - baseado no patientId
  const patients = {
    1: {
      id: 1,
      name: 'Maria Silva',
      age: 45,
      gender: 'Feminino',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-9999',
      address: 'São Paulo, SP',
      diagnosis: 'Hipertensão',
      status: 'ativo',
      priority: 'medium',
      crm: '12345-SP',
      notes: 'Paciente estável, seguindo tratamento corretamente.',
      bloodType: 'O+',
      allergies: ['Penicilina'],
      medications: ['Losartana 50mg', 'Hidroclorotiazida 25mg'],
      lastVisit: '15/01/2024',
      nextVisit: '22/01/2024',
      avatar: 'MS'
    },
    2: {
      id: 2,
      name: 'João Santos',
      age: 52,
      gender: 'Masculino',
      email: 'joao.santos@email.com',
      phone: '(11) 88888-8888',
      address: 'São Paulo, SP',
      diagnosis: 'Diabetes Tipo 2',
      status: 'pendente',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Aguardando resultados de exames laboratoriais.',
      bloodType: 'A+',
      allergies: ['Nenhuma'],
      medications: ['Metformina 850mg', 'Gliclazida 80mg'],
      lastVisit: '10/01/2024',
      nextVisit: '20/01/2024',
      avatar: 'JS'
    },
    3: {
      id: 3,
      name: 'Ana Costa',
      age: 38,
      gender: 'Feminino',
      email: 'ana.costa@email.com',
      phone: '(11) 77777-7777',
      address: 'São Paulo, SP',
      diagnosis: 'Avaliação Inicial',
      status: 'nova',
      priority: 'low',
      crm: '12345-SP',
      notes: 'Primeira consulta, avaliação completa em andamento.',
      bloodType: 'B+',
      allergies: ['Nenhuma'],
      medications: ['Nenhuma'],
      lastVisit: 'Hoje',
      nextVisit: '28/01/2024',
      avatar: 'AC'
    },
    4: {
      id: 4,
      name: 'Carlos Lima',
      age: 60,
      gender: 'Masculino',
      email: 'carlos.lima@email.com',
      phone: '(11) 66666-6666',
      address: 'São Paulo, SP',
      diagnosis: 'Cardiopatia',
      status: 'ativo',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Paciente com histórico de infarto, monitoramento contínuo.',
      bloodType: 'AB+',
      allergies: ['Aspirina'],
      medications: ['AAS 100mg', 'Atorvastatina 20mg', 'Carvedilol 25mg'],
      lastVisit: '12/01/2024',
      nextVisit: '25/01/2024',
      avatar: 'CL'
    }
  }

  // Obter dados do paciente baseado no ID
  const patient = patients[parseInt(patientId || '1') as keyof typeof patients] || patients[1]

  // Mensagens do chat (simuladas) - baseadas no paciente
  const getMessagesForPatient = (patientId: number) => {
    const patientMessages = {
      1: [ // Maria Silva
        {
          id: 1,
          sender: 'doctor',
          senderName: 'Dr. Passos Mir',
          senderAvatar: 'PM',
          message: 'Olá Maria! Como você está se sentindo hoje?',
          timestamp: '10:00',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
        {
          id: 2,
          sender: 'patient',
          senderName: 'Maria Silva',
          senderAvatar: 'MS',
          message: 'Olá doutor! Estou me sentindo bem, a pressão está controlada.',
          timestamp: '10:05',
          type: 'text',
          isRead: true,
          reactions: { heart: 1, thumbs: 0 },
          attachments: []
        },
      ],
      2: [ // João Santos
        {
          id: 1,
          sender: 'doctor',
          senderName: 'Dr. Passos Mir',
          senderAvatar: 'PM',
          message: 'Olá João! Como está a glicemia hoje?',
          timestamp: '09:00',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
        {
          id: 2,
          sender: 'patient',
          senderName: 'João Santos',
          senderAvatar: 'JS',
          message: 'Doutor, a glicemia está em 140mg/dL. Está normal?',
          timestamp: '09:05',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
      ],
      3: [ // Ana Costa
        {
          id: 1,
          sender: 'doctor',
          senderName: 'Dr. Passos Mir',
          senderAvatar: 'PM',
          message: 'Olá Ana! Bem-vinda! Como posso ajudá-la?',
          timestamp: '08:00',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
        {
          id: 2,
          sender: 'patient',
          senderName: 'Ana Costa',
          senderAvatar: 'AC',
          message: 'Olá doutor! Primeira vez aqui. Tenho algumas dúvidas.',
          timestamp: '08:05',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
      ],
      4: [ // Carlos Lima
        {
          id: 1,
          sender: 'doctor',
          senderName: 'Dr. Passos Mir',
          senderAvatar: 'PM',
          message: 'Carlos, como está o coração hoje?',
          timestamp: '16:00',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
        {
          id: 2,
          sender: 'patient',
          senderName: 'Carlos Lima',
          senderAvatar: 'CL',
          message: 'Doutor, sinto uma dor no peito ocasional. É normal?',
          timestamp: '16:05',
          type: 'text',
          isRead: true,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        },
      ]
    }
    return patientMessages[patientId as keyof typeof patientMessages] || patientMessages[1]
  }

  const [messages, setMessages] = useState(getMessagesForPatient(parseInt(patientId || '1')))

  const [attachments, setAttachments] = useState([
    {
      id: 1,
      name: 'exame_pressao.pdf',
      type: 'pdf',
      size: '2.3 MB',
      uploadedBy: 'Maria Silva',
      uploadedAt: '15/01/2024',
      url: '#'
    },
    {
      id: 2,
      name: 'receita_medicamentos.jpg',
      type: 'image',
      size: '1.8 MB',
      uploadedBy: 'Dr. Passos Mir',
      uploadedAt: '15/01/2024',
      url: '#'
    }
  ])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: user?.type === 'professional' ? 'doctor' : 'patient',
        senderName: user?.name || 'Usuário',
        senderAvatar: user?.name?.split(' ').map(n => n[0]).join('') || 'U',
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        isRead: false,
        reactions: { heart: 0, thumbs: 0 },
        attachments: []
      }
      setMessages([...messages, newMessage])
      setMessage('')
      
      // Simular resposta do outro participante
      setTimeout(() => {
        const responseMessage = {
          id: messages.length + 2,
          sender: user?.type === 'professional' ? 'patient' : 'doctor',
          senderName: user?.type === 'professional' ? 'Maria Silva' : 'Dr. Passos Mir',
          senderAvatar: user?.type === 'professional' ? 'MS' : 'PM',
          message: user?.type === 'professional' ? 'Entendi, obrigada pela orientação!' : 'Perfeito! Continue assim.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          isRead: false,
          reactions: { heart: 0, thumbs: 0 },
          attachments: []
        }
        setMessages(prev => [...prev, responseMessage])
      }, 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Simular upload de arquivo
      const file = files[0]
      const newAttachment = {
        id: attachments.length + 1,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: user?.name || 'Usuário',
        uploadedAt: new Date().toLocaleDateString('pt-BR'),
        url: '#'
      }
      setAttachments([...attachments, newAttachment])
      
      // Adicionar mensagem sobre o arquivo
      const fileMessage = {
        id: messages.length + 1,
        sender: user?.type === 'professional' ? 'doctor' : 'patient',
        senderName: user?.name || 'Usuário',
        senderAvatar: user?.name?.split(' ').map(n => n[0]).join('') || 'U',
        message: `📎 Arquivo enviado: ${file.name}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'file',
        isRead: false,
        reactions: { heart: 0, thumbs: 0 },
        attachments: [newAttachment] as any[]
      }
      setMessages([...messages, fileMessage] as any)
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
    }, 3000)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-400'
      case 'image': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/patients')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{patient.avatar}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{patient.name}</h1>
                <p className="text-slate-300">{patient.diagnosis} • {patient.age} anos</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 text-sm">Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowPatientInfo(!showPatientInfo)}
              className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-green-400 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-purple-400 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Principal */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800/80 rounded-lg border border-slate-700 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">💬 Chat Exclusivo</h3>
                  <p className="text-slate-400 text-sm">
                    {user?.type === 'professional' ? 'Conversando com Maria Silva' : 'Conversando com Dr. Passos Mir'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 transition-colors ${
                      isMuted ? 'text-red-400 hover:text-red-300' : 'text-slate-400 hover:text-green-400'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === (user?.type === 'professional' ? 'doctor' : 'patient') ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex space-x-3 max-w-[70%] ${msg.sender === (user?.type === 'professional' ? 'doctor' : 'patient') ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{msg.senderAvatar}</span>
                    </div>
                    <div className={`${msg.sender === (user?.type === 'professional' ? 'doctor' : 'patient') ? 'bg-blue-600' : 'bg-slate-700'} rounded-lg p-3`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium text-sm">{msg.senderName}</span>
                        <span className="text-slate-300 text-xs">{msg.timestamp}</span>
                        {msg.isRead && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-white mb-2">{msg.message}</p>
                      {msg.attachments.length > 0 && (
                        <div className="space-y-2">
                          {msg.attachments.map((attachment: any) => (
                            <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-slate-600/50 rounded">
                              {getFileIcon(attachment.type)}
                              <span className="text-white text-sm">{attachment.name}</span>
                              <span className="text-slate-400 text-xs">{attachment.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <button className="text-slate-400 hover:text-red-400 transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="text-slate-400 hover:text-blue-400 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button className="text-slate-400 hover:text-green-400 transition-colors">
                          <Reply className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={isRecording ? () => setIsRecording(false) : startRecording}
                  className={`p-2 transition-colors ${
                    isRecording 
                      ? 'text-red-400 hover:text-red-300' 
                      : 'text-slate-400 hover:text-red-400'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Informações do Paciente */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">👤 Informações do Paciente</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Nome Completo</p>
                <p className="text-white font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Idade</p>
                <p className="text-white font-medium">{patient.age} anos</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Diagnóstico</p>
                <p className="text-white font-medium">{patient.diagnosis}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {patient.status}
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Última Consulta</p>
                <p className="text-white font-medium">{patient.lastVisit}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Próxima Consulta</p>
                <p className="text-white font-medium">{patient.nextVisit}</p>
              </div>
            </div>
          </div>

          {/* Arquivos Compartilhados */}
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">📎 Arquivos Compartilhados</h3>
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className={`p-2 rounded ${getFileColor(attachment.type)}`}>
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{attachment.name}</p>
                    <p className="text-slate-400 text-xs">{attachment.size} • {attachment.uploadedAt}</p>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDoctorChat
