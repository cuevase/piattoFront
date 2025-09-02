"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Loader2, Package, CheckCircle, XCircle } from 'lucide-react'
import { ShipmentCreateRequest, ShipmentCreateResponse, WeeklyPlanResult } from '@/types/shipment'
import { apiPost } from '@/lib/api'

interface CreateShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  weeklyPlanData: WeeklyPlanResult
  empresaId: string
  onSuccess: (shipmentId: string) => void
}

export function CreateShipmentModal({ 
  isOpen, 
  onClose, 
  weeklyPlanData, 
  empresaId,
  onSuccess 
}: CreateShipmentModalProps) {
  const [shipmentDate, setShipmentDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ShipmentCreateResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const requestData: ShipmentCreateRequest = {
        weekly_plan_data: weeklyPlanData,
        shipment_date: shipmentDate,
        empresa_id: empresaId,
        notes: notes.trim() || undefined
      }

      const result: ShipmentCreateResponse = await apiPost('/shipments/create', requestData)
      setSuccess(result)
      
      // Show success for 2 seconds, then redirect
      setTimeout(() => {
        onSuccess(result.shipment_id)
        onClose()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getWeekRange = () => {
    if (!weeklyPlanData.plan.length) return ''
    
    const dates = weeklyPlanData.plan.flatMap(client => 
      client.menus.map(menu => menu.fecha)
    ).sort()
    
    if (dates.length === 0) return ''
    
    const startDate = new Date(dates[0])
    const endDate = new Date(dates[dates.length - 1])
    
    return `${startDate.toLocaleDateString('es-PE')} - ${endDate.toLocaleDateString('es-PE')}`
  }

  const getTotalCost = () => {
    return weeklyPlanData.plan.reduce((total, client) => 
      total + client.menus.reduce((clientTotal, menu) => 
        clientTotal + menu.costo_total, 0), 0)
  }

  const getTotalMenus = () => {
    return weeklyPlanData.plan.reduce((total, client) => 
      total + client.menus.length, 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Crear Envío
          </CardTitle>
          <CardDescription>
            Convierte el plan semanal en un envío rastreable
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-green-700">¡Envío creado exitosamente!</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">ID del envío: <span className="font-mono font-medium">{success.shipment_id}</span></p>
                <p className="text-sm text-gray-600">{success.message}</p>
                <div className="flex justify-center gap-4 text-sm">
                  <Badge variant="outline">
                    {success.summary.total_menus} menús
                  </Badge>
                  <Badge variant="outline">
                    {success.summary.clients.length} clientes
                  </Badge>
                  <Badge variant="outline">
                    {formatCurrency(success.summary.total_cost)}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500">Redirigiendo a detalles del envío...</p>
            </div>
          ) : (
            <>
              {/* Plan Summary */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Resumen del Plan</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Período</p>
                    <p className="font-medium">{getWeekRange()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Menús</p>
                    <p className="font-medium">{getTotalMenus()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Costo Total</p>
                    <p className="font-medium">{formatCurrency(getTotalCost())}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600 text-sm">Clientes</p>
                  <p className="font-medium">{weeklyPlanData.plan.length} clientes</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="shipmentDate">Fecha de Envío</Label>
                  <Input
                    id="shipmentDate"
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    required
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añade notas sobre este envío..."
                    className="w-full border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Crear Envío
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 