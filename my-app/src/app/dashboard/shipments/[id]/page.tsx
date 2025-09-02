"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { ArrowLeft, Package, Users, Calendar, DollarSign, FileText, Edit, CheckCircle, X, Loader2, AlertCircle, ChevronDown, ChevronUp, Search, Download, Clock, MapPin, Trash2, ShoppingCart, Truck } from 'lucide-react'
import { ShipmentDetail, ShipmentStatusUpdate } from '@/types/shipment'
import { supabaseBrowser } from '@/app/lib/supabase-browser'

export default function ShipmentDetailPage() {
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost'>('cost')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Purchase presentations state
  const [purchasePresentations, setPurchasePresentations] = useState<any>(null)
  const [loadingPresentations, setLoadingPresentations] = useState(false)
  const [showPresentations, setShowPresentations] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const supabase = supabaseBrowser()
  const shipmentId = params.id as string
  

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetails()
    }
  }, [shipmentId])

  const fetchShipmentDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      if (!backendUrl) {
        throw new Error('Backend URL not configured')
      }

      const response = await fetch(`${backendUrl}/shipments/${shipmentId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch shipment details')
      }

      const data = await response.json()
      setShipment(data)
      setNotes(data.shipment.notes || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchasePresentations = async () => {
    setLoadingPresentations(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      if (!backendUrl) {
        throw new Error('Backend URL not configured')
      }

      const response = await fetch(`${backendUrl}/shipments/${shipmentId}/purchase-presentations`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch purchase presentations')
      }

      const data = await response.json()
      setPurchasePresentations(data)
    } catch (err) {
      console.error('Error fetching purchase presentations:', err)
      setPurchasePresentations(null)
    } finally {
      setLoadingPresentations(false)
    }
  }

  const updateShipmentStatus = async (newStatus: string, statusNotes?: string) => {
    if (!shipment) return

    setUpdating(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      if (!backendUrl) {
        throw new Error('Backend URL not configured')
      }

      const updateData: ShipmentStatusUpdate = {
        status: newStatus as any,
        notes: statusNotes
      }

      const response = await fetch(`${backendUrl}/shipments/${shipmentId}/status`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Failed to update shipment status')
      }

      // Refresh the shipment details
      await fetchShipmentDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdating(false)
    }
  }

  const deleteShipment = async (shipmentId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      throw new Error('Backend URL not configured')
    }

    const response = await fetch(`${backendUrl}/shipments/${shipmentId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete shipment')
    }
    
    return response.json()
  }

  const handleDeleteShipment = async (shipmentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este envío? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true)
        const result = await deleteShipment(shipmentId)
        alert(`Envío eliminado: ${result.deleted_shipment.total_menus} menús, ${result.deleted_shipment.client_count} clientes`)
        // Redirect to shipments dashboard
        router.push('/dashboard/shipments')
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
      month: 'long',
      day: 'numeric'
    })
  }

  const getWeekRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('es-PE', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('es-PE', { month: 'long', day: 'numeric', year: 'numeric' })}`
  }

  const toggleClientExpansion = (clientId: number) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const getFilteredAndSortedIngredients = () => {
    if (!shipment) return []

    let filtered = shipment.ingredients_summary

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ingredient =>
        ingredient.nombre_ingrediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.codigo_ingrediente.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'name':
          aValue = a.nombre_ingrediente
          bValue = b.nombre_ingrediente
          break
        case 'quantity':
          aValue = a.cantidad_total
          bValue = b.cantidad_total
          break
        case 'cost':
          aValue = a.costo_total
          bValue = b.costo_total
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const getStatusWorkflow = () => {
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered']
    const currentIndex = statuses.indexOf(shipment?.shipment.status || 'pending')
    return statuses.map((status, index) => ({
      status,
      active: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  const getNextStatus = () => {
    const workflow = ['pending', 'confirmed', 'shipped', 'delivered']
    const currentIndex = workflow.indexOf(shipment?.shipment.status || 'pending')
    return currentIndex < workflow.length - 1 ? workflow[currentIndex + 1] : null
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles del envío...</p>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar envío</h2>
            <p className="text-gray-600 mb-4">{error || 'Envío no encontrado'}</p>
            <Button
              onClick={() => router.push('/dashboard/shipments')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Ir a Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-purple-900">Envío #{shipment.shipment.id}</h1>
            <p className="text-gray-600">{formatDate(shipment.shipment.shipment_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={shipment.shipment.status} size="lg" />
          {shipment.shipment.status !== 'delivered' && shipment.shipment.status !== 'cancelled' && (
            <Button
              onClick={() => {
                const nextStatus = getNextStatus()
                if (nextStatus) {
                  updateShipmentStatus(nextStatus)
                }
              }}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como {getStatusLabel(getNextStatus() || '')}
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => handleDeleteShipment(shipment.shipment.id)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Envío
          </Button>
        </div>
      </div>

      {/* Status Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Estado del Envío
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200"></div>
            {getStatusWorkflow().map((item, index) => (
              <div key={item.status} className="relative flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  item.active 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {item.active ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Clock className="h-6 w-6" />
                  )}
                </div>
                <p className={`mt-2 text-sm font-medium ${
                  item.active ? 'text-purple-900' : 'text-gray-500'
                }`}>
                  {getStatusLabel(item.status)}
                </p>
                {item.current && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Resumen del Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha de Envío</p>
                <p className="font-medium">{formatDate(shipment.shipment.shipment_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Semana</p>
                <p className="font-medium">{getWeekRange(shipment.shipment.week_start_date, shipment.shipment.week_end_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Menús</p>
                <p className="font-medium">{shipment.shipment.total_menus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clientes</p>
                <p className="font-medium">{shipment.shipment.client_count}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(shipment.shipment.total_cost)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shipment.clients.map((client) => (
                <div key={client.cliente_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">{client.client_name}</p>
                    <p className="text-sm text-gray-600">{client.total_menus} menús</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(client.total_cost)}</p>
                    <p className="text-sm text-gray-600">{client.total_kcal} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none resize-none"
                  rows={4}
                  placeholder="Añade notas sobre este envío..."
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Here you would typically save the notes
                      setEditingNotes(false)
                    }}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Guardar
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingNotes(false)
                      setNotes(shipment.shipment.notes || '')
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-3">{shipment.shipment.notes || 'Sin notas'}</p>
                <Button
                  onClick={() => setEditingNotes(true)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Notas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipment.clients.map((client) => (
              <div key={client.cliente_id} className="border rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => toggleClientExpansion(client.cliente_id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.client_name}</h3>
                      <p className="text-sm text-gray-600">
                        {client.total_menus} menús • {formatCurrency(client.total_cost)} • {client.total_kcal} kcal
                      </p>
                    </div>
                  </div>
                  {expandedClients.has(client.cliente_id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                {expandedClients.has(client.cliente_id) && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {client.menus.map((menu, index) => (
                        <Card key={index} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-sm">{formatDate(menu.fecha)}</p>
                                <StatusBadge status="pending" size="sm" />
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>{formatCurrency(menu.costo_total)}</p>
                                <p>{menu.kilocalorias_total} kcal</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                <p>{menu.components.length} componentes</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumen de Ingredientes</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Export functionality would go here
                console.log('Exporting ingredients...')
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="ingredient-search">Buscar Ingredientes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="ingredient-search"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label>Ordenar por</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'cost')}
                  className="block w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  <option value="cost">Costo</option>
                  <option value="name">Nombre</option>
                  <option value="quantity">Cantidad</option>
                </select>
              </div>
              <div>
                <Label>Orden</Label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="block w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Ingrediente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Cantidad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Unidad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Costo</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedIngredients().map((ingredient) => (
                  <tr key={ingredient.codigo_ingrediente} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{ingredient.codigo_ingrediente}</td>
                    <td className="py-3 px-4 font-medium">{ingredient.nombre_ingrediente}</td>
                    <td className="py-3 px-4 text-sm">{ingredient.cantidad_total.toFixed(3)}</td>
                    <td className="py-3 px-4 text-sm">{ingredient.unidad}</td>
                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(ingredient.costo_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {getFilteredAndSortedIngredients().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron ingredientes que coincidan con la búsqueda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Presentations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Órdenes de Compra por Proveedor
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!purchasePresentations) {
                  fetchPurchasePresentations()
                }
                setShowPresentations(!showPresentations)
              }}
              disabled={loadingPresentations}
            >
              {loadingPresentations ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              {showPresentations ? 'Ocultar' : 'Ver'} Órdenes
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showPresentations && (
            <div className="space-y-6">
              {loadingPresentations ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                  <p className="text-gray-600">Cargando órdenes de compra...</p>
                </div>
              ) : purchasePresentations ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Proveedores</p>
                            <p className="text-2xl font-bold text-green-700">{purchasePresentations.summary.total_suppliers}</p>
                          </div>
                          <Truck className="h-6 w-6 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Ingredientes</p>
                            <p className="text-2xl font-bold text-blue-700">{purchasePresentations.summary.total_ingredients}</p>
                          </div>
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Presentaciones</p>
                            <p className="text-2xl font-bold text-purple-700">{purchasePresentations.summary.total_presentations}</p>
                          </div>
                          <ShoppingCart className="h-6 w-6 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Costo Total</p>
                            <p className="text-2xl font-bold text-orange-700">{formatCurrency(purchasePresentations.summary.total_cost)}</p>
                          </div>
                          <DollarSign className="h-6 w-6 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Suppliers List */}
                  <div className="space-y-4">
                    {purchasePresentations.suppliers.map((supplier: any, index: number) => (
                      <Card key={index} className="border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-purple-600" />
                              {supplier.proveedor || 'Proveedor sin nombre'}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                {supplier.total_presentations} presentaciones
                              </span>
                              <span className="font-medium text-purple-700">
                                {formatCurrency(supplier.total_cost)}
                              </span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Código</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Ingrediente</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Cantidad Req.</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Presentación</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Cantidad a Comprar</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Precio</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Costo</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">Desperdicio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {supplier.ingredients.map((ingredient: any, idx: number) => (
                                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-mono text-sm">{ingredient.codigo_ingrediente}</td>
                                    <td className="py-2 px-3 font-medium">{ingredient.nombre_ingrediente}</td>
                                    <td className="py-2 px-3 text-sm">
                                      {ingredient.required_quantity} {ingredient.unidad}
                                    </td>
                                    <td className="py-2 px-3 text-sm">
                                      {ingredient.presentacion_de_compra} ({ingredient.presentacion_unidad_medida} {ingredient.unidad})
                                    </td>
                                    <td className="py-2 px-3 text-sm font-medium">
                                      {ingredient.presentations_needed} {ingredient.presentacion_de_compra}
                                    </td>
                                    <td className="py-2 px-3 text-sm">
                                      {formatCurrency(ingredient.precio_de_compra)}
                                    </td>
                                    <td className="py-2 px-3 text-sm font-medium text-purple-700">
                                      {formatCurrency(ingredient.presentation_cost)}
                                    </td>
                                    <td className="py-2 px-3 text-sm">
                                      <div className="flex flex-col">
                                        <span className="text-red-600">
                                          {ingredient.waste_quantity} {ingredient.unidad}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          ({ingredient.waste_percentage}%)
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se pudieron cargar las órdenes de compra</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPurchasePresentations}
                    className="mt-2"
                  >
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 