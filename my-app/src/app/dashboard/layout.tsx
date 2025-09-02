"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChefHat, BarChart3, Settings, LogOut, Users, Building, Eye, Loader2, Package, Bot, MessageCircle, Cog, Sparkles, Plus, X } from "lucide-react"
import { supabaseBrowser } from "@/app/lib/supabase-browser"
import { apiGet, getCompanyInfo, getCompanyClients } from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [componentTypes, setComponentTypes] = useState<any[]>([])
  
  // Task delegation states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null)
  const [selectedClients, setSelectedClients] = useState<number[]>([])
  const [startDate, setStartDate] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = supabaseBrowser()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Fetch company information
      if (user.email) {
        await fetchCompanyInfo(user.email)
      }
      
      // Fetch component types for reference
      await fetchComponentTypes()
      
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const fetchCompanyInfo = async (email: string) => {
    try {
      console.log('🔍 DEBUG: Fetching company info using direct Supabase query')
      
      const companyData = await getCompanyInfo()
      
      console.log('🔍 DEBUG: Company data received:', companyData)
      
      if (!companyData) {
        console.log('🔍 DEBUG: No company data found')
        setCompanyError('No estás vinculado a ninguna empresa. Contacta a tu administrador para que te incorpore a la empresa.')
        setCompany(null)
      } else {
        console.log('🔍 DEBUG: Company data found, setting company')
        
        // Create company info from the direct Supabase query
        const empresaInfo = Array.isArray(companyData.empresas) ? companyData.empresas[0] : companyData.empresas
        const companyInfo = {
          empresa_id: companyData.empresa_id,
          user_role: companyData.user_role || 'worker', // Use actual role from API
          added_at: empresaInfo?.created_at,
          profile_id: companyData.empresa_id,
          name: empresaInfo?.nombre_empresa || 'Tu Empresa',
          logo_url: empresaInfo?.logo_url || null,
          descripcion: empresaInfo?.descripcion || null
        }
        
        setCompany(companyInfo)
        setCompanyError(null)
        
        // Fetch clients using direct Supabase query
        await fetchClients()
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching company info:', error)
      setCompanyError(error instanceof Error ? error.message : 'Error al obtener información de la empresa.')
      setCompany(null)
    }
  }

  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      
      console.log('🔍 DEBUG: Fetching clients using direct Supabase query')
      
      const clientsData = await getCompanyClients()
      
      console.log('🔍 DEBUG: Clients data received:', clientsData)
      setClients(clientsData || [])
      
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching clients:', error)
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }

  const fetchComponentTypes = async () => {
    try {
      console.log('🔍 DEBUG: Fetching component types')
      
      const componentTypesData = await apiGet('/componentes')
      
      console.log('🔍 DEBUG: Component types data received:', componentTypesData)
      setComponentTypes(componentTypesData || [])
      
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching component types:', error)
      setComponentTypes([])
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Task delegation functions
  const taskTypeConfig = {
    generate_menu: {
      icon: ChefHat,
      label: 'Generar Menú',
      color: 'bg-purple-500',
      description: 'Crear menús semanales para clientes'
    },
    generate_weekly_menu: {
      icon: ChefHat,
      label: 'Generar Menú Semanal',
      color: 'bg-purple-600',
      description: 'Generar menús semanales usando algoritmo de backtracking global'
    },
    create_shipment: {
      icon: Package,
      label: 'Crear Envío',
      color: 'bg-blue-500',
      description: 'Generar envíos basados en menús'
    },
    calculate_ingredients: {
      icon: BarChart3,
      label: 'Calcular Ingredientes',
      color: 'bg-green-500',
      description: 'Calcular resumen de ingredientes'
    },
    generate_report: {
      icon: BarChart3,
      label: 'Generar Reporte',
      color: 'bg-orange-500',
      description: 'Crear reportes y análisis'
    }
  }

  const handleClientSelection = (clientId: number, checked: boolean) => {
    setSelectedClients(prev => {
      if (checked) {
        return [...prev, clientId]
      } else {
        return prev.filter(id => id !== clientId)
      }
    })
  }

  const removeSelectedClient = (clientId: number) => {
    setSelectedClients(prev => prev.filter(id => id !== clientId))
  }

  const resetModal = () => {
    setSelectedTaskType(null)
    setSelectedClients([])
    setStartDate('')
  }

  const getTaskTitle = (taskType: string | null, clients: number[], date: string) => {
    if (!taskType) return 'Nueva tarea'
    
    const config = taskTypeConfig[taskType as keyof typeof taskTypeConfig]
    if (taskType === 'generate_menu') {
      return `${config.label} - Semana del ${date} (${clients.length} clientes)`
    }
    return config.label
  }

  const handleCreateTask = async () => {
    if (!selectedTaskType || (selectedTaskType === 'generate_weekly_menu' && (selectedClients.length === 0 || !startDate))) {
      return
    }

    setCreatingTask(true)

    try {
      // Get company info to include empresa_id
      const companyData = await getCompanyInfo()
      if (!companyData) {
        throw new Error('No se pudo obtener la información de la empresa')
      }

      // Create task data
      const taskData = {
        type: selectedTaskType,
        title: getTaskTitle(selectedTaskType, selectedClients, startDate),
        empresa_id: companyData.empresa_id,
        metadata: {
          client_count: selectedClients.length,
          start_date: startDate,
          clients: selectedClients.map(id => {
            const client = clients.find(c => c.id === id)
            return client ? `${client.nombre} ${client.apellido}` : `Cliente ${id}`
          })
        },
        priority: 'medium',
        assigned_to: 'sofIA'
      }
      
      // Create task via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        throw new Error('Error al crear la tarea')
      }

      const createdTask = await response.json()
      
      // Show success notification
      setNotification(`🚀 Tarea creada: ${taskData.title}`)
      
      // Reset and close modal
      resetModal()
      setShowCreateModal(false)
      
      // Redirect to tasks page to see the new task
      router.push('/dashboard/tasks')
      
    } catch (error) {
      console.error('Error creating task:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setNotification(`❌ Error creando tarea: ${errorMessage}`)
    } finally {
      setCreatingTask(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-purple-800 mb-2">Cargando...</h2>
          <p className="text-purple-600">Verificando tu acceso</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show company error message if user is not linked to any company
  if (companyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-800">
              Acceso Restringido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-700">{companyError}</p>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is admin based on role from empresa relation
  const isAdmin = company && company.user_role === 'admin'

  const menuItems = [
    { id: "/dashboard", label: "Resumen", icon: BarChart3 },
    { id: "/dashboard/menus", label: "Generar Menús", icon: ChefHat },
    { id: "/dashboard/clientes", label: "Clientes", icon: Users },
    { id: "/dashboard/shipments", label: "Envíos", icon: Package },
    { id: "/dashboard/data", label: "Ver Datos", icon: Eye },
    { id: "/dashboard/config", label: "Configuración", icon: Settings },
    // Only show company config for admin users
    ...(isAdmin ? [{ id: "/dashboard/config/company", label: "Configuración de Empresa", icon: Building }] : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src="/pulpoo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-purple-800">Panel de Control</h1>
                {company && (
                  <p className="text-sm text-purple-600">
                    {company.name || 'Tu Empresa'} {company.user_role && `(${company.user_role})`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-purple-600">
                Hola, {user.user_metadata?.full_name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Resumen
              </Link>
              
              <Link
                href="/dashboard/menus"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/menus')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChefHat className="h-4 w-4" />
                Generar Menús
              </Link>
              

              
              <Link
                href="/dashboard/clientes"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/clientes'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4" />
                Clientes
              </Link>
              
              <Link
                href="/dashboard/shipments"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/shipments')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="h-4 w-4" />
                Consolidaciones
              </Link>

              <Link
                href="/dashboard/tasks"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/tasks')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bot className="h-4 w-4" />
                Delegación de Tareas
              </Link>
              
              <Link
                href="/dashboard/data"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/data')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Eye className="h-4 w-4" />
                Data
              </Link>
              
              <Link
                href="/dashboard/config"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/config') && !pathname.startsWith('/dashboard/config/company')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
              
              {company?.user_role === 'admin' && (
                <Link
                  href="/dashboard/config/company"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/dashboard/config/company')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Cog className="h-4 w-4" />
                  Configuración
                </Link>
              )}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delegar Tarea a sofIA</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetModal()
                  setShowCreateModal(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Tipo de Tarea</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(taskTypeConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedTaskType(key)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedTaskType === key
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-2" />
                        <p className="text-sm font-medium">{config.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {selectedTaskType && (
                <div>
                  <Label>Asignar Tarea a:</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                      <Bot className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">sofIA</span>
                      <Badge className="bg-emerald-500 text-white ml-2">AI</Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedTaskType === 'generate_weekly_menu' && (
                <div className="space-y-3">
                  <div>
                    <Label>Fecha de Inicio</Label>
                    <Input 
                      type="date" 
                      className="mt-1"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Clientes</Label>
                    {clientsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {/* Selected clients display */}
                        {selectedClients.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg">
                            {selectedClients.map(clientId => {
                              const client = clients.find(c => c.id === clientId)
                              return (
                                <Badge key={clientId} className="bg-purple-100 text-purple-800 flex items-center gap-1">
                                  {client?.nombre} {client?.apellido}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSelectedClient(clientId)}
                                    className="h-3 w-3 p-0 hover:bg-red-100"
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Client selection list */}
                        <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-2 bg-white">
                          {clients.map(client => (
                            <div key={client.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`client-${client.id}`}
                                checked={selectedClients.includes(client.id)}
                                onCheckedChange={(checked) => handleClientSelection(client.id, checked as boolean)}
                              />
                              <Label htmlFor={`client-${client.id}`} className="text-sm cursor-pointer">
                                {client.nombre} {client.apellido}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateTask}
                  disabled={creatingTask || !selectedTaskType || (selectedTaskType === 'generate_weekly_menu' && (selectedClients.length === 0 || !startDate))}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {creatingTask ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Delegar Tarea
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetModal()
                    setShowCreateModal(false)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button - Delegate Task */}
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={creatingTask}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl rounded-full w-20 h-20 p-0 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-2xl"
          title="Delegar Tarea a sofIA"
        >
          {creatingTask ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Sparkles className="h-8 w-8" />
          )}
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-purple-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm">{notification}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotification(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 