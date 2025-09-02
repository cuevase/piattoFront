"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar, BarChart3, PieChart, Activity, Download, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { ShipmentAnalytics } from '@/types/shipment'
import { supabaseBrowser } from '@/app/lib/supabase-browser'
import { getCompanyInfo, apiGet } from '@/lib/api'

export default function ShipmentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ShipmentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30)
  
  const router = useRouter()
  const supabase = supabaseBrowser()

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

  // Fetch analytics when empresaId or period changes
  useEffect(() => {
    if (empresaId) {
      fetchAnalytics()
    }
  }, [empresaId, selectedPeriod])

  const fetchAnalytics = async () => {
    if (!empresaId) return

    setLoading(true)
    setError(null)

    try {
      const data = await apiGet(`/shipments/analytics/${empresaId}?days=${selectedPeriod}`)
      setAnalytics(data)
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PE').format(num)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusPercentage = (status: string) => {
    if (!analytics) return 0
    const total = analytics.analytics.total_shipments
    const count = analytics.analytics.status_breakdown[status] || 0
    return total > 0 ? (count / total) * 100 : 0
  }

  const getPeriodLabel = (days: number) => {
    switch (days) {
      case 7:
        return 'Últimos 7 días'
      case 30:
        return 'Últimos 30 días'
      case 90:
        return 'Últimos 90 días'
      default:
        return `Últimos ${days} días`
    }
  }

  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0) return null
    const growth = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(growth),
      positive: growth > 0,
      formatted: `${growth > 0 ? '+' : '-'}${Math.abs(growth).toFixed(1)}%`
    }
  }

  // Mock data for demonstration (in real app, this would come from backend)
  const mockTrendData = {
    revenue: [
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 0 },
      { date: '2024-01-03', value: 0 },
      { date: '2024-01-04', value: 0 },
      { date: '2024-01-05', value: 0 },
      { date: '2024-01-06', value: 0 },
      { date: '2024-01-07', value: 0 },
    ],
    previousRevenue: 0
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando analíticas...</p>
        </div>
      </div>
    )
  }

  if (error) {
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar analíticas</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={fetchAnalytics}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Reintentar
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
            onClick={() => router.push('/dashboard/shipments')}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-purple-900">Analíticas de Envíos</h1>
            <p className="text-gray-600">{getPeriodLabel(selectedPeriod)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="border border-purple-200 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <Button
            onClick={fetchAnalytics}
            disabled={loading}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => {
              // Export functionality would go here
              console.log('Exporting analytics...')
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Envíos</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatNumber(analytics?.analytics.total_shipments || 0)}
                </p>
                {/* Mock growth indicator */}
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+12.3%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(analytics?.analytics.total_cost || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+8.7%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Costo Promedio por Envío</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(analytics?.analytics.avg_cost_per_shipment || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Costo Promedio por Menú</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatCurrency(analytics?.analytics.avg_cost_per_menu || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+3.2%</span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics?.analytics.status_breakdown || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                    <StatusBadge status={status as any} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count} envíos</span>
                    <span className="text-sm font-medium">{getStatusPercentage(status).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Simple visual representation */}
            <div className="mt-6 space-y-2">
              {Object.entries(analytics?.analytics.status_breakdown || {}).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">{status}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${getStatusPercentage(status)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 w-12">{getStatusPercentage(status).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend (Mock Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-900">
                  {formatCurrency(mockTrendData.revenue.reduce((sum, item) => sum + item.value, 0))}
                </p>
                <p className="text-sm text-gray-600">Total del período</p>
              </div>
              
              {/* Simple bar chart representation */}
              <div className="space-y-2">
                {mockTrendData.revenue.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">
                      {new Date(item.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-600"
                        style={{ width: `${(item.value / Math.max(...mockTrendData.revenue.map(r => r.value))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 w-16">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumen de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-green-50 rounded-lg mb-3">
                <div className="text-2xl font-bold text-green-900">
                  {((analytics?.analytics.status_breakdown.delivered || 0) / (analytics?.analytics.total_shipments || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-green-700">Tasa de Entrega</div>
              </div>
              <p className="text-xs text-gray-600">Envíos entregados exitosamente</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-3">
                <div className="text-2xl font-bold text-blue-900">
                  {analytics?.analytics.total_menus || 0}
                </div>
                <div className="text-sm text-blue-700">Total de Menús</div>
              </div>
              <p className="text-xs text-gray-600">Menús procesados en el período</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-50 rounded-lg mb-3">
                <div className="text-2xl font-bold text-purple-900">
                  {analytics?.analytics.total_shipments && analytics?.analytics.total_shipments > 0 ? 
                    (analytics.analytics.total_menus / analytics.analytics.total_shipments).toFixed(1) : 
                    '0'
                  }
                </div>
                <div className="text-sm text-purple-700">Menús por Envío</div>
              </div>
              <p className="text-xs text-gray-600">Promedio de menús por envío</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => router.push('/dashboard/shipments')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Todos los Envíos
            </Button>
            <Button
              onClick={() => router.push('/dashboard/menus')}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Generar Nuevo Plan
            </Button>
            <Button
              onClick={() => {
                // Export detailed report
                console.log('Exporting detailed report...')
              }}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Reporte Detallado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 