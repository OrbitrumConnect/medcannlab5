import React, { useState } from 'react'
import { Send, Users, Search, Lock } from 'lucide-react'
import Layout from '../components/Layout'

const ProfessionalChat: React.FC = () => {
  const [messages, setMessages] = useState([])

  const [inputMessage, setInputMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'Dr. Ricardo Valença',
        senderEmail: 'rrvalenca@gmail.com',
        message: inputMessage,
        timestamp: new Date(),
        encrypted: true
      }
      setMessages([...messages, newMessage])
      setInputMessage('')
    }
  }

  const filteredMessages = messages.filter(msg => 
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-200px)] bg-slate-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Chat com Profissionais</h2>
                <p className="text-sm opacity-90">Conversa segura em equipe</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Criptografado</span>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type="text"
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-10 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'Dr. Ricardo Valença' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-md rounded-lg p-3 ${
                  msg.sender === 'Dr. Ricardo Valença'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm">{msg.sender}</span>
                  {msg.encrypted && (
                    <Lock className="w-3 h-3 opacity-70" />
                  )}
                </div>
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Enviar</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Suas mensagens são criptografadas e seguras</span>
          </p>
        </form>
      </div>
    </Layout>
  )
}

export default ProfessionalChat
