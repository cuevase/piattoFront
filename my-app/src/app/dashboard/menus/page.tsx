"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users, Sparkles, DollarSign, Zap, Loader2, CalendarDays, X, ChevronDown, Package, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabaseBrowser } from "@/app/lib/supabase-browser"
import { CreateShipmentModal } from "@/components/CreateShipmentModal"
import { apiGet, apiPost, apiPut, apiDelete, getCompanyInfo, getCompanyClients } from "@/lib/api"

interface Componente {
  componente_id: number
  componente_nombre: string
  receta_id: string
  receta_nombre: string
  receta_categoria: string
  receta_calidad: string | null
  unico: boolean
}

interface Menu {
  fecha: string
  tipo_menu: string
  tipo_menu_nombre: string
  componentes: Componente[]
  costo_total: number
  kilocalorias_total: number
}

interface ClientePlan {
  cliente_id: number
  cliente_nombre: string
  menus: Menu[]
}

interface PlanResponse {
  status: string
  plan: ClientePlan[]
}

interface Cliente {
  id: number
  nombre: string
  activo: boolean
}

export default function MenuGenerator() {
  const [fechaInicio, setFechaInicio] = useState("")
  const [clientesSeleccionados, setClientesSeleccionados] = useState<number[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [planGenerado, setPlanGenerado] = useState<PlanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<{ menu: Menu; cliente: Cliente | undefined; fecha: string } | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const [expandedMenuExtras, setExpandedMenuExtras] = useState<Set<string>>(new Set())
  const [orderQuantities, setOrderQuantities] = useState<{ [key: string]: { cantidad: number; entrada: number; sopa: number } }>({})
  
  // Job tracking state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState<string>("")
  const [jobStartTime, setJobStartTime] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  const [ingredientsSummary, setIngredientsSummary] = useState<any>(null)
  const [ingredientsSearch, setIngredientsSearch] = useState("")
  const [ingredientsSortBy, setIngredientsSortBy] = useState<'nombre' | 'cantidad' | 'costo'>('costo')
  const [ingredientsSortOrder, setIngredientsSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Shipment modal state
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [empresaId, setEmpresaId] = useState<string>("")
  
  // Task delegation modal state
  const [showTaskDelegationModal, setShowTaskDelegationModal] = useState(false)
  const [delegatingTask, setDelegatingTask] = useState(false)
  
  // Calendar view state
  const [currentClientIndex, setCurrentClientIndex] = useState(0)
  
  const router = useRouter()
  const supabase = supabaseBrowser()

  useEffect(() => {
    const initializeData = async () => {
      // Get user and company info
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      if (user.email) {
        await fetchCompanyAndClients(user.email)
      }
      
      // Component names are now included in the API response
    }

    initializeData()
  }, [router, supabase])

  // Reset showExtras when a new menu is selected
  useEffect(() => {
    setShowExtras(false)
  }, [selectedMenu])

  // Track elapsed time for job progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (currentJobId && jobStartTime) {
      interval = setInterval(() => {
        const start = new Date(jobStartTime).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - start) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [currentJobId, jobStartTime])

  // Check for plan data from task delegation
  useEffect(() => {
    const checkTaskPlanData = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const fromTask = urlParams.get('from_task')
      
      if (fromTask === 'true') {
        try {
          const savedPlan = localStorage.getItem('generated_plan_data')
          if (savedPlan) {
            const planData = JSON.parse(savedPlan)
            setPlanGenerado(planData)
            
            // Clear the data from localStorage
            localStorage.removeItem('generated_plan_data')
            
            // Clear the URL parameter
            window.history.replaceState({}, document.title, '/dashboard/menus')
            
            // Scroll to the plan section
            setTimeout(() => {
              const planSection = document.getElementById('plan-generado')
              if (planSection) {
                planSection.scrollIntoView({ behavior: 'smooth' })
              }
            }, 100)
          }
        } catch (error) {
          console.error('Error loading plan data from task:', error)
        }
      }
    }
    
    checkTaskPlanData()
  }, [])

  // Cleanup job when component unmounts
  useEffect(() => {
    return () => {
      if (currentJobId) {
        cleanupJob(currentJobId).catch(console.error)
      }
    }
  }, [currentJobId])

  const fetchCompanyAndClients = async (email: string) => {
    try {
      setClientsLoading(true)
      
      // First, get company info using direct Supabase query
      const companyData = await getCompanyInfo()
      
      if (companyData) {
        setEmpresaId(companyData.empresa_id)
        
        // Now fetch clients for this company using direct Supabase query
        const clientsData = await getCompanyClients()
        
        // Transform the clients data to match our interface
        const transformedClients = clientsData.map((client: any) => ({
          id: client.id,
          nombre: client.nombre || `Cliente ${client.id}`,
          activo: client.activo !== false // Default to true if not specified
        }))
        
        setClientes(transformedClients)
      }
    } catch (error) {
      console.error('Error fetching company and clients:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar los clientes. Por favor recarga la página.')
    } finally {
      setClientsLoading(false)
    }
  }

  const handleClienteToggle = (clienteId: number) => {
    setClientesSeleccionados(prev => 
      prev.includes(clienteId) 
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    )
  }



  const getComponentColor = (componentId: number) => {
    const colors = [
      "bg-red-100 text-red-800 border-red-200",
      "bg-blue-100 text-blue-800 border-blue-200", 
      "bg-green-100 text-green-800 border-green-200",
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-teal-100 text-teal-800 border-teal-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-cyan-100 text-cyan-800 border-cyan-200",
      "bg-lime-100 text-lime-800 border-lime-200",
      "bg-emerald-100 text-emerald-800 border-emerald-200",
      "bg-rose-100 text-rose-800 border-rose-200",
      "bg-violet-100 text-violet-800 border-violet-200",
      "bg-amber-100 text-amber-800 border-amber-200",
    ]
    
    return colors[componentId % colors.length]
  }

  const getComponentName = (componentId: number) => {
    // Find the component in the plan and return its name
    if (!planGenerado) return `Componente ${componentId}`
    
    for (const clientePlan of planGenerado.plan) {
      for (const menu of clientePlan.menus) {
        for (const componente of menu.componentes) {
          if (componente.componente_id === componentId) {
            return componente.componente_nombre
          }
        }
      }
    }
    return `Componente ${componentId}`
  }

  const getUniqueMenusByDate = () => {
    if (!planGenerado) return {}
    
    const uniqueMenus: { [key: string]: { menu_id: string; menu_name: string; hasEntrada: boolean; hasSopa: boolean } } = {}
    
    planGenerado.plan.forEach(clientePlan => {
      clientePlan.menus.forEach(menu => {
        const key = `${menu.fecha}_${menu.tipo_menu}`
        if (!uniqueMenus[key]) {
          // Check if menu has entrada (component_id 10) or sopa (component_id 9)
          const hasEntrada = menu.componentes.some(c => c.componente_id === 10)
          const hasSopa = menu.componentes.some(c => c.componente_id === 9)
          
          uniqueMenus[key] = {
            menu_id: menu.tipo_menu,
            menu_name: menu.tipo_menu_nombre, // Use the name directly from the response
            hasEntrada,
            hasSopa
          }
        }
      })
    })
    
    return uniqueMenus
  }

  const initializeQuantities = () => {
    const uniqueMenus = getUniqueMenusByDate()
    const initialQuantities: { [key: string]: { cantidad: number; entrada: number; sopa: number } } = {}
    
    Object.keys(uniqueMenus).forEach(key => {
      initialQuantities[key] = { cantidad: 0, entrada: 0, sopa: 0 }
    })
    
    setOrderQuantities(initialQuantities)
  }

  const handleQuantityChange = (key: string, field: 'cantidad' | 'entrada' | 'sopa', value: number) => {
    setOrderQuantities(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }



  const getFilteredAndSortedIngredients = () => {
    if (!ingredientsSummary?.ingredients) return []
    
    let filtered = ingredientsSummary.ingredients.filter((ingredient: any) =>
      ingredient.nombre.toLowerCase().includes(ingredientsSearch.toLowerCase()) ||
      ingredient.codigo.toLowerCase().includes(ingredientsSearch.toLowerCase())
    )
    
    filtered.sort((a: any, b: any) => {
      let aValue = a[ingredientsSortBy]
      let bValue = b[ingredientsSortBy]
      
      if (ingredientsSortBy === 'nombre') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (ingredientsSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }

  const getIngredientsStats = () => {
    if (!ingredientsSummary?.ingredients) return { totalCost: 0, totalItems: 0, avgCost: 0 }
    
    const ingredients = ingredientsSummary.ingredients
    const totalCost = ingredients.reduce((sum: number, ing: any) => sum + ing.costo, 0)
    const totalItems = ingredients.length
    const avgCost = totalCost / totalItems
    
    return { totalCost, totalItems, avgCost }
  }

  const getIngredientsByUnit = () => {
    if (!ingredientsSummary?.ingredients) return {}
    
    return ingredientsSummary.ingredients.reduce((acc: any, ing: any) => {
      if (!acc[ing.unidad]) {
        acc[ing.unidad] = []
      }
      acc[ing.unidad].push(ing)
      return acc
    }, {})
  }

  // Helper function to format elapsed time
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const delegateToSofIA = async () => {
    if (!planGenerado) return
    
    setDelegatingTask(true)
    
    try {
      // Get company info to include empresa_id
      const companyInfo = await getCompanyInfo()
      if (!companyInfo) {
        throw new Error('No se pudo obtener la información de la empresa')
      }

      // Create the task data
      const taskData = {
        type: 'process_ingredients_and_shipment',
        title: `Procesar Ingredientes y Crear Envío - ${new Date().toLocaleDateString()}`,
        empresa_id: companyInfo.empresa_id,
        metadata: {
          plan_data: planGenerado,
          order_quantities: orderQuantities,
          start_date: fechaInicio,
          client_count: planGenerado.plan.length
        }
      }
      
      // Create the task via API
      const response = await apiPost('/tasks', taskData)
      
      // Update the original menu generation task to completed status
      // Check if we came from a task (from_task=true in URL)
      const urlParams = new URLSearchParams(window.location.search)
      const fromTask = urlParams.get('from_task')
      
      if (fromTask === 'true') {
        // Get the original task ID from localStorage (if available)
        const originalTaskId = localStorage.getItem('original_task_id')
        if (originalTaskId) {
          try {
            // Update the original task status to completed
            await apiPut(`/tasks/${originalTaskId}`, {
              status: 'completed'
            })
            
            // Clear the stored task ID
            localStorage.removeItem('original_task_id')
          } catch (error) {
            console.warn('Failed to update original task status:', error)
          }
        }
      }
      
      // Show success notification
      alert('✅ Tarea delegada a sofIA exitosamente. Puedes ver el progreso en el Dashboard de Tareas.')
      
      // Redirect to tasks page
      router.push('/dashboard/tasks')
      
    } catch (error) {
      console.error('Error delegating task:', error)
      alert('❌ Error al delegar la tarea. Por favor intenta de nuevo.')
    } finally {
      setDelegatingTask(false)
      setShowTaskDelegationModal(false)
    }
  }

  // Helper function to clean up job
  const cleanupJob = async (jobId: string) => {
    try {
      await apiDelete(`/job/${jobId}`)
    } catch (error) {
      console.warn('Failed to cleanup job:', error)
    }
  }

  // Helper function to poll job status
  const pollJobStatus = async (jobId: string): Promise<PlanResponse> => {
    const maxPolls = 180 // 15 minutes max (180 * 5 seconds)
    let pollCount = 0

    while (pollCount < maxPolls) {
      try {
        const status = await apiGet(`/job-status/${jobId}`)
        
        // Update progress UI
        setJobProgress(status.progress || 'Processing...')

        if (status.status === 'completed') {
          if (!status.result || !status.result.plan) {
            throw new Error('Invalid response format from completed job')
          }
          return status.result
        }

        if (status.status === 'error') {
          throw new Error(status.error || 'Job failed with unknown error')
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000))
        pollCount++

      } catch (error) {
        console.error('Polling error:', error)
        throw error
      }
    }

    throw new Error('Job timeout after 15 minutes')
  }

  const generatePlan = async () => {
    if (!fechaInicio || clientesSeleccionados.length === 0) {
      setError("Por favor selecciona una fecha de inicio y al menos un cliente")
      return
    }

    setLoading(true)
    setError(null)
    setCurrentJobId(null)
    setJobProgress("")
    setJobStartTime(null)
    setElapsedTime(0)
    // No longer need to clear these since names come from the response
    setOrderQuantities({}) // Clear previous quantities
    setIngredientsSummary(null) // Clear previous ingredients

    try {
      // Calculate fecha_fin (6 days after fecha_inicio)
      const startDate = new Date(fechaInicio)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      const fechaFin = endDate.toISOString().split('T')[0]

      // Step 1: Start the job
      setJobProgress("Starting weekly plan generation...")
      
      const requestBody = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        clientes: clientesSeleccionados
      }
      
      const startResult = await apiPost('/start-weekly-plan-generation', requestBody)
      const jobId = startResult.job_id

      if (!jobId) {
        throw new Error('No job ID returned from server')
      }

      // Step 2: Set up job tracking
      setCurrentJobId(jobId)
      setJobStartTime(new Date().toISOString())
      setJobProgress("Job started, waiting for processing...")

      console.log('✅ Job started with ID:', jobId)

      // Step 3: Poll for completion
      const planData = await pollJobStatus(jobId)

      // Validate the response structure
      if (!planData || !planData.plan || !Array.isArray(planData.plan)) {
        throw new Error('Invalid response format from API')
      }

      console.log('✅ Plan generated successfully for', planData.plan.length, 'clients')
      setPlanGenerado(planData)
      
      // Initialize quantity form after successful plan generation
      initializeQuantities()
      
      // Names are now included in the API response, so no need to fetch them separately

      // Step 4: Clean up job
      await cleanupJob(jobId)
      
    } catch (err) {
      console.error('Error generating plan:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      
      // Clean up job on error
      if (currentJobId) {
        await cleanupJob(currentJobId)
      }
    } finally {
      setLoading(false)
      setCurrentJobId(null)
      setJobProgress("")
      setJobStartTime(null)
      setElapsedTime(0)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    // Parse the date string directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // These functions now use the names directly from the response
  const getMenuTypeName = (tipoMenu: string) => {
    // Find the menu in the plan and return its name
    if (!planGenerado) return "Cargando..."
    
    for (const clientePlan of planGenerado.plan) {
      for (const menu of clientePlan.menus) {
        if (menu.tipo_menu === tipoMenu) {
          return menu.tipo_menu_nombre
        }
      }
    }
    return "Cargando..."
  }

  const getRecipeName = (recipeId: string) => {
    // Find the recipe in the plan and return its name
    if (!planGenerado) return "Cargando..."
    
    for (const clientePlan of planGenerado.plan) {
      for (const menu of clientePlan.menus) {
        for (const componente of menu.componentes) {
          if (componente.receta_id === recipeId) {
            return componente.receta_nombre
          }
        }
      }
    }
    return "Cargando..."
  }

  const getMenuTypeColor = (tipoMenu: string) => {
    const colores: { [key: string]: string } = {
      "28205a92-f1da-4fe9-b609-dd274d0809f4": "bg-purple-100 text-purple-800",
      "a2f77933-8651-482d-8ba1-c3f376fcb8ec": "bg-blue-100 text-blue-800",
      "d09e052d-902e-4862-b1a0-9a9c25d38227": "bg-green-100 text-green-800",
    }
    return colores[tipoMenu] || "bg-gray-100 text-gray-800"
  }

  // Helper functions to separate fondo and constants
  const isConstantComponent = (componentId: number) => {
    // Constants: Ají (7), Postre (6), REFRESCO (5), Pan (14)
    return [5, 6, 7, 14].includes(componentId)
  }

  const separateComponents = (componentes: Componente[]) => {
    const fondo = componentes.filter(c => !isConstantComponent(c.componente_id))
    const constants = componentes.filter(c => isConstantComponent(c.componente_id))
    return { fondo, constants }
  }

  const toggleMenuExtras = (menuKey: string) => {
    setExpandedMenuExtras(prev => {
      const newSet = new Set(prev)
      if (newSet.has(menuKey)) {
        newSet.delete(menuKey)
      } else {
        newSet.add(menuKey)
      }
      return newSet
    })
  }

  // Calendar view helper functions
  const getCurrentWeekDates = () => {
    if (!planGenerado?.plan[currentClientIndex]?.menus.length) return []
    
    const dates = [...new Set(planGenerado.plan[currentClientIndex].menus.map(menu => menu.fecha))].sort()
    return dates
  }

  const getMenuTypes = () => {
    if (!planGenerado?.plan[currentClientIndex]?.menus.length) return []
    
    const types = [...new Set(planGenerado.plan[currentClientIndex].menus.map(menu => menu.tipo_menu_nombre))].sort()
    return types
  }

  const getMenuForDayAndType = (date: string, menuType: string) => {
    return planGenerado?.plan[currentClientIndex]?.menus.find(menu => 
      menu.fecha === date && menu.tipo_menu_nombre === menuType
    )
  }

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { weekday: 'long' })
  }

  const getCurrentClient = () => {
    return planGenerado?.plan[currentClientIndex]
  }

  const getTotalCost = () => {
    if (!planGenerado?.plan[currentClientIndex]) return 0
    
    return planGenerado.plan[currentClientIndex].menus.reduce((total, menu) => {
      const quantityKey = `${menu.fecha}_${menu.tipo_menu}`
      const quantities = orderQuantities[quantityKey] || { cantidad: 0, entrada: 0, sopa: 0 }
      return total + (menu.costo_total * quantities.cantidad)
    }, 0)
  }

  const getTotalMenus = () => {
    if (!planGenerado?.plan[currentClientIndex]) return 0
    
    return planGenerado.plan[currentClientIndex].menus.reduce((total, menu) => {
      const quantityKey = `${menu.fecha}_${menu.tipo_menu}`
      const quantities = orderQuantities[quantityKey] || { cantidad: 0, entrada: 0, sopa: 0 }
      return total + quantities.cantidad
    }, 0)
  }



  if (clientsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Generador de Menús IA</h2>
          <p className="text-purple-600">Planificación inteligente de menús</p>
        </div>
        
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Cargando clientes...</h3>
            <p className="text-purple-600">Por favor espera mientras obtenemos la información</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-none w-full px-2">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Generador de Menús IA</h2>
        <p className="text-purple-600">Planificación inteligente de menús</p>
      </div>

      {/* Form Section */}
      <Card className="border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-purple-900 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Configuración del Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="fecha" className="text-purple-700 font-medium">
              Fecha de Inicio
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
              <Input
                id="fecha"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-3">
            <Label className="text-purple-700 font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Seleccionar Clientes
            </Label>
            {clientes.length === 0 ? (
              <div className="text-center py-8 text-purple-600">
                <Users className="h-12 w-12 mx-auto mb-2 text-purple-300" />
                <p>No hay clientes disponibles</p>
                <p className="text-sm">Contacta a tu administrador para agregar clientes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clientes
                  .filter((c) => c.activo)
                  .map((cliente) => (
                    <div
                      key={cliente.id}
                      className="flex items-center space-x-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50"
                    >
                      <Checkbox
                        id={`cliente-${cliente.id}`}
                        checked={clientesSeleccionados.includes(cliente.id)}
                        onCheckedChange={() => handleClienteToggle(cliente.id)}
                      />
                      <Label
                        htmlFor={`cliente-${cliente.id}`}
                        className="text-sm font-medium text-purple-900 cursor-pointer"
                      >
                        {cliente.nombre}
                      </Label>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            onClick={generatePlan}
            disabled={loading || !fechaInicio || clientesSeleccionados.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando Plan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Plan de Menús
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Enhanced Job Progress UI */}
      {loading && (
        <Card className="border-purple-200 shadow-2xl">
          <CardContent className="text-center space-y-6 py-12">
            {/* AI Brain Animation */}
            <div className="relative mx-auto w-24 h-24">
              {/* Main brain circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse"></div>

              {/* Neural network lines */}
              <div className="absolute inset-2 rounded-full border-2 border-purple-300 animate-spin"></div>
              <div
                className="absolute inset-4 rounded-full border-2 border-purple-200 animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "3s" }}
              ></div>

              {/* Central AI core */}
              <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-600 animate-bounce" />
              </div>

              {/* Floating particles */}
              <div className="absolute -top-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
              <div
                className="absolute -top-1 -right-3 w-2 h-2 bg-purple-500 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute -bottom-2 -left-3 w-2 h-2 bg-purple-300 rounded-full animate-ping"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute -bottom-1 -right-2 w-3 h-3 bg-purple-500 rounded-full animate-ping"
                style={{ animationDelay: "1.5s" }}
              ></div>
            </div>

            {/* Job Status and Progress */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-purple-900">IA Generando Menús</h3>
              
              {/* Current Status */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-center space-x-2 text-purple-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {jobProgress || "Iniciando proceso..."}
                  </span>
                </div>
              </div>

              {/* Job Info */}
              {currentJobId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-purple-600 font-medium">Job ID</div>
                    <div className="text-purple-800 font-mono text-xs">
                      {currentJobId.slice(0, 8)}...
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-purple-600 font-medium">Tiempo Transcurrido</div>
                    <div className="text-purple-800 font-mono">
                      {formatElapsedTime(elapsedTime)}
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Steps Indication */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-purple-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">Ejecutando algoritmo de backtracking global</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(90, Math.max(5, (elapsedTime / 600) * 85))}%`, // Animate from 5% to 90% over 10 minutes
                }}
              ></div>
            </div>

            {/* Enhanced info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700">
                ⚡ <strong>Proceso Asíncrono:</strong> Este proceso puede tomar hasta 10-15 minutos. 
                El sistema está ejecutando un algoritmo avanzado de backtracking global para encontrar 
                la combinación óptima de menús.
              </p>
            </div>

            {/* Cancel option */}
            {currentJobId && (
              <div className="pt-4">
                <button
                  onClick={() => {
                    if (currentJobId) {
                      cleanupJob(currentJobId)
                      setLoading(false)
                      setCurrentJobId(null)
                      setJobProgress("")
                      setJobStartTime(null)
                      setElapsedTime(0)
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                >
                  Cancelar proceso
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {!loading && planGenerado && (
        <div id="plan-generado" className="space-y-6 max-w-none w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-purple-900">Plan Generado</h3>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800 border-0">
                {planGenerado.status === "success" ? "Exitoso" : "Error"}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-0">
                Paso 2: Especificar Cantidades
              </Badge>
              {ingredientsSummary && (
                <Button
                  onClick={() => {
                    const element = document.getElementById('ingredients-summary')
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ver Ingredientes
                </Button>
              )}
              {ingredientsSummary && (
                <Button
                  onClick={() => setShowShipmentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Crear Envío
                </Button>
              )}
            </div>
          </div>

          {/* Submit Button for Quantities */}
          <div className="flex flex-col items-center space-y-3">
            <div className="text-center">
              <p className="text-purple-700 font-medium">
                💡 Complete las cantidades en cada menú y delegue la tarea a sofIA
              </p>
              <p className="text-sm text-purple-600">
                sofIA generará el resumen de ingredientes y creará el envío automáticamente
              </p>
            </div>
            <Button
              onClick={() => setShowTaskDelegationModal(true)}
              disabled={Object.values(orderQuantities).every(q => q.cantidad === 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Delegar a sofIA
            </Button>
          </div>

          {/* Calendar View */}
          <div className="space-y-6">
            {/* Client Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentClientIndex(Math.max(0, currentClientIndex - 1))}
                  disabled={currentClientIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    {getCurrentClient()?.cliente_nombre || `Cliente ${currentClientIndex + 1}`}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Cliente {currentClientIndex + 1} de {planGenerado.plan.length}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentClientIndex(Math.min(planGenerado.plan.length - 1, currentClientIndex + 1))}
                  disabled={currentClientIndex === planGenerado.plan.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Summary Stats */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Menús</p>
                  <p className="text-xl font-bold text-purple-600">{getTotalMenus()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Costo Total</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(getTotalCost())}</p>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Day Headers */}
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${getCurrentWeekDates().length}, minmax(200px, 1fr))` }}>
                    {getCurrentWeekDates().map((date, dayIndex) => (
                      <div key={dayIndex} className="text-center">
                        <div className="bg-purple-100 p-3 border-b-2 border-purple-200">
                          <h4 className="font-semibold text-purple-900 capitalize">
                            {getDayName(date)}
                          </h4>
                          <p className="text-sm text-purple-700">
                            {formatDate(date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Menu Types Grid */}
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${getCurrentWeekDates().length}, minmax(200px, 1fr))` }}>
                    {getCurrentWeekDates().map((date, dayIndex) => (
                      <div key={dayIndex} className="space-y-3 p-3">
                        {getMenuTypes().map((menuType, typeIndex) => {
                          const menu = getMenuForDayAndType(date, menuType)
                          const quantityKey = menu ? `${date}_${menu.tipo_menu}` : ''
                          const quantities = menu ? (orderQuantities[quantityKey] || { cantidad: 0, entrada: 0, sopa: 0 }) : { cantidad: 0, entrada: 0, sopa: 0 }
                          
                          return (
                            <Card 
                              key={typeIndex} 
                              className={`border-2 ${menu ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                            >
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center justify-between">
                                  <span className="text-xs">{menuType}</span>
                                  {menu && (
                                    <Badge className="text-xs" variant="default">
                                      ✓ Disponible
                                    </Badge>
                                  )}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {menu ? (
                                  <div className="space-y-3">
                                    {/* Menu Info */}
                                    <div className="text-xs">
                                      <p className="font-medium text-green-700">
                                        {formatCurrency(menu.costo_total)}
                                      </p>
                                      <p className="text-gray-600">
                                        {menu.kilocalorias_total} kcal
                                      </p>
                                    </div>
                                    
                                    {/* Main Dish */}
                                    <div className="space-y-1">
                                      {menu.componentes
                                        .filter((comp) => comp.componente_id === 8) // FONDO
                                        .map((comp, idx) => (
                                          <div key={idx} className="text-xs">
                                            <p className="font-medium text-gray-800">
                                              {getComponentName(comp.componente_id)}: {comp.receta_nombre}
                                            </p>
                                          </div>
                                        ))}
                                      {menu.componentes
                                        .filter((comp) => comp.componente_id === 10 || comp.componente_id === 9) // ENTRADA or SOPA
                                        .slice(0, 1)
                                        .map((comp, idx) => (
                                          <div key={idx} className="text-xs">
                                            <p className="text-gray-600">
                                              {getComponentName(comp.componente_id)}: {comp.receta_nombre}
                                            </p>
                                          </div>
                                        ))}
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="space-y-2">
                                      <Label className="text-xs">Cantidad:</Label>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleQuantityChange(quantityKey, 'cantidad', Math.max(0, quantities.cantidad - 1))}
                                          disabled={quantities.cantidad <= 0}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          type="number"
                                          value={quantities.cantidad}
                                          onChange={(e) => handleQuantityChange(quantityKey, 'cantidad', parseInt(e.target.value) || 0)}
                                          className="h-8 text-xs text-center"
                                          min="0"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleQuantityChange(quantityKey, 'cantidad', quantities.cantidad + 1)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {quantities.cantidad > 0 && (
                                        <p className="text-xs text-green-600 font-medium">
                                          Subtotal: {formatCurrency(menu.costo_total * quantities.cantidad)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <Badge variant="secondary" className="text-xs">
                                      Sin menú
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">
                                      No disponible
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
            const menusPorFecha = clientePlan.menus.reduce(
        </div>
      )}

      {/* Ingredients Summary */}
      {!loading && ingredientsSummary && (
        <div id="ingredients-summary" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-purple-900">Resumen de Ingredientes</h3>
            <Badge className="bg-emerald-100 text-emerald-800 border-0">
              Paso 3: Lista de Compras
            </Badge>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(getIngredientsStats().totalCost)}
                </div>
                <div className="text-sm text-purple-600">Costo Total</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">
                  {getIngredientsStats().totalItems}
                </div>
                <div className="text-sm text-blue-600">Ingredientes</div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-white">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(getIngredientsStats().avgCost)}
                </div>
                <div className="text-sm text-green-600">Costo Promedio</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-purple-900">
                Lista de Ingredientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Sort Controls */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="ingredients-search" className="text-sm font-medium text-gray-700">
                    Buscar ingredientes
                  </Label>
                  <Input
                    id="ingredients-search"
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={ingredientsSearch}
                    onChange={(e) => setIngredientsSearch(e.target.value)}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Ordenar por</Label>
                    <select
                      value={ingredientsSortBy}
                      onChange={(e) => setIngredientsSortBy(e.target.value as 'nombre' | 'cantidad' | 'costo')}
                      className="block w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="costo">Costo</option>
                      <option value="nombre">Nombre</option>
                      <option value="cantidad">Cantidad</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Orden</Label>
                    <select
                      value={ingredientsSortOrder}
                      onChange={(e) => setIngredientsSortOrder(e.target.value as 'asc' | 'desc')}
                      className="block w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="desc">Descendente</option>
                      <option value="asc">Ascendente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ingredients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredAndSortedIngredients().map((ingredient: any, index: number) => {
                  const isHighCost = ingredient.costo > getIngredientsStats().avgCost * 1.5
                  
                  return (
                    <Card 
                      key={ingredient.codigo} 
                      className={`border-gray-200 ${isHighCost ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : 'bg-white'}`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                {ingredient.nombre}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                {ingredient.codigo}
                              </p>
                            </div>
                            {isHighCost && (
                              <Badge className="bg-red-100 text-red-800 text-xs border-0 ml-2">
                                Alto
                              </Badge>
                            )}
                          </div>

                          {/* Details */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Cantidad:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {ingredient.cantidad.toFixed(3)} {ingredient.unidad}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Costo:</span>
                              <span className="text-sm font-bold text-purple-900">
                                {formatCurrency(ingredient.costo)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Costo por {ingredient.unidad}:</span>
                              <span className="text-xs text-gray-700">
                                {formatCurrency(ingredient.costo / ingredient.cantidad)}
                              </span>
                            </div>
                          </div>

                          {/* Unit Badge */}
                          <div className="flex justify-end">
                            <Badge 
                              variant="outline" 
                              className="border-purple-300 text-purple-700 text-xs"
                            >
                              {ingredient.unidad}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* No results message */}
              {getFilteredAndSortedIngredients().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron ingredientes con los filtros aplicados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Menu Modal */}
      {selectedMenu && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-purple-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center space-x-4">
                <Badge className={`${getMenuTypeColor(selectedMenu.menu.tipo_menu)} border-0 text-lg px-4 py-2`}>
                  {getMenuTypeName(selectedMenu.menu.tipo_menu)}
                </Badge>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">
                    {selectedMenu.cliente?.nombre || `Cliente`}
                  </h3>
                  <p className="text-purple-600">{formatDate(selectedMenu.fecha)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMenu(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Menu Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {formatCurrency(selectedMenu.menu.costo_total)}
                  </div>
                  <div className="text-sm text-purple-600">Costo Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round(selectedMenu.menu.kilocalorias_total)}
                  </div>
                  <div className="text-sm text-green-600">Kilocalorías</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedMenu.menu.componentes.length}
                  </div>
                  <div className="text-sm text-blue-600">Componentes</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <Sparkles className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {selectedMenu.menu.componentes.filter(c => c.unico).length}
                  </div>
                  <div className="text-sm text-orange-600">Únicos</div>
                </div>
              </div>

              {/* Components Organization */}
              {(() => {
                const { fondo, constants } = separateComponents(selectedMenu.menu.componentes)
                
                return (
                  <>
                    {/* Fondo (Main Components) */}
                    <div>
                      <h4 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                        <CalendarDays className="h-5 w-5 mr-2" />
                        Fondo Principal
                      </h4>
                      {fondo.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fondo
                            .sort((a, b) => a.componente_id - b.componente_id)
                            .map((componente, index) => (
                            <Card key={index} className="border-purple-100 bg-gradient-to-r from-purple-50 to-white">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge className={`${getComponentColor(componente.componente_id)} text-sm font-medium px-3 py-1`}>
                                    {getComponentName(componente.componente_id)}
                                  </Badge>
                                  {componente.unico && (
                                    <Badge className="bg-orange-100 text-orange-800 border-0">
                                      Único
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Receta:</span>
                                    <span className="font-medium text-purple-700">
                                      {getRecipeName(componente.receta_id)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Código:</span>
                                    <span className="font-mono text-sm text-gray-800">
                                      {componente.receta_id}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p>No hay componentes principales</p>
                        </div>
                      )}
                    </div>

                    {/* Constants (Extras) - Expandable Section */}
                    {constants.length > 0 && (
                      <div className="border-t border-purple-200 pt-6">
                        <button
                          onClick={() => setShowExtras(!showExtras)}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-blue-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Sparkles className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold text-green-900">
                              Click para ver los extras ({constants.length})
                            </span>
                          </div>
                          <ChevronDown 
                            className={`h-5 w-5 text-green-600 transition-transform ${showExtras ? 'rotate-180' : ''}`} 
                          />
                        </button>
                        
                        {showExtras && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {constants
                              .sort((a, b) => a.componente_id - b.componente_id)
                              .map((componente, index) => (
                              <Card key={index} className="border-green-100 bg-gradient-to-r from-green-50 to-white">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <Badge className={`${getComponentColor(componente.componente_id)} text-sm font-medium px-3 py-1`}>
                                      {getComponentName(componente.componente_id)}
                                    </Badge>
                                    <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                      Extra
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">Receta:</span>
                                      <span className="font-medium text-green-700">
                                        {getRecipeName(componente.receta_id)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">Código:</span>
                                      <span className="font-mono text-sm text-gray-800">
                                        {componente.receta_id}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-purple-200">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMenu(null)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Shipment Creation Modal */}
      {showShipmentModal && planGenerado && (
        <CreateShipmentModal
          isOpen={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          weeklyPlanData={planGenerado}
          empresaId={empresaId}
          onSuccess={(shipmentId) => {
            setShowShipmentModal(false)
            router.push(`/dashboard/shipments/${shipmentId}`)
          }}
        />
      )}

      {/* Task Delegation Modal */}
      {showTaskDelegationModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Delegar Tarea a sofIA</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTaskDelegationModal(false)}
                disabled={delegatingTask}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900">sofIA</h4>
                  <p className="text-sm text-purple-600">Asistente de IA</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Tareas a realizar:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Generar resumen de ingredientes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Crear envío automáticamente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Notificar cuando esté completo
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  📊 <strong>Resumen:</strong> {Object.values(orderQuantities).reduce((sum, q) => sum + q.cantidad, 0)} menús para {planGenerado?.plan.length || 0} cliente(s)
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTaskDelegationModal(false)}
                  disabled={delegatingTask}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={delegateToSofIA}
                  disabled={delegatingTask}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {delegatingTask ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Delegando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Delegar a sofIA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 