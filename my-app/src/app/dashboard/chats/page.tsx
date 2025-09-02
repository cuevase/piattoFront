"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Bot, MessageCircle, Send, Clock, CheckCircle, AlertCircle, User, Plus } from 'lucide-react'
import { authenticatedFetch } from '@/lib/api'

interface Message {
  id: string
  content: string
  sender: 'user' | 'sofia'
  timestamp: string
  type: 'text' | 'notification' | 'task_update'
  metadata?: {
    task_id?: string
    task_title?: string
    status?: string
  }
}

interface ChatContact {
  id: string
  name: string
  type: 'ai_worker' | 'human'
  avatar: string
  status: 'online' | 'busy' | 'offline'
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function ChatsPage() {
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id)
    }
  }, [selectedContact])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadContacts = async () => {
    try {
      setContactsLoading(true)
      // TODO: Replace with actual API call when chat system is implemented
      // const response = await authenticatedFetch('/chats/contacts')
      // setContacts(response.data)
      
      // For now, show empty state instead of mock data
      setContacts([])
    } catch (error) {
      console.error('Error loading contacts:', error)
      setContacts([])
    } finally {
      setContactsLoading(false)
    }
  }

  const fetchMessages = async (contactId: string) => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call when chat system is implemented
      // const response = await authenticatedFetch(`/chats/${contactId}/messages`)
      // setMessages(response.data)
      
      // For now, show empty state instead of mock data
      setMessages([])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // TODO: Send message to backend when chat system is implemented
    // await authenticatedFetch(`/chats/${selectedContact.id}/messages`, {
    //   method: 'POST',
    //   body: JSON.stringify({ content: newMessage, type: 'text' })
    // })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-PE', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500'
      case 'busy': return 'bg-amber-500'
      case 'offline': return 'bg-slate-400'
      default: return 'bg-slate-400'
    }
  }

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user'
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' 
            : 'bg-white text-slate-800 border border-slate-200'
        }`}>
          {message.type === 'task_update' && (
            <div className="mb-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-xs text-blue-600 font-medium">
                📋 Actualización de tarea
              </p>
              <p className="text-xs text-blue-800">
                {message.metadata?.task_title}
              </p>
            </div>
          )}
          
          {message.type === 'notification' && (
            <div className="mb-2 p-2 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
              <p className="text-xs text-emerald-600 font-medium">
                🔔 Notificación
              </p>
            </div>
          )}
          
          <p className="text-sm leading-relaxed">{message.content}</p>
          <p className={`text-xs mt-2 ${
            isUser ? 'text-purple-200' : 'text-slate-500'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    )
  }

  if (contactsLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] flex bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Chats</h2>
              <p className="text-sm text-slate-600">Asistentes de IA y colaboradores</p>
            </div>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {/* TODO: Implement new chat */}}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No hay chats aún
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Los chats con asistentes de IA aparecerán aquí cuando estén disponibles
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={() => {/* TODO: Implement coming soon modal */}}
              >
                Próximamente
              </Button>
            </div>
          ) : (
            contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 cursor-pointer transition-all duration-200 border-b border-slate-100 ${
                  selectedContact?.id === contact.id
                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                    : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-lg shadow-sm">
                      {contact.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(contact.status)} shadow-sm`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900 truncate">
                        {contact.name}
                      </h3>
                      {contact.unreadCount > 0 && (
                        <Badge className="bg-purple-600 text-white text-xs px-2 py-1">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 truncate">
                      {contact.lastMessage}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Bot className="h-3 w-3 text-purple-500" />
                        <span className="text-xs text-slate-500">
                          {contact.type === 'ai_worker' ? 'AI Worker' : 'Humano'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(contact.lastMessageTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-lg shadow-sm">
                    {selectedContact.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(selectedContact.status)} shadow-sm`} />
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">
                    {selectedContact.name}
                  </h3>
                  <p className="text-sm text-slate-600 capitalize">
                    {selectedContact.status} • {selectedContact.type === 'ai_worker' ? 'AI Worker' : 'Humano'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-white">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Sin mensajes
                    </h3>
                    <p className="text-slate-500">
                      Envía tu primer mensaje para comenzar la conversación
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-6 border-t border-slate-200 bg-white">
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Selecciona un chat
              </h3>
              <p className="text-slate-600">
                Elige un contacto para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 