"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChefHat, Users, TrendingUp, Eye, ArrowLeft, Package, CheckCircle, Circle, Link, Crown, Loader2, Plus, Trash2, X, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/app/lib/supabase-browser"
import { getCompanyInfo, getCompanyClients, getClientMenus, getMenuComponents, getComponentTypes, getClientSedes } from "@/lib/api"

export default function ClientesPage()  {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedMenu, setSelectedMenu] = useState<any>(null)
  const [clientMenus, setClientMenus] = useState<any[]>([])
  const [menuComponents, setMenuComponents] = useState<any[]>([])
  const [clientSedes, setClientSedes] = useState<Record<number, any[]>>({})
  const [sedesLoading, setSedesLoading] = useState<Record<number, boolean>>({})
  const [componentTypes, setComponentTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [menusLoading, setMenusLoading] = useState(false)
  const [componentsLoading, setComponentsLoading] = useState(false)
  const [company, setCompany] = useState<any>(null)
  
  // Menu creation state
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [creatingMenu, setCreatingMenu] = useState(false)
  const [newMenu, setNewMenu] = useState({
    nombre_menu: "",
    precio: "",
    kilocalorias_max: "",
    kilocalorias_min: "",
    fecha_inicio: "",
    generado_por: ""
  })
  const [newMenuComponents, setNewMenuComponents] = useState<Array<{
    componente_id: number | null
    unico: boolean
    premium: boolean
    condicional: string
    isConditionalPair?: boolean
    conditionalPairId?: string
  }>>([{
    componente_id: null,
    unico: false,
    premium: false,
    condicional: "",
    isConditionalPair: false
  }])
  
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
      
      // Fetch component types for reference
      await fetchComponentTypes()
    }

    initializeData()
  }, [router, supabase])

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
        
        // Fetch clients using direct Supabase query
        await fetchClients()
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
    }
  }

  const fetchClients = async () => {
    try {
      setLoading(true)
      const clientsData = await getCompanyClients()
      setClients(clientsData || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const fetchClientMenus = async (clientId: number) => {
    try {
      setMenusLoading(true)
      
      const menusData = await getClientMenus(clientId)
      setClientMenus(menusData || [])
      
    } catch (error) {
      console.error('Error fetching menus:', error)
      setClientMenus([])
    } finally {
      setMenusLoading(false)
    }
  }

  const fetchClientSedes = async (clientId: number) => {
    try {
      setSedesLoading(prev => ({ ...prev, [clientId]: true }))
      const sedes = await getClientSedes(clientId)
      setClientSedes(prev => ({ ...prev, [clientId]: sedes || [] }))
    } catch (error) {
      console.error('Error fetching sedes:', error)
      setClientSedes(prev => ({ ...prev, [clientId]: [] }))
    } finally {
      setSedesLoading(prev => ({ ...prev, [clientId]: false }))
    }
  }

  const fetchMenuComponents = async (menuId: string) => {
    try {
      setComponentsLoading(true)
      
      const componentsData = await getMenuComponents(menuId)
      setMenuComponents(componentsData || [])
      
    } catch (error) {
      console.error('Error fetching components:', error)
      setMenuComponents([])
    } finally {
      setComponentsLoading(false)
    }
  }

  const fetchComponentTypes = async () => {
    try {
      const componentTypesData = await getComponentTypes()
      setComponentTypes(componentTypesData || [])
      
    } catch (error) {
      console.error('Error fetching component types:', error)
      setComponentTypes([])
    }
  }

  const getComponentName = (componentId: number) => {
    const componentType = componentTypes.find(type => type.id === componentId)
    return componentType ? componentType.nombre : `Componente ${componentId}`
  }

  // Menu creation functions
  const openCreateMenu = () => {
    setShowCreateMenu(true)
    resetMenuForm()
  }

  const resetMenuForm = () => {
    setNewMenu({
      nombre_menu: "",
      precio: "",
      kilocalorias_max: "",
      kilocalorias_min: "",
      fecha_inicio: "",
      generado_por: ""
    })
    setNewMenuComponents([{
      componente_id: null,
      unico: false,
      premium: false,
      condicional: "",
      isConditionalPair: false
    }])
  }

  const addComponent = () => {
    setNewMenuComponents(prev => [...prev, {
      componente_id: null,
      unico: false,
      premium: false,
      condicional: "",
      isConditionalPair: false
    }])
  }

  const addConditionalPair = () => {
    const pairId = Date.now().toString() // Simple unique ID for the pair
    setNewMenuComponents(prev => [...prev, 
      {
        componente_id: null,
        unico: false,
        premium: false,
        condicional: "",
        isConditionalPair: true,
        conditionalPairId: pairId
      },
      {
        componente_id: null,
        unico: false,
        premium: false,
        condicional: "",
        isConditionalPair: true,
        conditionalPairId: pairId
      }
    ])
  }

  const removeComponent = (index: number) => {
    if (newMenuComponents.length > 1) {
      const componentToRemove = newMenuComponents[index]
      
      if (componentToRemove.isConditionalPair) {
        // Remove both components of the conditional pair
        setNewMenuComponents(prev => 
          prev.filter(comp => comp.conditionalPairId !== componentToRemove.conditionalPairId)
        )
      } else {
        // Remove single component
        setNewMenuComponents(prev => prev.filter((_, i) => i !== index))
      }
    }
  }

  const updateComponent = (index: number, field: string, value: any) => {
    setNewMenuComponents(prev => 
      prev.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    )
  }

  const createMenuWithComponents = async () => {
    if (!selectedClient) return

    // Validate form
    if (!newMenu.nombre_menu.trim()) {
      alert("El nombre del menú es requerido")
      return
    }

    const validComponents = newMenuComponents.filter(comp => comp.componente_id !== null)
    if (validComponents.length === 0) {
      alert("Debe agregar al menos un componente")
      return
    }

    // Validate conditional pairs - both components in a pair must have componente_id
    const conditionalPairs = new Map<string, any[]>()
    validComponents.forEach(comp => {
      if (comp.isConditionalPair && comp.conditionalPairId) {
        if (!conditionalPairs.has(comp.conditionalPairId)) {
          conditionalPairs.set(comp.conditionalPairId, [])
        }
        conditionalPairs.get(comp.conditionalPairId)!.push(comp)
      }
    })

    for (const [pairId, pair] of conditionalPairs.entries()) {
      if (pair.length !== 2) {
        alert("Los pares condicionales deben tener exactamente 2 componentes seleccionados")
        return
      }
    }

    setCreatingMenu(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      
      if (!backendUrl) {
        throw new Error('Backend URL not configured')
      }

      // Create menu first
      const menuData = {
        cliente_id: selectedClient.id,
        nombre_menu: newMenu.nombre_menu,
        generado_por: newMenu.generado_por || "Usuario",
        fecha_inicio: newMenu.fecha_inicio || null,
        precio: newMenu.precio ? parseFloat(newMenu.precio) : null,
        kilocalorias_max: newMenu.kilocalorias_max ? parseInt(newMenu.kilocalorias_max) : null,
        kilocalorias_min: newMenu.kilocalorias_min ? parseInt(newMenu.kilocalorias_min) : null
      }

      const menuResponse = await fetch(`${backendUrl}/menus`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(menuData)
      })

      if (!menuResponse.ok) {
        throw new Error(`Error creating menu: ${menuResponse.status}`)
      }

      const createdMenu = await menuResponse.json()
      const menuId = createdMenu.id

      // Separate conditional pairs from regular components
      const conditionalPairs = new Map<string, any[]>()
      const regularComponents: any[] = []

      validComponents.forEach(comp => {
        if (comp.isConditionalPair && comp.conditionalPairId) {
          if (!conditionalPairs.has(comp.conditionalPairId)) {
            conditionalPairs.set(comp.conditionalPairId, [])
          }
          conditionalPairs.get(comp.conditionalPairId)!.push(comp)
        } else {
          regularComponents.push(comp)
        }
      })

      // Create regular components
      const regularComponentPromises = regularComponents.map(async (comp) => {
        const componentData = {
          tipo_menu_id: menuId,
          componente_id: comp.componente_id!,
          unico: comp.unico,
          premium: comp.premium,
          condicional: comp.condicional || null
        }

        const compResponse = await fetch(`${backendUrl}/componentes_menu`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(componentData)
        })

        if (!compResponse.ok) {
          throw new Error(`Error creating component: ${compResponse.status}`)
        }

        return compResponse.json()
      })

      // Create conditional component pairs
      const conditionalPairPromises = Array.from(conditionalPairs.values()).map(async (pair) => {
        if (pair.length !== 2) {
          throw new Error('Conditional pair must have exactly 2 components')
        }

        const [comp1, comp2] = pair

        // Step 1: Create first component without conditional ID
        const comp1Data = {
          tipo_menu_id: menuId,
          componente_id: comp1.componente_id!,
          unico: comp1.unico,
          premium: comp1.premium,
          condicional: null
        }

        const comp1Response = await fetch(`${backendUrl}/componentes_menu`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(comp1Data)
        })

        if (!comp1Response.ok) {
          throw new Error(`Error creating first conditional component: ${comp1Response.status}`)
        }

        const createdComp1 = await comp1Response.json()

        // Step 2: Create second component with conditional ID pointing to first component
        const comp2Data = {
          tipo_menu_id: menuId,
          componente_id: comp2.componente_id!,
          unico: comp2.unico,
          premium: comp2.premium,
          condicional: createdComp1.id.toString()
        }

        const comp2Response = await fetch(`${backendUrl}/componentes_menu`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(comp2Data)
        })

        if (!comp2Response.ok) {
          throw new Error(`Error creating second conditional component: ${comp2Response.status}`)
        }

        const createdComp2 = await comp2Response.json()

        // Step 3: Update first component to point to second component
        const updateData = {
          condicional: createdComp2.id.toString()
        }

        const updateResponse = await fetch(`${backendUrl}/componentes_menu/${createdComp1.id}`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(updateData)
        })

        if (!updateResponse.ok) {
          throw new Error(`Error updating first conditional component: ${updateResponse.status}`)
        }

        return [createdComp1, createdComp2]
      })

      // Wait for all components to be created
      await Promise.all([...regularComponentPromises, ...conditionalPairPromises])

      console.log('✅ Menu and components created successfully')
      
      // Close modal and reset form
      setShowCreateMenu(false)
      resetMenuForm()

      // Refresh the client menus
      fetchClientMenus(selectedClient.id)
      
    } catch (error) {
      console.error('Error creating menu:', error)
      alert("Error al crear el menú. Por favor intenta de nuevo.")
    } finally {
      setCreatingMenu(false)
    }
  }

  const handleRefresh = () => {
    fetchClients()
  }

  // Render different views based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <div className="text-purple-600">Cargando clientes...</div>
          </div>
        </div>
      )
    }

    // Component view (showing components for selected menu)
    if (selectedMenu) {
      if (componentsLoading) {
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setSelectedMenu(null)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Menús
              </Button>
            </div>

            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-purple-600 font-medium">Cargando componentes del menú...</p>
            </div>
          </div>
        )
      }

      const unicosCount = menuComponents.filter((c) => c.unico).length
      const noUnicosCount = menuComponents.filter((c) => !c.unico).length
      const condicionalesCount = menuComponents.filter((c) => c.condicional !== null).length
      const premiumCount = menuComponents.filter((c) => c.premium).length

      // Group conditional components by their conditional relationship
      const conditionalPairs = new Map<string, any[]>()
      const individualComponents: any[] = []

      menuComponents.forEach((component) => {
        if (component.condicional) {
          const pairKey = [component.id, component.condicional].sort().join("-")
          if (!conditionalPairs.has(pairKey)) {
            conditionalPairs.set(pairKey, [])
          }
          conditionalPairs.get(pairKey)!.push(component)
        } else {
          individualComponents.push(component)
        }
      })

      return (
        <div className="space-y-6">
          {/* Header with back button and menu info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setSelectedMenu(null)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Menús
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Package className="h-6 w-6 mr-2 text-purple-600" />
                  {selectedMenu.nombre_menu}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Cliente: {selectedClient.nombre} • Precio: S/. {selectedMenu.precio}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {menuComponents.length} componentes
              </Badge>
            </div>
          </div>

          {/* Menu summary card */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span>
                    <strong>Total:</strong> {menuComponents.length} componentes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>
                    <strong>Únicos:</strong> {unicosCount}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Circle className="h-4 w-4 text-blue-600" />
                  <span>
                    <strong>No únicos:</strong> {noUnicosCount}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4 text-orange-600" />
                  <span>
                    <strong>Condicionales:</strong> {condicionalesCount}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span>
                    <strong>Premium:</strong> {premiumCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Components grid */}
          {menuComponents.length === 0 ? (
            <Card className="border-purple-200">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay componentes disponibles</h3>
                <p className="text-gray-600 mb-4">Este menú aún no tiene componentes asignados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Individual Components */}
              {individualComponents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Circle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Componentes Individuales</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {individualComponents.length}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {individualComponents.map((component) => (
                      <Card key={component.id} className="border-green-200 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-gray-900 flex items-center">
                            <Circle className="h-4 w-4 mr-2 text-green-600" />
                            {getComponentName(component.componente_id)}
                            {component.premium && <Crown className="h-4 w-4 ml-2 text-yellow-600" />}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2">
                                <Badge className={component.unico ? "bg-green-600 text-white" : "bg-blue-600 text-white"}>
                                  {component.unico ? "Único" : "No único"}
                                </Badge>
                                {component.premium && (
                                  <Badge className="bg-yellow-600 text-white">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional Pairs */}
              {conditionalPairs.size > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Link className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Pares Condicionales</h3>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {conditionalPairs.size} pares
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {Array.from(conditionalPairs.entries()).map(([pairKey, pairComponents]) => (
                      <Card key={pairKey} className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-orange-800 flex items-center">
                            <Link className="h-4 w-4 mr-2" />
                            Par Condicional (solo uno aparecerá)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid gap-3 md:grid-cols-2">
                            {pairComponents.map((component) => (
                              <div
                                key={component.id}
                                className="flex items-center justify-between p-3 bg-white rounded border border-orange-200"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 flex items-center">
                                    {getComponentName(component.componente_id)}
                                    {component.premium && <Crown className="h-4 w-4 ml-2 text-yellow-600" />}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge
                                      variant={component.unico ? "default" : "outline"}
                                      className={
                                        component.unico ? "bg-orange-600 text-white" : "border-gray-300 text-gray-700"
                                      }
                                    >
                                      {component.unico ? "Único" : "No único"}
                                    </Badge>
                                    {component.premium && (
                                      <Badge className="bg-yellow-600 text-white">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Premium
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-center mt-3">
                            <Badge variant="outline" className="border-orange-300 text-orange-700">
                              Mutuamente excluyentes
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    // Menu view (showing menus for selected client)
    if (selectedClient) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-800 mb-2">Menús del Cliente</h2>
              <p className="text-purple-600">Menús de {selectedClient.nombre}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={openCreateMenu}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Menú
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Toggle to show client details
                  setSelectedClient({...selectedClient, showDetails: !selectedClient.showDetails});
                }}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {selectedClient.showDetails ? "Ver Menús" : "Ver Detalles"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedClient(null);
                  setSelectedMenu(null);
                }}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                ← Volver a Lista
              </Button>
            </div>
          </div>

          {/* Client Details Card (collapsible) */}
          {selectedClient.showDetails && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {selectedClient.nombre}
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Cliente ID: {selectedClient.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-purple-100 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-200 rounded-lg">
                          <ChefHat className="w-5 h-5 text-purple-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800">Comidas/Semana</h4>
                          <p className="text-xl font-bold text-purple-600">{selectedClient.comidas_por_semana}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-100 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-200 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-purple-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800">Presupuesto</h4>
                          <p className="text-xl font-bold text-purple-600">${selectedClient.presupuesto_por_menu}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-100 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-200 rounded-lg">
                          <ChefHat className="w-5 h-5 text-purple-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800">Total Menús</h4>
                          <p className="text-xl font-bold text-purple-600">{clientMenus.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sedes section */}
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-800">Sedes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sedesLoading[selectedClient.id] ? (
                      <div className="flex items-center text-purple-600">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Cargando sedes...
                      </div>
                    ) : clientSedes[selectedClient.id] && clientSedes[selectedClient.id].length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {clientSedes[selectedClient.id].map((sede) => (
                          <Card key={sede.id} className="border-purple-100">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-purple-800">{sede.nombre}</h4>
                              {sede.direccion && (
                                <p className="text-sm text-gray-600 mt-1">{sede.direccion}</p>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                {sede.correo || 'Sin correo'}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">Sin sedes</div>
                    )}
                  </CardContent>
                </Card>

                {selectedClient.preferencias_carnicas && Object.keys(selectedClient.preferencias_carnicas).length > 0 && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-purple-800">Preferencias Cárnicas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(selectedClient.preferencias_carnicas).map(([carne, cantidad]) => (
                          <div key={carne} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="text-purple-700 capitalize">{carne}</span>
                            <Badge className="bg-purple-200 text-purple-800">
                              {cantidad as number}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {/* Menus Section */}
          {menusLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-purple-600">Cargando menús...</span>
              </div>
            </div>
          ) : clientMenus.length === 0 ? (
            <Card className="border-purple-200">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-800 mb-2">No hay menús</h3>
                <p className="text-purple-600 mb-6">Este cliente no tiene menús registrados.</p>
                <Button
                  onClick={openCreateMenu}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Menú
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {clientMenus.map((menu) => (
                <Card key={menu.id} className="border-purple-200 hover:border-purple-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <ChefHat className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-purple-800">{menu.nombre_menu}</h3>
                          <p className="text-purple-600 text-sm">Generado por: {menu.generado_por}</p>
                          <p className="text-purple-600 text-sm">Fecha inicio: {menu.fecha_inicio}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-purple-600">Precio</p>
                          <p className="font-semibold text-purple-800">${menu.precio}</p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedMenu(menu);
                            fetchMenuComponents(menu.id);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Ver Componentes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Client list view (default)
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-purple-800 mb-2">Clientes</h2>
            <p className="text-purple-600">Gestiona los clientes de tu empresa</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {clients.length === 0 ? (
          <Card className="border-purple-200">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-800 mb-2">No hay clientes</h3>
              <p className="text-purple-600">Aún no hay clientes registrados para esta empresa.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {clients.map((client) => (
              <Card 
                key={client.id} 
                className="border-purple-200 hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedClient(client);
                  setSelectedMenu(null); // Clear any previously selected menu
                  fetchClientMenus(client.id);
                  fetchClientSedes(client.id);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-purple-800">{client.nombre}</h3>
                        <p className="text-purple-600 text-sm">Cliente ID: {client.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-purple-600">Comidas/Semana</p>
                        <p className="font-semibold text-purple-800">{client.comidas_por_semana}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-purple-600">Presupuesto</p>
                        <p className="font-semibold text-purple-800">${client.presupuesto_por_menu}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderContent()}
      
      {/* Create Menu Modal - Always rendered at component level */}
      {showCreateMenu && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-green-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-900">Crear Nuevo Menú</h3>
                  <p className="text-green-600">
                    Cliente: {selectedClient?.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateMenu(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Menu Basic Information */}
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg text-green-900 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Información del Menú
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre_menu" className="text-green-700 font-medium">
                        Nombre del Menú *
                      </Label>
                      <Input
                        id="nombre_menu"
                        value={newMenu.nombre_menu}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, nombre_menu: e.target.value }))}
                        placeholder="Ej: Menú Ejecutivo Premium"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precio" className="text-green-700 font-medium">
                        Precio (PEN)
                      </Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        value={newMenu.precio}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, precio: e.target.value }))}
                        placeholder="0.00"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kilocalorias_min" className="text-green-700 font-medium">
                        Kilocalorías Mínimas
                      </Label>
                      <Input
                        id="kilocalorias_min"
                        type="number"
                        value={newMenu.kilocalorias_min}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, kilocalorias_min: e.target.value }))}
                        placeholder="500"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kilocalorias_max" className="text-green-700 font-medium">
                        Kilocalorías Máximas
                      </Label>
                      <Input
                        id="kilocalorias_max"
                        type="number"
                        value={newMenu.kilocalorias_max}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, kilocalorias_max: e.target.value }))}
                        placeholder="1000"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_inicio" className="text-green-700 font-medium">
                        Fecha de Inicio
                      </Label>
                      <Input
                        id="fecha_inicio"
                        type="date"
                        value={newMenu.fecha_inicio}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generado_por" className="text-green-700 font-medium">
                        Generado Por
                      </Label>
                      <Input
                        id="generado_por"
                        value={newMenu.generado_por}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, generado_por: e.target.value }))}
                        placeholder="Usuario"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Components */}
              <Card className="border-blue-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-900 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Componentes del Menú
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addComponent}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Componente
                      </Button>
                      <Button
                        onClick={addConditionalPair}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Agregar Par Condicional
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    // Group components by conditional pairs and individual components
                    const processedIndices = new Set<number>()
                                         const componentGroups: React.ReactElement[] = []

                    newMenuComponents.forEach((component, index) => {
                      if (processedIndices.has(index)) return

                      if (component.isConditionalPair) {
                        // Find the pair component
                        const pairIndex = newMenuComponents.findIndex((comp, idx) => 
                          idx !== index && 
                          comp.conditionalPairId === component.conditionalPairId
                        )
                        
                        if (pairIndex !== -1) {
                          const pairComponent = newMenuComponents[pairIndex]
                          processedIndices.add(index)
                          processedIndices.add(pairIndex)

                          componentGroups.push(
                            <Card key={`pair-${component.conditionalPairId}`} className="border-orange-200 bg-orange-50">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-2">
                                    <Link className="h-4 w-4 text-orange-600" />
                                    <h4 className="font-medium text-orange-800">Par Condicional (mutuamente excluyentes)</h4>
                                  </div>
                                  {newMenuComponents.length > 1 && (
                                    <Button
                                      onClick={() => removeComponent(index)}
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {/* First component of the pair */}
                                  <div className="bg-white p-4 rounded border border-orange-200">
                                    <h5 className="font-medium text-gray-900 mb-3">Opción A</h5>
                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                          Tipo de Componente *
                                        </Label>
                                        <select
                                          value={component.componente_id || ""}
                                          onChange={(e) => updateComponent(index, 'componente_id', parseInt(e.target.value) || null)}
                                          className="w-full p-2 border border-gray-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                        >
                                          <option value="">Seleccionar componente...</option>
                                          {componentTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                              {type.nombre}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`unico-${index}`}
                                            checked={component.unico}
                                            onCheckedChange={(checked) => updateComponent(index, 'unico', checked)}
                                          />
                                          <Label htmlFor={`unico-${index}`} className="text-sm text-gray-700">
                                            Único
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`premium-${index}`}
                                            checked={component.premium}
                                            onCheckedChange={(checked) => updateComponent(index, 'premium', checked)}
                                          />
                                          <Label htmlFor={`premium-${index}`} className="text-sm text-gray-700">
                                            Premium
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Second component of the pair */}
                                  <div className="bg-white p-4 rounded border border-orange-200">
                                    <h5 className="font-medium text-gray-900 mb-3">Opción B</h5>
                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                          Tipo de Componente *
                                        </Label>
                                        <select
                                          value={pairComponent.componente_id || ""}
                                          onChange={(e) => updateComponent(pairIndex, 'componente_id', parseInt(e.target.value) || null)}
                                          className="w-full p-2 border border-gray-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                        >
                                          <option value="">Seleccionar componente...</option>
                                          {componentTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                              {type.nombre}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`unico-${pairIndex}`}
                                            checked={pairComponent.unico}
                                            onCheckedChange={(checked) => updateComponent(pairIndex, 'unico', checked)}
                                          />
                                          <Label htmlFor={`unico-${pairIndex}`} className="text-sm text-gray-700">
                                            Único
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`premium-${pairIndex}`}
                                            checked={pairComponent.premium}
                                            onCheckedChange={(checked) => updateComponent(pairIndex, 'premium', checked)}
                                          />
                                          <Label htmlFor={`premium-${pairIndex}`} className="text-sm text-gray-700">
                                            Premium
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        }
                      } else {
                        // Regular component
                        processedIndices.add(index)
                        componentGroups.push(
                          <Card key={index} className="border-gray-200 bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Componente {componentGroups.length + 1}</h4>
                                {newMenuComponents.length > 1 && (
                                  <Button
                                    onClick={() => removeComponent(index)}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Component Dropdown */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Tipo de Componente *
                                  </Label>
                                  <select
                                    value={component.componente_id || ""}
                                    onChange={(e) => updateComponent(index, 'componente_id', parseInt(e.target.value) || null)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">Seleccionar componente...</option>
                                    {componentTypes.map((type) => (
                                      <option key={type.id} value={type.id}>
                                        {type.nombre}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Condicional */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Condicional
                                  </Label>
                                  <Input
                                    value={component.condicional}
                                    onChange={(e) => updateComponent(index, 'condicional', e.target.value)}
                                    placeholder="Condición especial..."
                                    className="border-gray-300 focus:border-blue-500"
                                  />
                                </div>

                                {/* Checkboxes */}
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`unico-${index}`}
                                      checked={component.unico}
                                      onCheckedChange={(checked) => updateComponent(index, 'unico', checked)}
                                    />
                                    <Label htmlFor={`unico-${index}`} className="text-sm text-gray-700">
                                      Único
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`premium-${index}`}
                                      checked={component.premium}
                                      onCheckedChange={(checked) => updateComponent(index, 'premium', checked)}
                                    />
                                    <Label htmlFor={`premium-${index}`} className="text-sm text-gray-700">
                                      Premium
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      }
                    })

                    return componentGroups
                  })()}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateMenu(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createMenuWithComponents}
                  disabled={creatingMenu}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {creatingMenu ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Menú
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