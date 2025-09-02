"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Bot, Clock, CheckCircle, AlertCircle, Calendar, Users, ChefHat, Package, BarChart3, MessageCircle, Search, Hash, X, Loader2, Sparkles, Bell } from 'lucide-react'
import { getCompanyClients, getCompanyInfo, apiPost, apiGet, apiDelete } from '@/lib/api'

// Background job storage key
const BACKGROUND_JOBS_KEY = 'pulpoo_background_jobs'

interface BackgroundJob {
  id: string
  taskId: string
  jobId: string
  startTime: string
  taskType: string
  taskTitle: string
  clientCount: number
  startDate: string
  status: 'polling' | 'completed' | 'failed'
  lastPolled: string
}

interface Task {
  id: string
  title: string
  type: 'generate_menu' | 'generate_weekly_menu' | 'create_shipment' | 'calculate_ingredients' | 'generate_report' | 'process_ingredients_and_shipment'
  status: 'pending' | 'in_progress' | 'needs_input' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  assigned_to: string // AI worker name
  progress: number
  metadata: {
    client_count?: number
    start_date?: string
    clients?: string[]
    shipment_id?: string
    total_cost?: number
    job_id?: string
    plan_data?: any
    order_quantities?: any
    result?: any
    error?: string
    [key: string]: unknown
  }
  company_id: string
  created_by: string
}

interface Client {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  empresa_id: string
  created_at: string
  updated_at: string
}

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
    icon: Hash,
    label: 'Calcular Ingredientes',
    color: 'bg-green-500',
    description: 'Calcular resumen de ingredientes'
  },
  generate_report: {
    icon: BarChart3,
    label: 'Generar Reporte',
    color: 'bg-orange-500',
    description: 'Crear reportes y análisis'
  },
  process_ingredients_and_shipment: {
    icon: Sparkles,
    label: 'Procesar Ingredientes y Envío',
    color: 'bg-emerald-500',
    description: 'Generar resumen de ingredientes y crear envío'
  }
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-slate-600', icon: Clock },
  in_progress: { label: 'En Progreso', color: 'bg-blue-500', icon: Bot },
  needs_input: { label: 'Necesita Input', color: 'bg-amber-500', icon: AlertCircle },
  completed: { label: 'Completado', color: 'bg-emerald-500', icon: CheckCircle },
  failed: { label: 'Fallido', color: 'bg-red-500', icon: AlertCircle }
}

