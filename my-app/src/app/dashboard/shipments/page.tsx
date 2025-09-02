"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Calendar, Users, Package, DollarSign, Search, Filter, Eye, Edit, ChevronLeft, ChevronRight, Truck, TrendingUp, FileText, Loader2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react'
import { ShipmentSummary, ShipmentFilters } from '@/types/shipment'
import { supabaseBrowser } from '@/app/lib/supabase-browser'
import { getCompanyInfo, apiGet, apiDelete } from '@/lib/api'

export default function ShipmentDashboard() {
  const [shipments, setShipments] = useState<ShipmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalShipments, setTotalShipments] = useState(0)
  const [filters, setFilters] = useState<ShipmentFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  
  const router = useRouter()
  const supabase = supabaseBrowser()
  const itemsPerPage = 10

  // Fetch user's empresa_id on mount
  useEffect(() => {
    const fetchEmpresaId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) return

        const companyData = await getCompanyInfo()
        if (companyData?.empresa_id) {
          setEmpresaId(companyData.empresa_id)
        }
      } catch (err) {
        console.error('Error fetching empresa_id:', err)
      }
    }

    fetchEmpresaId()
  }, [supabase])

  // Fetch shipments when empresaId or filters change
  useEffect(() => {
    if (empresaId) {
      fetchShipments()
    }
  }, [empresaId, currentPage, filters])

  const fetchShipments = async () => {
    if (!empresaId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        empresa_id: empresaId,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      })

      // Add filters to params
      if (filters.status) {
        params.append('status', filters.status)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.dateRange?.start) {
        params.append('date_start', filters.dateRange.start)
      }
      if (filters.dateRange?.end) {
        params.append('date_end', filters.dateRange.end)
      }

      const data = await apiGet(`/shipments?${params}`)
      setShipments(data.shipments || [])
      setTotalShipments(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteShipment = async (shipmentId: string) => {
    return await apiDelete(`/shipments/${shipmentId}`)
  }

  const handleDeleteShipment = async (shipmentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este envío? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true)
        const result = await deleteShipment(shipmentId)
        alert(`Envío eliminado: ${result.deleted_shipment.total_menus} menús, ${result.deleted_shipment.client_count} clientes`)
        // Refresh the shipments list
        await fetchShipments()
      } catch (error) {
        alert('Error al eliminar el envío')
        console.error('Delete error:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getWeekRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}`
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status
    }))
    setCurrentPage(1)
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined
    }))
    setCurrentPage(1)
  }

  const handleDateRangeChange = (start: string, end: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: start && end ? { start, end } : undefined
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const getStatusCount = (status: string) => {
    return shipments.filter(s => s.status === status).length
  }

  const getTotalCost = () => {
    return shipments.reduce((sum, s) => sum + s.total_cost, 0)
  }

  const getAverageCost = () => {
    return shipments.length > 0 ? getTotalCost() / shipments.length : 0
  }

  if (loading && !shipments.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando consolidaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Gestión de Consolidación de Insumos</h1>
          <p className="text-gray-600">Administra y rastrea todas las consolidaciones de insumos</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/dashboard/shipments/analytics')}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analíticas
          </Button>
          <Button
            onClick={() => router.push('/dashboard/menus')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Crear Nuevo Envío
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Envíos</p>
                <p className="text-xl font-bold text-purple-900">{totalShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(getTotalCost())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entregados</p>
                <p className="text-xl font-bold text-blue-900">{getStatusCount('delivered')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-xl font-bold text-amber-900">{getStatusCount('pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="ID o notas..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={filters.status || 'all'}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="dateStart">Fecha Inicio</Label>
                <Input
                  id="dateStart"
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange(e.target.value, filters.dateRange?.end || '')}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label htmlFor="dateEnd">Fecha Fin</Label>
                <Input
                  id="dateEnd"
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange(filters.dateRange?.start || '', e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Limpiar Filtros
              </Button>
              <Button
                onClick={fetchShipments}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Envíos</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          
          {shipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No hay envíos</p>
              <p className="text-sm">Crea tu primer envío desde la generación de planes semanales</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile/Tablet View */}
              <div className="md:hidden space-y-4">
                {shipments.map((shipment) => (
                  <Card key={shipment.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900 font-mono text-sm">{shipment.id}</p>
                          <p className="text-sm text-gray-600">{formatDate(shipment.shipment_date)}</p>
                        </div>
                        <StatusBadge status={shipment.status} size="sm" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Semana</p>
                          <p className="font-medium">{getWeekRange(shipment.week_start_date, shipment.week_end_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Clientes</p>
                          <p className="font-medium">{shipment.client_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Menús</p>
                          <p className="font-medium">{shipment.total_menus}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Costo</p>
                          <p className="font-medium">{formatCurrency(shipment.total_cost)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/shipments/${shipment.id}`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteShipment(shipment.id)}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Semana</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Clientes</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Menús</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Costo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((shipment) => (
                        <tr key={shipment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">{shipment.id}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(shipment.shipment_date)}</td>
                          <td className="py-3 px-4 text-sm">{getWeekRange(shipment.week_start_date, shipment.week_end_date)}</td>
                          <td className="py-3 px-4 text-sm">{shipment.client_count}</td>
                          <td className="py-3 px-4 text-sm">{shipment.total_menus}</td>
                          <td className="py-3 px-4 text-sm font-medium">{formatCurrency(shipment.total_cost)}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={shipment.status} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => router.push(`/dashboard/shipments/${shipment.id}`)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeleteShipment(shipment.id)}
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalShipments)} de {totalShipments} envíos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 