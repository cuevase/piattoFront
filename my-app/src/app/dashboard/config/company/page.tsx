"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, DollarSign, Hash, Calendar, Search, Loader2, Building, Users, Settings, Save, ChefHat, Zap, ChevronDown, ChevronUp, Edit2, Check, X } from "lucide-react"
import { supabaseBrowser } from "@/app/lib/supabase-browser"
import { getCompanyWorkers, getCompanyInfo, getCompanyIngredients, getCompanyRecipesWithIngredientsFromSupabase } from "@/lib/api"

interface Ingrediente {
  codigo_ingrediente: string
  nombre_ingrediente: string
  unidad: string
  cantidad_usada: number
  costo_por_unidad: number
  costo_total: number
  kilocalorias_total: number
  categoría: string
}

interface Receta {
  codigo_receta: string
  nombre_receta: string
  ingredientes: Ingrediente[]
  costo_total_receta: number
}

interface Worker {
  id: string
  full_name: string
  avatar_url: string
  updated_at: string
  email: string
}

export default function CompanyConfigPage() {
  const [activeTab, setActiveTab] = useState("ingredients")
  const [ingredientes, setIngredientes] = useState<any[]>([])
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("")
  const [ingredientsLoading, setIngredientsLoading] = useState(true)
  const [ingredientsError, setIngredientsError] = useState<string | null>(null)
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [recipesError, setRecipesError] = useState<string | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [companyLoading, setCompanyLoading] = useState(true)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set())
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<string>("")
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workersLoading, setWorkersLoading] = useState(true)
  const [workersError, setWorkersError] = useState<string | null>(null)
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
        await fetchCompanyInfo(user.email)
      }
    }

    initializeData()
  }, [router, supabase])

  const fetchCompanyInfo = async (email: string) => {
    try {
      setCompanyLoading(true)
      setCompanyError(null)
      
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
        
        // Fetch ingredients, recipes, and workers using direct Supabase queries
        await fetchIngredientes()
        await fetchRecetas()
        await fetchWorkers()
      } else {
        setCompanyError('No se encontró información de la empresa')
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
      setCompanyError('Error al obtener información de la empresa.')
    } finally {
      setCompanyLoading(false)
    }
  }

  const fetchIngredientes = async () => {
    try {
      setIngredientsLoading(true)
      setIngredientsError(null)
      
      console.log('🔍 DEBUG: Fetching ingredients using direct Supabase query')
      
      const ingredientsData = await getCompanyIngredients()
      console.log('🔍 DEBUG: Ingredients data received:', ingredientsData)
      setIngredientes(ingredientsData || [])
      
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching ingredients:', error)
      setIngredientsError(error instanceof Error ? error.message : 'Error al cargar los ingredientes')
      setIngredientes([])
    } finally {
      setIngredientsLoading(false)
    }
  }

  const fetchRecetas = async () => {
    try {
      setRecipesLoading(true)
      setRecipesError(null)
      
      console.log('🔍 DEBUG: Fetching recipes with ingredients using direct Supabase approach')
      
      const recipesData = await getCompanyRecipesWithIngredientsFromSupabase()
      console.log('🔍 DEBUG: Recipes data received:', recipesData)
      setRecetas(recipesData || [])
      
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching recipes:', error)
      setRecipesError(error instanceof Error ? error.message : 'Error al cargar las recetas')
      setRecetas([])
    } finally {
      setRecipesLoading(false)
    }
  }

  const fetchWorkers = async () => {
    setWorkersLoading(true)
    setWorkersError(null)
    
    try {
      console.log('🔍 DEBUG: Fetching workers using direct Supabase query')

      const workersData = await getCompanyWorkers()
      console.log('🔍 DEBUG: Workers data received:', workersData)
      
      setWorkers(workersData || [])
      
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching workers:', error)
      setWorkersError(error instanceof Error ? error.message : 'Error al cargar los trabajadores')
      setWorkers([])
    } finally {
      setWorkersLoading(false)
    }
  }

  const filteredIngredientes = (ingredientes || []).filter(
    (ingrediente) =>
      ingrediente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingrediente.codigo?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredRecetas = (recetas || []).filter(
    (receta) =>
      receta.nombre_receta?.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
      receta.codigo_receta?.toLowerCase().includes(recipeSearchTerm.toLowerCase()),
  )

  const totalIngredientes = ingredientes?.length || 0
  const averageCost = ingredientes && ingredientes.length > 0 ? ingredientes.reduce((sum, ing) => sum + (ing.costo_por_unidad || 0), 0) / totalIngredientes : 0
  const totalValue = (ingredientes || []).reduce((sum, ing) => sum + (ing.costo_por_unidad || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCategoryFromCode = (codigo: string) => {
    if (!codigo) return { name: "Otros", color: "bg-gray-100 text-gray-800" }
    
    const prefix = codigo.substring(0, 3)
    const categories: { [key: string]: { name: string; color: string } } = {
      FRU: { name: "Frutas", color: "bg-green-100 text-green-800" },
      ABA: { name: "Abarrotes", color: "bg-blue-100 text-blue-800" },
      VER: { name: "Verduras", color: "bg-emerald-100 text-emerald-800" },
      CAR: { name: "Carnes", color: "bg-red-100 text-red-800" },
      PPE: { name: "Preparados", color: "bg-orange-100 text-orange-800" },
    }
    return categories[prefix] || { name: "Otros", color: "bg-gray-100 text-gray-800" }
  }

  const getCategoryColor = (categoria: string) => {
    const colors: { [key: string]: string } = {
      FONDO: "bg-purple-100 text-purple-800",
      BASE: "bg-blue-100 text-blue-800",
      PROTEINA: "bg-red-100 text-red-800",
      VEGETAL: "bg-green-100 text-green-800",
      CONDIMENTO: "bg-yellow-100 text-yellow-800",
      LACTEO: "bg-indigo-100 text-indigo-800",
    }
    return colors[categoria] || "bg-gray-100 text-gray-800"
  }

  const handleRefresh = () => {
    fetchIngredientes()
  }

  const updateIngredientPrice = async (codigo: string, newCost: number) => {
    try {
      setUpdatingPrice(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      
      if (!backendUrl) {
        throw new Error('Backend URL not configured')
      }

      // Get current user for modified_by field
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('User not authenticated')
      }

      console.log('🔍 DEBUG: Updating ingredient price:', codigo, 'New cost:', newCost)
      
      const response = await fetch(`${backendUrl}/ingredientes/${encodeURIComponent(codigo)}/precio`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          costo_por_unidad: newCost,
          modified_by: user.email
        })
      })

      console.log('🔍 DEBUG: Update response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('🔍 DEBUG: Update error response:', errorText)
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      let updatedIngredient
      if (contentType && contentType.includes('application/json')) {
        updatedIngredient = await response.json()
      } else {
        throw new Error('API returned non-JSON response')
      }

      console.log('🔍 DEBUG: Updated ingredient:', updatedIngredient)
      
      // Update the ingredient in the local state
      setIngredientes(prev => prev.map(ing => 
        ing.codigo === codigo 
          ? { ...ing, costo_por_unidad: newCost, modified_at: new Date().toISOString() }
          : ing
      ))

      // Reset editing state
      setEditingIngredient(null)
      setNewPrice("")
      
      return updatedIngredient
    } catch (error) {
      console.error('🔍 DEBUG: Error updating ingredient price:', error)
      throw error
    } finally {
      setUpdatingPrice(false)
    }
  }

  const handleStartEdit = (codigo: string, currentPrice: number) => {
    setEditingIngredient(codigo)
    setNewPrice(currentPrice.toString())
  }

  const handleCancelEdit = () => {
    setEditingIngredient(null)
    setNewPrice("")
  }

  const handleSavePrice = async (codigo: string) => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      alert('Por favor ingresa un precio válido')
      return
    }

    try {
      await updateIngredientPrice(codigo, parseFloat(newPrice))
    } catch (error) {
      alert('Error al actualizar el precio. Por favor intenta de nuevo.')
    }
  }

  const handleRecipeRefresh = () => {
    fetchRecetas()
  }

  const toggleRecipeExpansion = (codigo: string) => {
    const newExpanded = new Set(expandedRecipes)
    if (newExpanded.has(codigo)) {
      newExpanded.delete(codigo)
    } else {
      newExpanded.add(codigo)
    }
    setExpandedRecipes(newExpanded)
  }

  if (companyLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Configuración de Empresa</h2>
          <p className="text-purple-600">Administra la configuración de tu empresa</p>
        </div>
        
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Cargando configuración...</h3>
            <p className="text-purple-600">Por favor espera mientras obtenemos la información de tu empresa</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (companyError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Configuración de Empresa</h2>
          <p className="text-purple-600">Administra la configuración de tu empresa</p>
        </div>
        
        <Card className="border-red-200 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="text-6xl text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar la configuración</h3>
            <p className="text-red-700 mb-4">{companyError}</p>
            <Button onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (user?.email) {
                fetchCompanyInfo(user.email)
              }
            }} className="bg-red-600 hover:bg-red-700">
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: "ingredients", label: "Ingredientes", icon: Package },
    { id: "recipes", label: "Recetas", icon: ChefHat },
    { id: "company-info", label: "Información de Empresa", icon: Building },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "settings", label: "Configuración", icon: Settings },
  ]

  const renderIngredientsTab = () => {
    if (ingredientsLoading) {
      return (
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Cargando ingredientes...</h3>
            <p className="text-purple-600">Por favor espera mientras obtenemos los ingredientes</p>
          </CardContent>
        </Card>
      )
    }

    if (ingredientsError) {
      return (
        <Card className="border-red-200 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="text-6xl text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar ingredientes</h3>
            <p className="text-red-700 mb-4">{ingredientsError}</p>
            <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Total Ingredientes</p>
                  <p className="text-2xl font-bold text-purple-900">{totalIngredientes}</p>
                </div>
                <Package className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Costo Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(averageCost)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalValue)}</p>
                </div>
                <Hash className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-400"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Actualizar
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Nuevo Ingrediente
            </Button>
          </div>
        </div>

        {/* Ingredients List */}
        {filteredIngredientes.length === 0 ? (
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                {searchTerm ? 'No se encontraron ingredientes' : 'No hay ingredientes'}
              </h3>
              <p className="text-purple-600 mb-4">
                {searchTerm 
                  ? 'Intenta con un término de búsqueda diferente' 
                  : 'Comienza agregando ingredientes para gestionar tu inventario'
                }
              </p>
              {!searchTerm && (
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Agregar Primer Ingrediente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIngredientes.map((ingrediente) => {
              const category = getCategoryFromCode(ingrediente.codigo)
              const isEditing = editingIngredient === ingrediente.codigo
              const isAdmin = company && company.user_role === 'admin'
              const isModified = !!ingrediente.modified_at
              
              return (
                <Card key={ingrediente.id} className={isModified ? "border-red-300 bg-red-50/30 shadow-lg hover:shadow-xl transition-shadow" : "border-purple-200 shadow-lg hover:shadow-xl transition-shadow"}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-purple-900 leading-tight">
                          {ingrediente.nombre}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                            {ingrediente.codigo}
                          </Badge>
                          <Badge className={`text-xs ${category.color}`}>
                            {category.name}
                          </Badge>
                        </div>
                      </div>
                      {isAdmin && !isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(ingrediente.codigo, ingrediente.costo_por_unidad || 0)}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-700">Costo por {ingrediente.unidad || 'unidad'}</span>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="w-20 h-8 text-sm border-purple-200 focus:border-purple-400"
                              disabled={updatingPrice}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSavePrice(ingrediente.codigo)}
                              disabled={updatingPrice}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1"
                            >
                              {updatingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={updatingPrice}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-semibold text-purple-900">
                            {formatCurrency(ingrediente.costo_por_unidad || 0)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-700">Unidad</span>
                        </div>
                        <span className="text-sm text-purple-800">
                          {ingrediente.unidad || 'N/A'}
                        </span>
                      </div>
                      
                      {ingrediente.fecha_creacion && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-700">Agregado</span>
                          </div>
                          <span className="text-sm text-purple-800">
                            {formatDate(ingrediente.fecha_creacion)}
                          </span>
                        </div>
                      )}
                      
                      {ingrediente.modified_at && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">Modificado</span>
                          </div>
                          <span className="text-sm text-red-800 font-medium">
                            {formatDate(ingrediente.modified_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderRecipesTab = () => {
    if (recipesLoading) {
      return (
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Cargando recetas...</h3>
            <p className="text-purple-600">Por favor espera mientras obtenemos las recetas</p>
          </CardContent>
        </Card>
      )
    }

    if (recipesError) {
      return (
        <Card className="border-red-200 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="text-6xl text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar recetas</h3>
            <p className="text-red-700 mb-4">{recipesError}</p>
            <Button onClick={handleRecipeRefresh} className="bg-red-600 hover:bg-red-700">
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      )
    }

    const totalRecetas = recetas?.length || 0
    const averageCost = recetas && recetas.length > 0 
      ? recetas.reduce((sum, receta) => sum + (receta.costo_total_receta || 0), 0) / totalRecetas 
      : 0
    const averageCalories = recetas && recetas.length > 0 
      ? recetas.reduce((sum, receta) => sum + (receta.ingredientes?.reduce((s, ing) => s + (ing.kilocalorias_total || 0), 0) || 0), 0) / totalRecetas
      : 0
    const averageIngredients = recetas && recetas.length > 0 
      ? recetas.reduce((sum, receta) => sum + (receta.ingredientes?.length || 0), 0) / totalRecetas 
      : 0

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Total Recetas</p>
                  <p className="text-2xl font-bold text-purple-900">{totalRecetas}</p>
                </div>
                <ChefHat className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Costo Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(averageCost)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Calorías Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">{Math.round(averageCalories).toLocaleString()}</p>
                </div>
                <Zap className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Ingredientes Promedio</p>
                  <p className="text-2xl font-bold text-purple-900">{Math.round(averageIngredients)}</p>
                </div>
                <Hash className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Buscar por nombre o código de receta..."
              value={recipeSearchTerm}
              onChange={(e) => setRecipeSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-400"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRecipeRefresh}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Actualizar
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Nueva Receta
            </Button>
          </div>
        </div>

        {/* Recipes List */}
        {filteredRecetas.length === 0 ? (
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="text-center py-12">
              <ChefHat className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                {recipeSearchTerm ? 'No se encontraron recetas' : 'No hay recetas'}
              </h3>
              <p className="text-purple-600 mb-4">
                {recipeSearchTerm 
                  ? 'Intenta con un término de búsqueda diferente' 
                  : 'Comienza agregando recetas para gestionar tu menú'
                }
              </p>
              {!recipeSearchTerm && (
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Agregar Primera Receta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRecetas.map((receta, index) => {
              const totalCost = receta.costo_total_receta || 0
              const totalKcal = receta.ingredientes?.reduce((sum, ing) => sum + (ing.kilocalorias_total || 0), 0) || 0
              const recipeCode = receta.codigo_receta || `recipe-${index}`
              const isExpanded = expandedRecipes.has(recipeCode)

              return (
                <Card
                  key={recipeCode}
                  className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-purple-900 mb-2">{receta.nombre_receta || 'Sin nombre'}</CardTitle>
                        <p className="text-sm text-purple-600 font-mono mb-2">{receta.codigo_receta || 'Sin código'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalCost)}</div>
                        <div className="text-sm text-purple-600">{totalKcal} kcal</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          {receta.ingredientes?.length || 0} ingredientes
                        </Badge>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecipeExpansion(recipeCode)}
                        className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                      >
                        {isExpanded ? (
                          <>
                            Ocultar ingredientes <ChevronUp className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Ver ingredientes <ChevronDown className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t border-purple-100 pt-4">
                        <h4 className="font-semibold text-purple-900 mb-3">Ingredientes:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(receta.ingredientes || []).map((ingrediente, index) => (
                            <div
                              key={`${recipeCode}-${ingrediente.codigo_ingrediente || 'ingredient'}-${index}`}
                              className="bg-purple-50 rounded-lg p-3 border border-purple-100"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-purple-900 text-sm">
                                    {ingrediente.nombre_ingrediente || 'Sin nombre'}
                                  </h5>
                                  <p className="text-xs text-purple-600 font-mono">{ingrediente.codigo_ingrediente || 'Sin código'}</p>
                                </div>
                                <Badge className={`${getCategoryColor(ingrediente.categoría || 'general')} text-xs border-0`}>
                                  {ingrediente.categoría || 'General'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Cantidad:</span>
                                  <div className="font-medium text-purple-900">
                                    {ingrediente.cantidad_usada || 0} {ingrediente.unidad || 'unidad'}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Costo:</span>
                                  <div className="font-medium text-purple-900">
                                    {formatCurrency(ingrediente.costo_total || 0)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Costo/{ingrediente.unidad || 'unidad'}:</span>
                                  <div className="font-medium text-purple-900">
                                    {formatCurrency(ingrediente.costo_por_unidad || 0)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Calorías:</span>
                                  <div className="font-medium text-purple-900">
                                    {ingrediente.kilocalorias_total || 0} kcal
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderCompanyInfoTab = () => {
    return (
      <div className="space-y-6">
        <Card className="border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-purple-900">Información de la Empresa</CardTitle>
            <p className="text-purple-600">Gestiona la información básica de tu empresa</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name" className="text-purple-700">Nombre de la Empresa</Label>
                <Input
                  id="company-name"
                  value={company?.name || 'Tu Empresa'}
                  className="border-purple-200 focus:border-purple-400"
                  placeholder="Ingresa el nombre de la empresa"
                />
              </div>
              <div>
                <Label htmlFor="company-id" className="text-purple-700">ID de Empresa</Label>
                <Input
                  id="company-id"
                  value={company?.empresa_id || ''}
                  disabled
                  className="border-purple-200 bg-purple-50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-type" className="text-purple-700">Tipo de Empresa</Label>
                <Input
                  id="company-type"
                  placeholder="Ej: Restaurante, Catering, Hotel"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div>
                <Label htmlFor="company-phone" className="text-purple-700">Teléfono</Label>
                <Input
                  id="company-phone"
                  placeholder="Ej: +51 999 999 999"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="company-address" className="text-purple-700">Dirección</Label>
              <Input
                id="company-address"
                placeholder="Ingresa la dirección de la empresa"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderUsersTab = () => {
    if (workersLoading) {
      return (
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Cargando usuarios...</h3>
            <p className="text-purple-600">Por favor espera mientras obtenemos la información</p>
          </CardContent>
        </Card>
      )
    }

    if (workersError) {
      return (
        <Card className="border-red-200 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="text-6xl text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar usuarios</h3>
            <p className="text-red-700 mb-4">{workersError}</p>
            <Button 
              onClick={() => fetchWorkers()}
              className="bg-red-600 hover:bg-red-700"
            >
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="text-xl text-purple-900">Usuarios de la Empresa</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800 border-0">
                {workers.length} usuario{workers.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <p className="text-purple-600">Gestiona los trabajadores y usuarios de tu empresa</p>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  No hay usuarios registrados
                </h3>
                <p className="text-purple-600 mb-4">
                  Aún no hay usuarios asociados a esta empresa
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workers.map((worker: Worker) => (
                    <Card key={worker.id} className="border-gray-200 hover:border-purple-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <img
                              src={worker.avatar_url}
                              alt={worker.full_name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                              onError={(e) => {
                                // Fallback to initials if avatar fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div 
                              className="w-16 h-16 rounded-full bg-purple-200 border-2 border-purple-300 hidden items-center justify-center"
                              style={{ display: 'none' }}
                            >
                              <span className="text-purple-700 font-semibold text-lg">
                                {worker.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {worker.full_name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {worker.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Último acceso: {formatDate(worker.updated_at)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            Ver Perfil
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Summary Stats */}
                <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-900">{workers.length}</div>
                      <div className="text-sm text-purple-600">Total de Usuarios</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {workers.filter(w => {
                          const lastUpdate = new Date(w.updated_at)
                          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          return lastUpdate > oneWeekAgo
                        }).length}
                      </div>
                      <div className="text-sm text-purple-600">Activos (última semana)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {new Set(workers.map(w => w.email.split('@')[1])).size}
                      </div>
                      <div className="text-sm text-purple-600">Dominios de Email</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <Card className="border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-purple-900">Configuración de Empresa</CardTitle>
            <p className="text-purple-600">Ajusta las configuraciones generales</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Configuración Avanzada
              </h3>
              <p className="text-purple-600 mb-4">
                Pronto podrás configurar ajustes avanzados para tu empresa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Configuración de Empresa</h2>
        <p className="text-purple-600">Administra la configuración de tu empresa</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-purple-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-purple-500 hover:text-purple-600 hover:border-purple-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "ingredients" && renderIngredientsTab()}
        {activeTab === "recipes" && renderRecipesTab()}
        {activeTab === "company-info" && renderCompanyInfoTab()}
        {activeTab === "users" && renderUsersTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  )
} 