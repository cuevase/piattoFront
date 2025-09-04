"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Warehouse, Search, Filter, TrendingUp, TrendingDown, Package, MapPin, Loader2, RefreshCw } from "lucide-react"
import { supabaseBrowser } from "@/app/lib/supabase-browser"
import { getCompanyInfo, getCompanyClients, getClientSedes, getGlobalStock, getSedeStock, getIngredientStock, getIngredientSedeStock, StockData, StockResponse } from "@/lib/api"

type ViewMode = 'global' | 'sede' | 'ingredient' | 'ingredient-sede'

export default function InventarioPage() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [clientSedes, setClientSedes] = useState<Record<number, any[]>>({})
  const [ingredients, setIngredients] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('global')
  const [selectedSede, setSelectedSede] = useState<number | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [company, setCompany] = useState<any>(null)

  const supabase = supabaseBrowser()

  useEffect(() => {
    const initializeData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return
      }

      if (user.email) {
        await fetchCompanyInfo(user.email)
      }
    }

    initializeData()
  }, [supabase])

  const fetchCompanyInfo = async (email: string) => {
    try {
      const companyData = await getCompanyInfo()
      
      if (companyData) {
        const empresaInfo = Array.isArray(companyData.empresas) ? companyData.empresas[0] : companyData.empresas
        const companyInfo = {
          empresa_id: companyData.empresa_id,
          user_role: companyData.user_role || 'worker',
          added_at: empresaInfo?.created_at,
          profile_id: companyData.empresa_id,
          name: empresaInfo?.nombre_empresa || 'Tu Empresa'
        }
        
        setCompany(companyInfo)
        
        // Fetch initial data
        await Promise.all([
          fetchClients(),
          fetchIngredients(),
          fetchStockData()
        ])
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const clientsData = await getCompanyClients()
      setClients(clientsData || [])
      
      // Fetch sedes for each client
      const sedesPromises = clientsData.map(async (client) => {
        try {
          const sedes = await getClientSedes(client.id)
          return { clientId: client.id, sedes: sedes || [] }
        } catch (error) {
          console.error(`Error fetching sedes for client ${client.id}:`, error)
          return { clientId: client.id, sedes: [] }
        }
      })
      
      const sedesResults = await Promise.all(sedesPromises)
      const sedesMap = sedesResults.reduce((acc, { clientId, sedes }) => {
        acc[clientId] = sedes
        return acc
      }, {} as Record<number, any[]>)
      
      setClientSedes(sedesMap)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredientes')
        .select('*')
        .order('nombre', { ascending: true })
      
      if (error) throw error
      setIngredients(data || [])
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      setIngredients([])
    }
  }

  const fetchStockData = async () => {
    setLoading(true)
    try {
      let response: StockResponse

      switch (viewMode) {
        case 'global':
          response = await getGlobalStock()
          break
        case 'sede':
          if (!selectedSede) {
            setStockData([])
            return
          }
          response = await getSedeStock(selectedSede)
          break
        case 'ingredient':
          if (!selectedIngredient) {
            setStockData([])
            return
          }
          response = await getIngredientStock(selectedIngredient)
          break
        case 'ingredient-sede':
          if (!selectedSede || !selectedIngredient) {
            setStockData([])
            return
          }
          response = await getIngredientSedeStock(selectedSede, selectedIngredient)
          break
        default:
          response = await getGlobalStock()
      }

      setStockData(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching stock data:', error)
      setStockData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (company) {
      fetchStockData()
    }
  }, [viewMode, selectedSede, selectedIngredient, company])

  const getSedeName = (sedeId: number) => {
    for (const clientSedesList of Object.values(clientSedes)) {
      const sede = clientSedesList.find(s => s.id === sedeId)
      if (sede) return sede.nombre
    }
    return `Sede ${sedeId}`
  }

  const getIngredientName = (ingredienteId: string) => {
    const ingredient = ingredients.find(ing => ing.id === ingredienteId || ing.codigo === ingredienteId)
    return ingredient ? ingredient.nombre : `Ingrediente ${ingredienteId}`
  }

  const getClientName = (sedeId: number) => {
    for (const [clientId, clientSedesList] of Object.entries(clientSedes)) {
      const sede = clientSedesList.find(s => s.id === sedeId)
      if (sede) {
        const client = clients.find(c => c.id === parseInt(clientId))
        return client ? client.nombre : `Cliente ${clientId}`
      }
    }
    return 'Cliente Desconocido'
  }

  const filteredStockData = (stockData || []).filter(item => {
    if (!searchTerm) return true
    
    const sedeName = getSedeName(item.sede_id).toLowerCase()
    const ingredientName = getIngredientName(item.ingrediente_id).toLowerCase()
    const clientName = getClientName(item.sede_id).toLowerCase()
    
    return sedeName.includes(searchTerm.toLowerCase()) ||
           ingredientName.includes(searchTerm.toLowerCase()) ||
           clientName.includes(searchTerm.toLowerCase())
  })

  const getStockStatus = (invFinal: number) => {
    if (invFinal <= 0) return { status: 'out', color: 'bg-red-100 text-red-800', icon: TrendingDown }
    if (invFinal < 10) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown }
    return { status: 'ok', color: 'bg-green-100 text-green-800', icon: TrendingUp }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Inventario</h2>
          <p className="text-purple-600">Gestiona el stock de ingredientes por sede</p>
        </div>
        <Button
          onClick={fetchStockData}
          disabled={loading}
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Mode Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant={viewMode === 'global' ? 'default' : 'outline'}
              onClick={() => setViewMode('global')}
              className={viewMode === 'global' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
            >
              <Warehouse className="w-4 h-4 mr-2" />
              Global
            </Button>
            <Button
              variant={viewMode === 'sede' ? 'default' : 'outline'}
              onClick={() => setViewMode('sede')}
              className={viewMode === 'sede' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Por Sede
            </Button>
            <Button
              variant={viewMode === 'ingredient' ? 'default' : 'outline'}
              onClick={() => setViewMode('ingredient')}
              className={viewMode === 'ingredient' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
            >
              <Package className="w-4 h-4 mr-2" />
              Por Ingrediente
            </Button>
            <Button
              variant={viewMode === 'ingredient-sede' ? 'default' : 'outline'}
              onClick={() => setViewMode('ingredient-sede')}
              className={viewMode === 'ingredient-sede' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
            >
              <Package className="w-4 h-4 mr-2" />
              Ingrediente + Sede
            </Button>
          </div>

          {/* Specific Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sede Filter */}
            {(viewMode === 'sede' || viewMode === 'ingredient-sede') && (
              <div className="space-y-2">
                <Label htmlFor="sede-select" className="text-purple-700">Sede</Label>
                <select
                  id="sede-select"
                  value={selectedSede || ''}
                  onChange={(e) => setSelectedSede(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Seleccionar sede...</option>
                  {Object.values(clientSedes).flat().map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ingredient Filter */}
            {(viewMode === 'ingredient' || viewMode === 'ingredient-sede') && (
              <div className="space-y-2">
                <Label htmlFor="ingredient-select" className="text-purple-700">Ingrediente</Label>
                <select
                  id="ingredient-select"
                  value={selectedIngredient || ''}
                  onChange={(e) => setSelectedIngredient(e.target.value || null)}
                  className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Seleccionar ingrediente...</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Filter */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-purple-700">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por sede, ingrediente o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Data */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <div className="text-purple-600">Cargando inventario...</div>
          </div>
        </div>
      ) : filteredStockData.length === 0 ? (
        <Card className="border-purple-200">
          <CardContent className="p-12 text-center">
            <Warehouse className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-purple-800 mb-2">No hay datos de inventario</h3>
            <p className="text-purple-600">No se encontraron registros de stock para los filtros seleccionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">Total Registros</h4>
                    <p className="text-xl font-bold text-purple-600">{filteredStockData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">Stock OK</h4>
                    <p className="text-xl font-bold text-green-600">
                      {filteredStockData.filter(item => getStockStatus(item.inv_final).status === 'ok').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">Stock Bajo</h4>
                    <p className="text-xl font-bold text-yellow-600">
                      {filteredStockData.filter(item => getStockStatus(item.inv_final).status === 'low').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">Sin Stock</h4>
                    <p className="text-xl font-bold text-red-600">
                      {filteredStockData.filter(item => getStockStatus(item.inv_final).status === 'out').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Table */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">Detalle de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left p-3 text-purple-700 font-semibold">Sede</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Cliente</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Ingrediente</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Inv. Inicial</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Ingreso</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Prod. Real</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Venta Carta</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Inv. Final</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Estado</th>
                      <th className="text-left p-3 text-purple-700 font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockData.map((item) => {
                      const stockStatus = getStockStatus(item.inv_final)
                      const StatusIcon = stockStatus.icon
                      
                      return (
                        <tr key={item.id} className="border-b border-purple-100 hover:bg-purple-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{getSedeName(item.sede_id)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {getClientName(item.sede_id)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{getIngredientName(item.ingrediente_id)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{item.inv_inicial || 0}</td>
                          <td className="p-3 text-sm text-green-600">+{item.ingreso || 0}</td>
                          <td className="p-3 text-sm">
                            {item.produccion_re !== null && item.produccion_re !== undefined 
                              ? (item.produccion_re > 0 ? `+${item.produccion_re}` : item.produccion_re)
                              : '-'}
                          </td>
                          <td className="p-3 text-sm text-red-600">-{item.venta_carta || 0}</td>
                          <td className="p-3">
                            <span className="font-semibold">{item.inv_final || 0}</span>
                          </td>
                          <td className="p-3">
                            <Badge className={stockStatus.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {stockStatus.status === 'out' ? 'Sin Stock' : 
                               stockStatus.status === 'low' ? 'Bajo' : 'OK'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {new Date(item.fecha).toLocaleDateString('es-ES')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