export default function TaskDelegationPage() {
  const router = useRouter()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  
  // New states for client selection
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<number[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  
  // Task creation states
  const [creatingTask, setCreatingTask] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState<string>("")
  const [jobStartTime, setJobStartTime] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [notification, setNotification] = useState<string | null>(null)
  
  // Background job states
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([])
  const [activePolling, setActivePolling] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTasks()
    resumeBackgroundJobs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showCreateModal) {
      fetchClients()
    }
  }, [showCreateModal])

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

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [notification])

  // Background job management functions
  const saveBackgroundJob = (job: BackgroundJob) => {
    try {
      const existingJobs = getBackgroundJobs()
      const updatedJobs = existingJobs.filter(j => j.id !== job.id)
      updatedJobs.push(job)
      localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(updatedJobs))
      setBackgroundJobs(updatedJobs)
    } catch (error) {
      console.error('Error saving background job:', error)
    }
  }

  const getBackgroundJobs = (): BackgroundJob[] => {
    try {
      const stored = localStorage.getItem(BACKGROUND_JOBS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading background jobs:', error)
      return []
    }
  }

  const removeBackgroundJob = (jobId: string) => {
    try {
      const existingJobs = getBackgroundJobs()
      const updatedJobs = existingJobs.filter(j => j.id !== jobId)
      localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(updatedJobs))
      setBackgroundJobs(updatedJobs)
    } catch (error) {
      console.error('Error removing background job:', error)
    }
  }

  const resumeBackgroundJobs = async () => {
    try {
      const jobs = getBackgroundJobs()
      const activeJobs = jobs.filter(job => job.status === 'polling')
      
      if (activeJobs.length > 0) {
        setBackgroundJobs(jobs)
        // Restore missing tasks for background jobs
        setTasks(prevTasks => {
          const existingTaskIds = new Set(prevTasks.map(t => t.id))
          const restoredTasks = activeJobs
            .filter(job => !existingTaskIds.has(job.taskId))
            .map(job => ({
              id: job.taskId,
              title: job.taskTitle,
              type: job.taskType as Task['type'],
              status: 'in_progress' as Task['status'],
              priority: 'medium',
              created_at: job.startTime,
              updated_at: job.lastPolled,
              assigned_to: 'sofIA',
              progress: 5,
              metadata: {
                client_count: job.clientCount,
                start_date: job.startDate,
                job_id: job.jobId
              },
              company_id: 'current-company',
              created_by: 'current-user'
            } as Task))
          return [...restoredTasks, ...prevTasks]
        })
        // Resume polling for each active job
        activeJobs.forEach(job => {
          if (!activePolling.has(job.id)) {
            startBackgroundPolling(job)
          }
        })
      }
    } catch (error) {
      console.error('Error resuming background jobs:', error)
    }
  }

  const startBackgroundPolling = (job: BackgroundJob) => {
    if (activePolling.has(job.id)) {
      return // Already polling
    }

    setActivePolling(prev => new Set([...prev, job.id]))
    console.log(`Starting background polling for job ${job.id}`)

    const pollInterval = setInterval(async () => {
      try {
        const status = await apiGet(`/job-status/${job.jobId}`)
        
        // Update job in localStorage
        const updatedJob = {
          ...job,
          lastPolled: new Date().toISOString()
        }

        // Update task in UI if it exists
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === job.taskId 
            ? { 
                ...task, 
                status: status.status === 'completed' ? 'completed' : 
                       status.status === 'failed' || status.status === 'error' ? 'failed' : 'in_progress',
                progress: status.progress_percentage || task.progress,
                updated_at: new Date().toISOString()
              }
            : task
        ))

        if (status.status === 'completed') {
          // Job completed successfully
          updatedJob.status = 'completed'
          saveBackgroundJob(updatedJob)
          
          // Handle generate_weekly_menu tasks differently
          if (job.taskType === 'generate_weekly_menu') {
            // Show notification for menu generation - needs input for quantities
            setNotification(`🎉 Menús semanales generados: ${job.taskTitle} - Haz clic para ingresar cantidades`)
            
            // Update task status to needs_input (user needs to input quantities)
            setTasks(prevTasks => prevTasks.map(task => 
              task.id === job.taskId 
                ? { 
                    ...task, 
                    status: 'needs_input',
                    progress: 100,
                    updated_at: new Date().toISOString(),
                    metadata: {
                      ...task.metadata,
                      plan_data: status.result || status.data // Store the generated plan
                    }
                  }
                : task
            ))
          } else {
            // Show regular completion notification
            setNotification(`🎉 Tarea completada: ${job.taskTitle}`)
            
            // Update final task status
            setTasks(prevTasks => prevTasks.map(task => 
              task.id === job.taskId 
                ? { 
                    ...task, 
                    status: 'completed',
                    progress: 100,
                    updated_at: new Date().toISOString()
                  }
                : task
            ))
          }
          
          // Clean up
          clearInterval(pollInterval)
          setActivePolling(prev => {
            const newSet = new Set(prev)
            newSet.delete(job.id)
            return newSet
          })
          
          // Clean up backend job
          await cleanupJob(job.jobId)
          
          // Remove from background jobs
          removeBackgroundJob(job.id)
          
          console.log(`Background job ${job.id} completed successfully`)
          
        } else if (status.status === 'failed' || status.status === 'error') {
          // Job failed
          updatedJob.status = 'failed'
          saveBackgroundJob(updatedJob)
          
          // Show error notification
          setNotification(`❌ Tarea falló: ${job.taskTitle}`)
          
          // Update task status
          setTasks(prevTasks => prevTasks.map(task => 
            task.id === job.taskId 
              ? { 
                  ...task, 
                  status: 'failed',
                  updated_at: new Date().toISOString()
                }
              : task
          ))
          
          // Clean up
          clearInterval(pollInterval)
          setActivePolling(prev => {
            const newSet = new Set(prev)
            newSet.delete(job.id)
            return newSet
          })
          
          // Clean up backend job
          await cleanupJob(job.jobId)
          
          // Remove from background jobs
          removeBackgroundJob(job.id)
          
          console.log(`Background job ${job.id} failed`)
          
        } else {
          // Job still in progress, update localStorage
          saveBackgroundJob(updatedJob)
        }
        
      } catch (error) {
        // Graceful handling for 'Job not found'
        if (error instanceof Error && error.message && error.message.includes('Job not found')) {
          setNotification('El trabajo ha finalizado o no se encontró.')
          clearInterval(pollInterval)
          setActivePolling(prev => {
            const newSet = new Set(prev)
            newSet.delete(job.id)
            return newSet
          })
          await cleanupJob(job.jobId)
          removeBackgroundJob(job.id)
          return
        }
        console.error(`Error polling background job ${job.id}:`, error)
        
        // Check if it's a timeout (15 minutes)
        const startTime = new Date(job.startTime).getTime()
        const now = new Date().getTime()
        const elapsedMinutes = (now - startTime) / (1000 * 60)
        
        if (elapsedMinutes > 15) {
          // Timeout - mark as failed
          const updatedJob = { ...job, status: 'failed' as const }
          saveBackgroundJob(updatedJob)
          
          setNotification(`⏰ Tarea expiró: ${job.taskTitle}`)
          
          // Clean up
          clearInterval(pollInterval)
          setActivePolling(prev => {
            const newSet = new Set(prev)
            newSet.delete(job.id)
            return newSet
          })
          
          // Clean up backend job
          await cleanupJob(job.jobId)
          
          // Remove from background jobs
          removeBackgroundJob(job.id)
          
          console.log(`Background job ${job.id} timed out`)
        }
      }
    }, 5000) // Poll every 5 seconds
  }

  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      const clientsData = await getCompanyClients()
      setClients(clientsData)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/tasks')
      setTasks(response.tasks || response.data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
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

  // Helper function to clean up job
  const cleanupJob = async (jobId: string) => {
    try {
      await apiDelete(`/job/${jobId}`)
    } catch (error) {
      console.warn('Failed to cleanup job:', error)
    }
  }

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task.id, 'Status:', task.status, 'Type:', task.type)
    
    if (task.status === 'needs_input' && (task.type === 'generate_menu' || task.type === 'generate_weekly_menu')) {
      // Store the plan data in localStorage to pass to the menu generation page
      const planData = task.metadata.plan_data
      console.log('Plan data found:', !!planData)
      
      if (planData) {
        localStorage.setItem('generated_plan_data', JSON.stringify(planData))
        // Store the original task ID so we can update its status later
        localStorage.setItem('original_task_id', task.id)
        console.log('Navigating to /dashboard/menus?from_task=true')
        router.push('/dashboard/menus?from_task=true')
      } else {
        console.error('No plan data found in task metadata')
      }
    } else {
      console.log('Task not clickable - Status:', task.status, 'Type:', task.type)
    }
  }



  const getTaskTitle = (taskType: string | null, clients: number[], date: string) => {
    if (!taskType) return 'Nueva tarea'
    
    const config = taskTypeConfig[taskType as keyof typeof taskTypeConfig]
    if (taskType === 'generate_weekly_menu') {
      return `${config.label} - Semana del ${date} (${clients.length} clientes)`
    }
    return config.label
  }

  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleCreateTask = async () => {
    if (!selectedTaskType || (selectedTaskType === 'generate_weekly_menu' && (selectedClients.length === 0 || !startDate))) {
      return
    }

    setCreatingTask(true)
    setCurrentJobId(null)
    setJobProgress("")
    setJobStartTime(null)
    setElapsedTime(0)

    try {
      // Get company info to include empresa_id
      const companyInfo = await getCompanyInfo()
      if (!companyInfo) {
        throw new Error('No se pudo obtener la información de la empresa')
      }

      // Create the task in the UI immediately
      const newTask: Task = {
        id: 'temp-id', // Will be replaced with real ID from backend
        title: getTaskTitle(selectedTaskType, selectedClients, startDate),
        type: selectedTaskType as Task['type'],
        status: 'pending',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: 'sofIA',
        progress: 0,
        metadata: {
          client_count: selectedClients.length,
          start_date: startDate,
          clients: selectedClients.map(id => {
            const client = clients.find(c => c.id === id)
            return client ? `${client.nombre} ${client.apellido}` : `Cliente ${id}`
          })
        },
        company_id: companyInfo.empresa_id,
        created_by: 'current-user' // TODO: Get actual user ID
      }

      // Create task via API
      const taskData = {
        type: selectedTaskType,
        title: newTask.title,
        empresa_id: companyInfo.empresa_id,
        metadata: newTask.metadata,
        priority: 'medium',
        assigned_to: 'sofIA'
      }
      
      const createdTask = await apiPost('/tasks', taskData)
      
      // Update task with the real ID from backend
      const taskWithRealId = { ...newTask, id: createdTask.id }
      setTasks(prevTasks => [taskWithRealId, ...prevTasks])

      if (selectedTaskType === 'generate_weekly_menu') {
        // NEW: Use the correct task type for backend's global recursion algorithm
        // Step 1: Create the task data as instructed by backend
        const weeklyMenuTaskData = {
          type: "generate_weekly_menu",
          title: "Generate Weekly Menu",
          metadata: {
            fecha_inicio: startDate,
            clientes: selectedClients // Array of client IDs
          },
          priority: "medium",
          empresa_id: companyInfo.empresa_id,
          created_by: "user_id" // TODO: Get actual user ID
        }
        
        // Step 2: Create the task via API
        const response = await apiPost('/tasks', weeklyMenuTaskData)
        const taskId = response.task_id
        
        // Step 3: Start polling for status updates
        setJobProgress("Starting global recursion algorithm...")
        
        const pollForStatus = setInterval(async () => {
          try {
            const tasks = await apiGet('/tasks')
            const task = tasks.tasks.find((t: any) => t.id === taskId)
            
            if (task?.status === 'completed') {
              clearInterval(pollForStatus)
              const menuPlan = task.metadata.result // This contains the generated menu plan
              console.log('Menu generated:', menuPlan)
              
              // Update task in UI - set to needs_input so user can input quantities
              setTasks(prevTasks => prevTasks.map(t => 
                t.id === createdTask.id 
                  ? { 
                      ...t, 
                      status: 'needs_input',
                      progress: 100,
                      metadata: { ...t.metadata, plan_data: menuPlan }
                    }
                  : t
              ))
              
              setNotification(`🎉 Menú semanal generado - Haz clic para ingresar cantidades`)
              
            } else if (task?.status === 'failed') {
              clearInterval(pollForStatus)
              console.error('Menu generation failed:', task.metadata.error)
              
              // Update task in UI
              setTasks(prevTasks => prevTasks.map(t => 
                t.id === createdTask.id 
                  ? { 
                      ...t, 
                      status: 'failed',
                      metadata: { ...t.metadata, error: task.metadata.error }
                    }
                  : t
              ))
              
              setNotification(`❌ Error generando menú: ${task.metadata.error}`)
            }
          } catch (error) {
            console.error('Error polling task status:', error)
          }
        }, 1000) // Poll every second
        
        // Set up temporary UI tracking
        setCurrentJobId(taskId)
        setJobStartTime(new Date().toISOString())
        setJobProgress("Global recursion algorithm started...")

        // Update task with task ID
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === createdTask.id 
            ? { 
                ...task, 
                status: 'in_progress',
                progress: 5,
                metadata: { ...task.metadata, task_id: taskId }
              }
            : task
        ))

        console.log('✅ Weekly menu task created:', taskId)
        
        // Show success message
        setNotification(`🚀 Tarea de menú semanal iniciada: ${newTask.title}`)
        
        // Clear temporary UI state after a short delay
        setTimeout(() => {
          setCreatingTask(false)
          setCurrentJobId(null)
          setJobProgress("")
          setJobStartTime(null)
          setElapsedTime(0)
        }, 3000)
        
      } else {
        // For other task types, the backend will handle processing
        setNotification(`🚀 Tarea creada: ${newTask.title}`)
        setCreatingTask(false)
      }
      
      // Reset and close modal
      resetModal()
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Error creating task:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setNotification(`❌ Error creando tarea: ${errorMessage}`)
      setCreatingTask(false)
      setCurrentJobId(null)
      setJobProgress("")
      setJobStartTime(null)
      setElapsedTime(0)
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    const config = statusConfig[status]
    const StatusIcon = config.icon
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTaskTypeIcon = (type: Task['type']) => {
    const config = taskTypeConfig[type]
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesType = filterType === 'all' || task.type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const activeTasks = filteredTasks.filter(task => 
    ['pending', 'in_progress', 'needs_input'].includes(task.status)
  )
  
  const completedTasks = filteredTasks.filter(task => 
    ['completed', 'failed'].includes(task.status)
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderTaskCard = (task: Task) => {
    const taskConfig = taskTypeConfig[task.type]
    const needsInput = task.status === 'needs_input'
    const isClickable = needsInput && (task.type === 'generate_menu' || task.type === 'generate_weekly_menu')
    
    return (
      <Card 
        className={`border-l-4 ${taskConfig.color} ${needsInput ? 'ring-2 ring-amber-200' : ''} bg-white shadow-sm ${isClickable ? 'cursor-pointer hover:shadow-md hover:bg-amber-50 transition-all' : ''}`}
        onClick={() => isClickable && handleTaskClick(task)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${taskConfig.color} text-white shadow-sm`}>
                {getTaskTypeIcon(task.type)}
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">{task.title}</CardTitle>
                <p className="text-sm text-slate-600">{taskConfig.description}</p>
                {isClickable && (
                  <p className="text-sm text-amber-600 font-medium mt-1">
                    📝 Haz clic para ingresar cantidades y continuar
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge(task.status)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Bot className="h-4 w-4 text-purple-500" />
              {task.assigned_to}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-slate-500" />
              {formatDate(task.created_at)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-700 mb-1">
              <span>Progreso</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${taskConfig.color}`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
          
          {/* Task Metadata */}
          <div className="space-y-2">
            {(task.type === 'generate_menu' || task.type === 'generate_weekly_menu') && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 text-slate-500" />
                <span>{task.metadata.client_count} clientes</span>
                <Calendar className="h-4 w-4 text-slate-500 ml-2" />
                <span>{task.metadata.start_date}</span>
              </div>
            )}
            
            {task.type === 'create_shipment' && task.metadata.total_cost && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="h-4 w-4 text-slate-500" />
                <span>Total: S/ {task.metadata.total_cost}</span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {needsInput && (task.type === 'generate_menu' || task.type === 'generate_weekly_menu') && (
              <Button 
                size="sm" 
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={(e) => {
                  e.stopPropagation() // Prevent card click
                  handleTaskClick(task)
                }}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Proporcionar Input
              </Button>
            )}
            
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat con sofIA
            </Button>
            
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCreateTaskModal = () => {
    if (!showCreateModal) return null
    
    return (
      <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Crear Nueva Tarea</h3>
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
                        {clients.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-2">
                            No hay clientes disponibles
                          </p>
                        ) : (
                          clients.map(client => (
                            <div key={client.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`client-${client.id}`}
                                checked={selectedClients.includes(client.id)}
                                onCheckedChange={(checked) => handleClientSelection(client.id, checked === true)}
                              />
                              <label 
                                htmlFor={`client-${client.id}`} 
                                className="text-sm cursor-pointer flex-1 text-slate-700"
                              >
                                {client.nombre} {client.apellido}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={() => {
                resetModal()
                setShowCreateModal(false)
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTask}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!selectedTaskType || (selectedTaskType === 'generate_weekly_menu' && (selectedClients.length === 0 || !startDate)) || creatingTask}
            >
              {creatingTask ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Tarea'
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium text-slate-800">{notification}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotification(null)}
                className="ml-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delegación de Tareas</h1>
          <div className="flex items-center gap-4">
            <p className="text-slate-600">Delega tareas a sofIA y otros trabajadores de IA</p>
            {backgroundJobs.filter(job => job.status === 'polling').length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                <span className="text-xs text-blue-700 font-medium">
                  {backgroundJobs.filter(job => job.status === 'polling').length} tarea(s) en progreso
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            disabled={creatingTask}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm px-6"
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
            onClick={() => setShowCreateModal(true)}
            disabled={creatingTask}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:border-purple-500 focus:ring-purple-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="needs_input">Necesita Input</option>
          <option value="completed">Completado</option>
          <option value="failed">Fallido</option>
        </select>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:border-purple-500 focus:ring-purple-500"
        >
          <option value="all">Todos los tipos</option>
          <option value="generate_menu">Generar Menú</option>
          <option value="create_shipment">Crear Envío</option>
          <option value="calculate_ingredients">Calcular Ingredientes</option>
          <option value="generate_report">Generar Reporte</option>
        </select>
      </div>
      
      {/* Job Progress Display */}
      {currentJobId && (
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="text-center space-y-6 py-8">
            {/* AI Brain Animation */}
            <div className="relative mx-auto w-20 h-20">
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
                <Sparkles className="h-5 w-5 text-purple-600 animate-bounce" />
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
              <h3 className="text-xl font-bold text-purple-900">IA Trabajando en la Tarea</h3>
              
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

              {/* Progress bar */}
              <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse"
                  style={{
                    width: "100%",
                    animation: "loading-bar 3s ease-in-out infinite",
                  }}
                ></div>
              </div>

              {/* Enhanced info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700">
                  ⚡ <strong>Proceso Asíncrono:</strong> La tarea se está ejecutando en segundo plano. 
                  Puedes continuar navegando mientras sofIA trabaja en tu solicitud.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tasks Tabs */}
      <div className="w-full">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Tareas Activas ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Historial ({completedTasks.length})
          </button>
        </div>
        
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <Card className="text-center py-12 bg-white border-slate-200 shadow-sm">
                <CardContent>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No hay tareas activas
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Delega tareas a sofIA para automatizar tus procesos
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-base"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Delegar Tarea a sofIA
                    </Button>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-3 text-base"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nueva Tarea
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeTasks.map((task, idx) => (
                  <div key={task.id || `active-task-${idx}`}>
                    {renderTaskCard(task)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedTasks.length === 0 ? (
              <Card className="text-center py-12 bg-white border-slate-200 shadow-sm">
                <CardContent>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No hay tareas completadas
                  </h3>
                  <p className="text-slate-600">
                    Las tareas completadas aparecerán aquí cuando el sistema esté disponible
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task, idx) => (
                  <div key={task.id || `completed-task-${idx}`}>
                    {renderTaskCard(task)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Create Task Modal */}
      {renderCreateTaskModal()}
    </div>
    </>
  )
} 