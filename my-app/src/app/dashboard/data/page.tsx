"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  Package, 
  DollarSign, 
  Users, 
  ChefHat, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Loader2,
  Utensils,
  AlertCircle
} from 'lucide-react'
import { 
  getFilteredShipments, 
  getShipmentFilterOptions, 
  getDashboardSummary,
  getCompanyInfo,
  type FilterParams,
  type DashboardShipment,
  type FilterOptionsResponse,
  type SummaryResponse
} from '@/lib/api'

interface DashboardState {
  // Data
  shipments: DashboardShipment[]
  filterOptions: FilterOptionsResponse['options'] | null
  summary: SummaryResponse['summary'] | null
  
  // UI State
  loading: boolean
  error: string | null
  currentPage: number
  pageSize: number
  totalResults: number
  
  // Filters
  activeFilters: FilterParams
  appliedFilters: FilterParams
  showFilters: boolean
}

const INITIAL_FILTERS: FilterParams = {
  empresa_id: '',
  limit: 50,
  offset: 0,
  sort_by: 'created_at',
  sort_order: 'desc'
}

export default function DataDashboard() {
  const [state, setState] = useState<DashboardState>({
    shipments: [],
    filterOptions: null,
    summary: null,
    loading: true,
    error: null,
    currentPage: 1,
    pageSize: 50,
    totalResults: 0,
    activeFilters: { ...INITIAL_FILTERS },
    appliedFilters: { ...INITIAL_FILTERS },
    showFilters: false
  })

  const [empresaId, setEmpresaId] = useState<string>('')
  
  // Client menus inline state
  const [expandedClientMenus, setExpandedClientMenus] = useState<Set<string>>(new Set())
  const [clientMenusData, setClientMenusData] = useState<Record<string, any>>({})
  const [loadingClientMenus, setLoadingClientMenus] = useState<Set<string>>(new Set())

  const router = useRouter()

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const companyInfo = await getCompanyInfo()
        if (!companyInfo?.empresa_id) {
          setState(prev => ({ ...prev, error: 'No company information found', loading: false }))
          return
        }

        const newEmpresaId = companyInfo.empresa_id
        setEmpresaId(newEmpresaId)

        setState(prev => ({
          ...prev,
          activeFilters: { ...prev.activeFilters, empresa_id: newEmpresaId },
          appliedFilters: { ...prev.appliedFilters, empresa_id: newEmpresaId }
        }))

        // Load initial data
        await Promise.all([
          loadFilterOptions(newEmpresaId),
          loadSummary(newEmpresaId),
          loadShipments({ ...INITIAL_FILTERS, empresa_id: newEmpresaId })
        ])
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to initialize dashboard',
          loading: false 
        }))
      }
    }

    initializeDashboard()
  }, [])

  // Load filter options
  const loadFilterOptions = async (empresaId: string) => {
    try {
      const options = await getShipmentFilterOptions(empresaId)
      setState(prev => ({ ...prev, filterOptions: options.options }))
    } catch (error) {
      console.error('Failed to load filter options:', error)
    }
  }

  // Load summary statistics
  const loadSummary = async (empresaId: string, startDate?: string, endDate?: string) => {
    try {
      const summaryData = await getDashboardSummary(empresaId, startDate, endDate)
      setState(prev => ({ ...prev, summary: summaryData.summary }))
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  // Load shipments with filters
  const loadShipments = async (filters: FilterParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('Loading shipments with filters:', filters)
      const response = await getFilteredShipments(filters)
      console.log('Shipments response:', response)
      setState(prev => ({
        ...prev,
        shipments: response.shipments,
        totalResults: response.total_found,
        loading: false,
        error: null // Clear any previous errors
      }))
    } catch (error) {
      console.error('Error loading shipments:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load shipments',
        loading: false,
        // Don't clear shipments if we have existing data, just show the error
      }))
    }
  }

  // Apply filters
  const applyFilters = useCallback(() => {
    const newFilters: FilterParams = {
      ...state.activeFilters,
      offset: 0
    }

    setState(prev => ({
      ...prev,
      appliedFilters: newFilters,
      currentPage: 1
    }))

    loadShipments(newFilters)
    
    // Update summary with date filters if applied
    if (newFilters.start_date || newFilters.end_date) {
      loadSummary(empresaId, newFilters.start_date, newFilters.end_date)
    }
  }, [state.activeFilters, empresaId])

  // Clear filters
  const clearFilters = useCallback(() => {
    const resetFilters = { ...INITIAL_FILTERS, empresa_id: empresaId }
    
    setState(prev => ({
      ...prev,
      activeFilters: resetFilters,
      appliedFilters: resetFilters,
      currentPage: 1
    }))
    
    loadShipments(resetFilters)
    loadSummary(empresaId)
  }, [empresaId])

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newFilters = {
      ...state.appliedFilters,
      offset: (page - 1) * state.pageSize
    }
    
    setState(prev => ({ ...prev, currentPage: page }))
    loadShipments(newFilters)
  }



  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  // Get week range display
  const getWeekRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // Export results
  const exportResults = () => {
    const consolidatedData = getConsolidatedData()
    const csvContent = [
      ['Cliente', 'Semana', 'Menús Solicitados', 'Costo Total', 'Estado'].join(','),
      ...consolidatedData.map(item => [
        item.clientName,
        getWeekRange(item.weekStart, item.weekEnd),
        item.totalMenus,
        item.totalCost,
        item.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consolidated-shipments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Fetch client menus
  const fetchClientMenus = async (shipmentId: string, clientName: string) => {
    const key = `${shipmentId}-${clientName}`
    
    // If already expanded, collapse it
    if (expandedClientMenus.has(key)) {
      setExpandedClientMenus(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
      return
    }

    // If data already exists, just expand
    if (clientMenusData[key]) {
      setExpandedClientMenus(prev => new Set([...prev, key]))
      return
    }

    // Add to loading set
    setLoadingClientMenus(prev => new Set([...prev, key]))

    try {
      // Find client ID from filter options
      const clientId = state.filterOptions?.clients?.find(
        client => client.nombre === clientName
      )?.id

      if (!clientId) {
        throw new Error('Client ID not found')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      if (!backendUrl) {
        throw new Error('Backend URL not configured')
      }

      const response = await fetch(`${backendUrl}/shipments/${shipmentId}/clients/${clientId}/menus`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch client menus')
      }

      const data = await response.json()
      
      // Store the data and expand
      setClientMenusData(prev => ({ ...prev, [key]: data }))
      setExpandedClientMenus(prev => new Set([...prev, key]))
    } catch (err) {
      console.error('Error fetching client menus:', err)
      // Store error state
      setClientMenusData(prev => ({ ...prev, [key]: { error: true } }))
    } finally {
      // Remove from loading set
      setLoadingClientMenus(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  // Interface for consolidated data
  interface ConsolidatedItem {
    clientName: string;
    weekStart: string;
    weekEnd: string;
    totalMenus: number;
    totalCost: number;
    status: string;
    shipmentId: string;
    clientId?: string; // Will be populated if available
    menuDetails?: Array<{
      name: string;
      count: number;
    }>;
  }

  // Function to consolidate shipments by client and week
  const getConsolidatedData = (): ConsolidatedItem[] => {
    if (!state.shipments.length) return []

    // Apply client-side filtering if needed
    let filteredShipments = state.shipments
    
    console.log('Applied filters:', state.appliedFilters)
    console.log('Total shipments before filtering:', state.shipments.length)
    
    // Filter by client if specified
    if (state.appliedFilters.client_names && state.appliedFilters.client_names !== '') {
      filteredShipments = state.shipments.filter(shipment => 
        shipment.client_names?.some(clientName => 
          clientName.toLowerCase().includes(state.appliedFilters.client_names!.toLowerCase())
        )
      )
      console.log('Shipments after client filtering:', filteredShipments.length)
    }

    // Filter by week start date if specified
    if (state.appliedFilters.start_date && state.appliedFilters.start_date !== '') {
      filteredShipments = filteredShipments.filter(shipment => 
        shipment.week_start_date >= state.appliedFilters.start_date!
      )
      console.log('Shipments after start date filtering:', filteredShipments.length)
    }

    // Filter by week end date if specified
    if (state.appliedFilters.end_date && state.appliedFilters.end_date !== '') {
      filteredShipments = filteredShipments.filter(shipment => 
        shipment.week_end_date <= state.appliedFilters.end_date!
      )
      console.log('Shipments after end date filtering:', filteredShipments.length)
    }

    // Group shipments by client and week
    const grouped = filteredShipments.reduce((acc, shipment) => {
      const key = `${shipment.client_names?.[0] || 'Cliente Desconocido'}-${shipment.week_start_date}`
      
      if (!acc[key]) {
        acc[key] = {
          clientName: shipment.client_names?.[0] || 'Cliente Desconocido',
          weekStart: shipment.week_start_date,
          weekEnd: shipment.week_end_date,
          totalMenus: 0,
          totalCost: 0,
          status: shipment.status,
          shipmentId: shipment.id,
          menuDetails: []
        }
      }
      
      acc[key].totalMenus += shipment.total_menus
      acc[key].totalCost += shipment.total_cost
      
      // Add menu details if available
      if (shipment.total_menus > 0) {
        acc[key].menuDetails?.push({
          name: `Menú ${shipment.id.substring(0, 8)}`,
          count: shipment.total_menus
        })
      }
      
      return acc
    }, {} as Record<string, ConsolidatedItem>)

    return Object.values(grouped)
  }

  const totalPages = Math.ceil(state.totalResults / state.pageSize)

  if (state.loading && !state.shipments.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-8 w-8" />
              Dashboard de Datos
            </h1>
            <p className="text-purple-100 mt-2">
              Filtrado avanzado y análisis de todos tus envíos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportResults}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={state.shipments.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {state.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Envíos</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {state.summary.total_shipments.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Costo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(state.summary.total_cost)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Menús</CardTitle>
              <ChefHat className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {state.summary.total_menus.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {state.summary.total_clients.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simple Filters Section */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Simples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simple Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Client Filter */}
            <div>
              <Label htmlFor="client_filter">Cliente</Label>
              <select
                id="client_filter"
                value={state.activeFilters.client_names || ''}
                onChange={(e) => {
                  const newFilters = { ...state.activeFilters, client_names: e.target.value }
                  setState(prev => ({
                    ...prev,
                    activeFilters: newFilters,
                    appliedFilters: newFilters,
                    currentPage: 1
                  }))
                  loadShipments(newFilters)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos los clientes</option>
                {state.filterOptions?.clients?.map((client) => (
                  <option key={client.id} value={client.nombre}>
                    {client.nombre}
                  </option>
                )) || []}
              </select>
            </div>

            {/* Week Start Date */}
            <div>
              <Label htmlFor="week_start">Inicio de Semana</Label>
              <Input
                id="week_start"
                type="date"
                value={state.activeFilters.start_date || ''}
                onChange={(e) => {
                  const newFilters = { ...state.activeFilters, start_date: e.target.value }
                  setState(prev => ({
                    ...prev,
                    activeFilters: newFilters,
                    appliedFilters: newFilters,
                    currentPage: 1
                  }))
                  loadShipments(newFilters)
                  if (e.target.value || state.activeFilters.end_date) {
                    loadSummary(empresaId, e.target.value, state.activeFilters.end_date)
                  }
                }}
              />
            </div>

            {/* Week End Date */}
            <div>
              <Label htmlFor="week_end">Fin de Semana</Label>
              <Input
                id="week_end"
                type="date"
                value={state.activeFilters.end_date || ''}
                onChange={(e) => {
                  const newFilters = { ...state.activeFilters, end_date: e.target.value }
                  setState(prev => ({
                    ...prev,
                    activeFilters: newFilters,
                    appliedFilters: newFilters,
                    currentPage: 1
                  }))
                  loadShipments(newFilters)
                  if (e.target.value || state.activeFilters.start_date) {
                    loadSummary(empresaId, state.activeFilters.start_date, e.target.value)
                  }
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status_filter">Estado</Label>
              <select
                id="status_filter"
                value={state.activeFilters.status || ''}
                onChange={(e) => {
                  const newFilters = { ...state.activeFilters, status: e.target.value as any || undefined }
                  setState(prev => ({
                    ...prev,
                    activeFilters: newFilters,
                    appliedFilters: newFilters,
                    currentPage: 1
                  }))
                  loadShipments(newFilters)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={clearFilters} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Limpiar Todo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {state.error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="flex-shrink-0">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Advertencia de conexión</p>
                <p className="text-xs text-amber-700 mt-1">
                  {state.error} - Los datos mostrados pueden no estar actualizados.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consolidated View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resumen Diario de Costos por Cliente</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {state.loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>
                Mostrando {getConsolidatedData().length} resultados consolidados
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {state.shipments.length === 0 && !state.loading ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron envíos con los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/6">Cliente</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/4">Semana</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/6">Menús</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/6">Costo</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/6">Estado</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700 w-1/6">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {getConsolidatedData().map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm font-medium">
                        {item.clientName}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {getWeekRange(item.weekStart, item.weekEnd)}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span>{item.totalMenus}</span>
                          {item.menuDetails && item.menuDetails.length > 0 && (
                            <div className="group relative">
                              <ChefHat className="h-3 w-3 text-gray-400 cursor-help" />
                              <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-xs bg-black text-white rounded shadow-lg">
                                <div className="font-medium mb-1">Detalles:</div>
                                {item.menuDetails.slice(0, 3).map((menu, idx) => (
                                  <div key={idx} className="mb-1">
                                    • {menu.name}: {menu.count}
                                  </div>
                                ))}
                                {item.menuDetails.length > 3 && (
                                  <div className="text-gray-300">+{item.menuDetails.length - 3} más</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm font-medium">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge status={item.status as any} size="sm" />
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          size="sm"
                          onClick={() => fetchClientMenus(item.shipmentId, item.clientName)}
                          disabled={loadingClientMenus.has(`${item.shipmentId}-${item.clientName}`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 disabled:opacity-50"
                        >
                          {loadingClientMenus.has(`${item.shipmentId}-${item.clientName}`) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Elementos por página:</span>
            <select
              value={state.pageSize}
              onChange={(e) => setState(prev => ({ ...prev, pageSize: Number(e.target.value) }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={state.currentPage === 1}
            >
              Anterior
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, state.currentPage - 2)) + i
              return (
                <Button
                  key={page}
                  variant={page === state.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={page === state.currentPage ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={state.currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Inline Client Menus */}
      {getConsolidatedData().map((item, index) => {
        const key = `${item.shipmentId}-${item.clientName}`
        const isExpanded = expandedClientMenus.has(key)
        const isLoading = loadingClientMenus.has(key)
        const clientData = clientMenusData[key]
        
        return (
          <div key={`${index}-menus`}>
            {/* Client Menus Section */}
            {isExpanded && (
              <Card className="mt-4 mb-6 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Menús de {item.clientName}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchClientMenus(item.shipmentId, item.clientName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                      <p className="text-gray-600">Cargando menús del cliente...</p>
                    </div>
                  ) : clientData && !clientData.error ? (
                    <div className="space-y-6">
                      {/* Client Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Cliente</p>
                          <p className="font-medium">{item.clientName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Menús</p>
                          <p className="font-medium">{clientData.total_menus || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Costo Total</p>
                          <p className="font-medium">{formatCurrency(clientData.total_cost || 0)}</p>
                        </div>
                      </div>

                      {/* Calendar View */}
                      {clientData.menus && clientData.menus.length > 0 ? (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Vista de Calendario
                          </h3>
                          
                          {/* Calendar Grid */}
                          <div className="overflow-x-auto">
                            <div className="min-w-max">
                              {(() => {
                                const days = [...new Set(clientData.menus.map((menu: any) => menu.fecha))].sort() as string[]
                                const menuTypes = [...new Set(clientData.menus.map((menu: any) => menu.tipo_menu_nombre))].sort() as string[]
                                
                                return (
                                  <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(200px, 1fr))` }}>
                                    {/* Day Headers */}
                                    {days.map((day: string, dayIndex: number) => {
                                      const dayMenus = clientData.menus.filter((menu: any) => menu.fecha === day)
                                      const totalCost = dayMenus.reduce((sum: number, menu: any) => sum + menu.costo_total, 0)
                                      const totalKcal = dayMenus.reduce((sum: number, menu: any) => sum + menu.kilocalorias_total, 0)
                                      
                                      return (
                                        <div key={dayIndex} className="text-center">
                                          <div className="bg-purple-100 rounded-t-lg p-3 border-b-2 border-purple-200">
                                            <h4 className="font-semibold text-purple-900">
                                              {new Date(day).toLocaleDateString('es-ES', { weekday: 'long' })}
                                            </h4>
                                            <p className="text-sm text-purple-700">
                                              {formatDate(day)}
                                            </p>
                                            <div className="mt-2 text-xs">
                                              <p className="text-purple-600">{formatCurrency(totalCost)}</p>
                                              <p className="text-purple-600">{totalKcal} kcal</p>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                    
                                    {/* Menu Types Grid */}
                                    {days.map((day: string, dayIndex: number) => (
                                      <div key={`menu-${dayIndex}`} className="space-y-3">
                                        {menuTypes.map((menuType: string, typeIndex: number) => {
                                          const menu = clientData.menus.find((m: any) => 
                                            m.fecha === day && m.tipo_menu_nombre === menuType
                                          )
                                          
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
                                                      ✓ Completo
                                                    </Badge>
                                                  )}
                                                </CardTitle>
                                              </CardHeader>
                                              <CardContent className="pt-0">
                                                {menu ? (
                                                  <div className="space-y-2">
                                                    <div className="text-xs">
                                                      <p className="font-medium text-green-700">
                                                        {formatCurrency(menu.costo_total)}
                                                      </p>
                                                      <p className="text-gray-600">
                                                        {menu.kilocalorias_total} kcal
                                                      </p>
                                                    </div>
                                                    
                                                    {/* Menu Components Summary */}
                                                    <div className="space-y-1">
                                                      {menu.componentes
                                                        .filter((comp: any) => comp.componente_tipo === 'FONDO')
                                                        .map((comp: any, idx: number) => (
                                                          <div key={idx} className="text-xs">
                                                            <p className="font-medium text-gray-800">
                                                              {comp.componente_tipo}: {comp.receta_nombre}
                                                            </p>
                                                          </div>
                                                        ))}
                                                      {menu.componentes
                                                        .filter((comp: any) => comp.componente_tipo === 'ENTRADA' || comp.componente_tipo === 'SOPA')
                                                        .slice(0, 1)
                                                        .map((comp: any, idx: number) => (
                                                          <div key={idx} className="text-xs">
                                                            <p className="text-gray-600">
                                                              {comp.componente_tipo}: {comp.receta_nombre}
                                                            </p>
                                                          </div>
                                                        ))}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="text-center py-4">
                                                    <Badge variant="secondary" className="text-xs">
                                                      Vacío
                                                    </Badge>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                      Sin asignar
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
                                )
                              })()}
                            </div>
                          </div>
                          
                          {/* Detailed Menu List (Collapsible) */}
                          <details className="mt-6">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                              Ver detalles completos de menús
                            </summary>
                            <div className="mt-4 space-y-4">
                              {clientData.menus.map((menu: any, menuIndex: number) => (
                                <Card key={menuIndex} className="border-gray-200">
                                  <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <ChefHat className="h-5 w-5 text-green-600" />
                                        {menu.tipo_menu_nombre}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-600">
                                          {formatDate(menu.fecha)}
                                        </span>
                                        <span className="font-medium text-green-700">
                                          {formatCurrency(menu.costo_total)}
                                        </span>
                                      </div>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-600">Fecha</p>
                                        <p className="font-medium">{formatDate(menu.fecha)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Tipo de Menú</p>
                                        <p className="font-medium">{menu.tipo_menu_nombre || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Costo</p>
                                        <p className="font-medium">{formatCurrency(menu.costo_total)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Kilocalorías</p>
                                        <p className="font-medium">{menu.kilocalorias_total || 0} kcal</p>
                                      </div>
                                    </div>
                                    
                                    {/* Menu Components */}
                                    {menu.componentes && menu.componentes.length > 0 && (
                                      <div className="mt-4 pt-4 border-t">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Componentes:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {menu.componentes.map((componente: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                              <span className="text-sm">
                                                {componente.componente_tipo}: {componente.receta_nombre}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <Badge variant={componente.is_unique ? "default" : "secondary"}>
                                                  {componente.is_unique ? "Único" : "Común"}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                  {componente.receta_id}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </details>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No se encontraron menús para este cliente</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No se pudieron cargar los menús del cliente</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchClientMenus(item.shipmentId, item.clientName)}
                        className="mt-2"
                      >
                        Reintentar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )
      })}
    </div>
  )
} 