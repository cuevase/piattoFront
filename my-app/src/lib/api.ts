import { supabaseBrowser } from '@/app/lib/supabase-browser'

export interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

// ==========================================
// DIRECT SUPABASE QUERIES (Simple Data Operations)
// ==========================================

// Check if user belongs to a company
export async function checkUserInCompany() {
  const supabase = supabaseBrowser()
  
  const { data, error } = await supabase
    .from('empresas_profiles')
    .select('empresa_id, empresas(*)')
    .maybeSingle()
  
  if (error) {
    throw new Error(`Error checking user company: ${error.message}`)
  }
  
  return data
}

// Get company information
export async function getCompanyInfo() {
  const supabase = supabaseBrowser()
  
  // First get the user's company relationship and role
  const { data: userCompany, error: userError } = await supabase
    .from('empresas_profiles')
    .select('empresa_id, rol')
    .maybeSingle()
  
  if (userError) {
    throw new Error(`Error fetching user company: ${userError.message}`)
  }
  
  if (!userCompany) {
    return null
  }
  
  // Then get the company details
  const { data: companyDetails, error: companyError } = await supabase
    .from('empresas')
    .select(`
      id,
      nombre_empresa,
      created_at
    `)
    .eq('id', userCompany.empresa_id)
    .maybeSingle()
  
  if (companyError) {
    throw new Error(`Error fetching company details: ${companyError.message}`)
  }
  
  return {
    empresa_id: userCompany.empresa_id,
    user_role: userCompany.rol,
    empresas: companyDetails
  }
}

// Get clients for the company
export async function getCompanyClients() {
  const supabase = supabaseBrowser()
  
  // First get the company ID
  const { data: userCompany, error: userError } = await supabase
    .from('empresas_profiles')
    .select('empresa_id')
    .maybeSingle()
  
  if (userError) {
    throw new Error(`Error getting user company: ${userError.message}`)
  }
  
  if (!userCompany) {
    throw new Error('User not associated with any company')
  }
  
  // Then get clients for that company
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', userCompany.empresa_id)
    .order('nombre', { ascending: true })
  
  if (error) {
    throw new Error(`Error fetching clients: ${error.message}`)
  }
  
  return data
}

// Get workers of the company
export async function getCompanyWorkers() {
  const supabase = supabaseBrowser()
  
  // First get the company ID
  const { data: userCompany, error: userError } = await supabase
    .from('empresas_profiles')
    .select('empresa_id')
    .maybeSingle()
  
  if (userError) {
    throw new Error(`Error getting user company: ${userError.message}`)
  }
  
  if (!userCompany) {
    throw new Error('User not associated with any company')
  }
  
  // Get all profile IDs for this company
  const { data: companyProfiles, error: profilesError } = await supabase
    .from('empresas_profiles')
    .select('profile_id')
    .eq('empresa_id', userCompany.empresa_id)
  
  if (profilesError) {
    throw new Error(`Error fetching company profiles: ${profilesError.message}`)
  }
  
  if (!companyProfiles || companyProfiles.length === 0) {
    return []
  }
  
  // Then get the actual profile data
  const profileIds = companyProfiles.map(cp => cp.profile_id)
  const { data: profiles, error: profileDataError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      updated_at,
      email
    `)
    .in('id', profileIds)
  
  if (profileDataError) {
    throw new Error(`Error fetching profile data: ${profileDataError.message}`)
  }
  
  return profiles || []
}

// Get ingredients for the company
export async function getCompanyIngredients() {
  const supabase = supabaseBrowser()
  
  // First get the company ID
  const { data: userCompany, error: userError } = await supabase
    .from('empresas_profiles')
    .select('empresa_id')
    .maybeSingle()
  
  if (userError) {
    throw new Error(`Error getting user company: ${userError.message}`)
  }
  
  if (!userCompany) {
    throw new Error('User not associated with any company')
  }
  
  // Then get ingredients for that company
  const { data, error } = await supabase
    .from('ingredientes')
    .select('*')
    .eq('empresa_id', userCompany.empresa_id)
    .order('nombre', { ascending: true })
  
  if (error) {
    throw new Error(`Error fetching ingredients: ${error.message}`)
  }
  
  return data
}

// Get recipes for the company
export async function getCompanyRecipes() {
  const supabase = supabaseBrowser()
  
  // First get the company ID
  const { data: userCompany, error: userError } = await supabase
    .from('empresas_profiles')
    .select('empresa_id')
    .maybeSingle()
  
  if (userError) {
    throw new Error(`Error getting user company: ${userError.message}`)
  }
  
  if (!userCompany) {
    throw new Error('User not associated with any company')
  }
  
  // Then get recipes for that company
  const { data, error } = await supabase
    .from('recetas')
    .select('*')
    .eq('empresa_id', userCompany.empresa_id)
    .order('nombre', { ascending: true })
  
  if (error) {
    throw new Error(`Error fetching recipes: ${error.message}`)
  }
  
  return data
}

// Get recipes with ingredients for the company (comprehensive data)
export async function getCompanyRecipesWithIngredients() {
  try {
    // First get the basic recipe list
    const basicRecipes = await getCompanyRecipes()
    
    if (!basicRecipes || basicRecipes.length === 0) {
      return []
    }
    
    // For each recipe, fetch full details including ingredients from backend
    const recipesWithIngredients = await Promise.all(
      basicRecipes.map(async (recipe) => {
        try {
          const recipeDetails = await apiGet(`/recetas/${recipe.id}`)

          console.log(recipeDetails)
          
          // Map the backend response to the expected format
          return {
            // Include original fields first
            ...recipe,
            // Override with proper field names
            codigo_receta: recipeDetails.codigo_receta,
            nombre_receta: recipeDetails.nombre,
            ingredientes: recipeDetails.ingredientes || [],
            costo_total_receta: recipeDetails.costo_total_receta || recipeDetails.costo_total || 0
          }
        } catch (error) {
          console.warn(`Failed to fetch details for recipe ${recipe.id}:`, error)
          // Return basic recipe info if backend call fails
          return {
            ...recipe,
            codigo_receta: recipe.codigo || recipe.id,
            nombre_receta: recipe.nombre || 'Sin nombre',
            ingredientes: [],
            costo_total_receta: 0
          }
        }
      })
    )
    
    return recipesWithIngredients
  } catch (error) {
    console.error('Error fetching recipes with ingredients:', error)
    throw error
  }
}

// Get recipes with ingredients directly from Supabase (following your backend pattern)
export async function getCompanyRecipesWithIngredientsFromSupabase() {
  const supabase = supabaseBrowser()
  
  try {
    // First get the company ID
    const { data: userCompany, error: userError } = await supabase
      .from('empresas_profiles')
      .select('empresa_id')
      .maybeSingle()
    
    if (userError) {
      throw new Error(`Error getting user company: ${userError.message}`)
    }
    
    if (!userCompany) {
      throw new Error('User not associated with any company')
    }

    // Step 1: Get all recetas from the company
    const { data: recetas, error: recetasError } = await supabase
      .from('recetas')
      .select('*')
      .eq('empresa_id', userCompany.empresa_id)
      .order('nombre', { ascending: true })

    if (recetasError) {
      throw new Error(`Error fetching recipes: ${recetasError.message}`)
    }

    if (!recetas || recetas.length === 0) {
      return []
    }

    // Step 2: Get recipe ingredients for all recipes
    const recetaCodes = recetas.map(receta => receta.codigo_receta || receta.codigo || receta.id).filter(Boolean)
    
    if (recetaCodes.length === 0) {
      return recetas.map(receta => ({
        ...receta,
        codigo_receta: receta.codigo_receta || receta.codigo || receta.id,
        nombre_receta: receta.nombre || 'Sin nombre',
        ingredientes: [],
        costo_total_receta: 0
      }))
    }

    const { data: recetaIngredientes, error: recetaIngredientesError } = await supabase
      .from('receta_ingredientes_actualizados')
      .select('*')
      .in('codigo_receta', recetaCodes)

    if (recetaIngredientesError) {
      console.warn('Error fetching recipe ingredients:', recetaIngredientesError.message)
      // Continue without ingredients if this table doesn't exist or has issues
    }

    // Step 3: Get ingredient details for all ingredients used in recipes
    let ingredientesData: Record<string, any>[] = []
    if (recetaIngredientes && recetaIngredientes.length > 0) {
      const ingredienteCodes = recetaIngredientes.map((ri: any) => ri.codigo_ingrediente).filter(Boolean)
      
      if (ingredienteCodes.length > 0) {
        const { data: ingredientes, error: ingredientesError } = await supabase
          .from('ingredientes')
          .select('*')
          .in('codigo', ingredienteCodes)
          .eq('empresa_id', userCompany.empresa_id)

        if (ingredientesError) {
          console.warn('Error fetching ingredient details:', ingredientesError.message)
        } else {
          ingredientesData = ingredientes || []
        }
      }
    }

    // Step 4: Combine everything
    const recipesWithIngredients = recetas.map((receta: any) => {
      const recetaCode = receta.codigo_receta || receta.codigo || receta.id
      
      // Get ingredients for this recipe
      const recipeIngredients = recetaIngredientes?.filter((ri: any) => ri.codigo_receta === recetaCode) || []
      
      // Map ingredients with full details
      const ingredientesCompletos = recipeIngredients.map((ri: any) => {
        const ingredienteDetail = ingredientesData.find((ing: any) => ing.codigo === ri.codigo_ingrediente)
        
        return {
          codigo_ingrediente: ri.codigo_ingrediente,
          nombre_ingrediente: ingredienteDetail?.nombre || 'Sin nombre',
          unidad: ingredienteDetail?.unidad || 'unidad',
          cantidad_usada: ri.cantidad_usada || 0,
          costo_por_unidad: ri.costo_por_unidad || ingredienteDetail?.costo_por_unidad || 0,
          costo_total: ri.costo_total || (ri.cantidad_usada || 0) * (ri.costo_por_unidad || ingredienteDetail?.costo_por_unidad || 0),
          kilocalorias_total: ri.kilocalorias_total || 0,
          categoría: ri.categoria || ingredienteDetail?.categoria || 'general'
        }
      })

      // Calculate total cost
      const costoTotal = ingredientesCompletos.reduce((sum, ing) => sum + ing.costo_total, 0)

      return {
        ...receta,
        codigo_receta: recetaCode,
        nombre_receta: receta.nombre || 'Sin nombre',
        ingredientes: ingredientesCompletos,
        costo_total_receta: costoTotal
      }
    })

    return recipesWithIngredients
  } catch (error) {
    console.error('Error fetching recipes with ingredients from Supabase:', error)
    throw error
  }
}

// Get individual recipe details from backend
export async function getRecipeDetails(recipeId: string) {
  try {
    const recipeData = await apiGet(`/recetas/${recipeId}`)
    return {
      codigo_receta: recipeData.codigo || recipeId,
      nombre_receta: recipeData.nombre_receta || recipeData.nombre || 'Sin nombre',
      ingredientes: recipeData.ingredientes || [],
      costo_total_receta: recipeData.costo_total_receta || recipeData.costo_total || 0,
      ...recipeData
    }
  } catch (error) {
    console.error(`Error fetching recipe ${recipeId}:`, error)
    throw error
  }
}

// Get menus for a specific client
export async function getClientMenus(clientId: number) {
  const supabase = supabaseBrowser()
  
  const { data, error } = await supabase
    .from('tipos_menus')
    .select('*')
    .eq('cliente_id', clientId)
    .order('fecha_inicio', { ascending: false })
  
  if (error) {
    throw new Error(`Error fetching client menus: ${error.message}`)
  }
  
  return data
}

// Get sedes for a specific client (backend endpoint)
export async function getClientSedes(clientId: number) {
  try {
    return await apiGet(`/clientes/${clientId}/sedes`)
  } catch (error) {
    console.error(`Error fetching sedes for client ${clientId}:`, error)
    throw error
  }
}

// Inventory/Stock API functions
export interface StockData {
  id: number
  ingrediente_id: string
  sede_id: number
  inv_inicial: number
  ingreso: number
  produccion_pr: number
  produccion_re: number
  venta_real_exp: number
  sobrante_prod: number
  venta_carta: number
  inv_final: number
  fecha: string
  created_at: string
}

export interface StockResponse {
  success: boolean
  data: StockData[]
  count: number
  sede_id?: number
}

// Get latest stock for all ingredients (global)
export async function getGlobalStock(): Promise<StockResponse> {
  try {
    return await apiGet('/ingredientes/stock/latest')
  } catch (error) {
    console.error('Error fetching global stock:', error)
    throw error
  }
}

// Get latest stock for all ingredients in a specific sede
export async function getSedeStock(sedeId: number): Promise<StockResponse> {
  try {
    return await apiGet(`/sedes/${sedeId}/ingredientes/stock/latest`)
  } catch (error) {
    console.error(`Error fetching stock for sede ${sedeId}:`, error)
    throw error
  }
}

// Get latest stock for specific ingredient (global)
export async function getIngredientStock(ingredienteId: string): Promise<StockResponse> {
  try {
    return await apiGet(`/ingredientes/${ingredienteId}/stock/latest`)
  } catch (error) {
    console.error(`Error fetching stock for ingredient ${ingredienteId}:`, error)
    throw error
  }
}

// Get latest stock for specific ingredient in specific sede
export async function getIngredientSedeStock(sedeId: number, ingredienteId: string): Promise<StockResponse> {
  try {
    return await apiGet(`/sedes/${sedeId}/ingredientes/${ingredienteId}/stock/latest`)
  } catch (error) {
    console.error(`Error fetching stock for ingredient ${ingredienteId} in sede ${sedeId}:`, error)
    throw error
  }
}

// Get components for a specific menu
export async function getMenuComponents(menuId: string) {
  const supabase = supabaseBrowser()
  
  const { data, error } = await supabase
    .from('componentes_menu')
    .select('*')
    .eq('tipo_menu_id', menuId)
    .order('componente_id', { ascending: true })
  
  if (error) {
    throw new Error(`Error fetching menu components: ${error.message}`)
  }
  
  return data
}

// Get all component types
export async function getComponentTypes() {
  const supabase = supabaseBrowser()
  
  const { data, error } = await supabase
    .from('tipos_componentes')
    .select('*')
    .order('nombre', { ascending: true })
  
  if (error) {
    throw new Error(`Error fetching component types: ${error.message}`)
  }
  
  return data
}

// ==========================================
// BACKEND API CALLS (Complex Operations)
// ==========================================

/* 
BACKEND SUPABASE SETUP:
For your backend to access Supabase directly, add this to your backend:

from supabase import create_client, Client
import os

# Use service role key for backend access (bypasses RLS)
SUPABASE_URL = "your-project-url"
SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"  # From Supabase Settings → API

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Now you can query any table for backtracking
def get_all_recetas_for_backtracking():
    return supabase.table("recetas").select("*").execute().data

def get_receta_ingredients_for_backtracking():
    return supabase.table("receta_ingredientes_actualizados").select("*").execute().data
*/

export async function authenticatedFetch(url: string, options: ApiOptions = {}) {
  const supabase = supabaseBrowser()
  
  // Get the current session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw new Error(`Authentication error: ${error.message}`)
  }
  
  if (!session) {
    throw new Error('No active session found. Please log in.')
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) {
    throw new Error('Backend URL not configured')
  }

  const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url}`

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'ngrok-skip-browser-warning': 'true',
    ...options.headers
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
  }

  const response = await fetch(fullUrl, fetchOptions)

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.')
    }
    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to access this resource.')
    }
    
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorJson.message || errorText
      } catch {
        errorMessage = errorText
      }
    } catch {
      // Use default error message
    }
    
    throw new Error(errorMessage)
  }

  return response
}

// Helper function for GET requests
export async function apiGet(endpoint: string, headers?: Record<string, string>) {
  const response = await authenticatedFetch(endpoint, { method: 'GET', headers })
  return response.json()
}

// Helper function for POST requests
export async function apiPost(endpoint: string, body?: unknown, headers?: Record<string, string>) {
  const response = await authenticatedFetch(endpoint, { method: 'POST', body, headers })
  return response.json()
}

// Helper function for PUT requests
export async function apiPut(endpoint: string, body?: unknown, headers?: Record<string, string>) {
  const response = await authenticatedFetch(endpoint, { method: 'PUT', body, headers })
  return response.json()
}

// Helper function for DELETE requests
export async function apiDelete(endpoint: string, headers?: Record<string, string>) {
  const response = await authenticatedFetch(endpoint, { method: 'DELETE', headers })
  return response.json()
} 

// ==========================================
// DATA DASHBOARD API CALLS
// ==========================================

// Data Dashboard Types
export interface FilterParams {
  empresa_id: string;
  
  // Date Filters
  start_date?: string;
  end_date?: string;
  shipment_date_start?: string;
  shipment_date_end?: string;
  
  // Client Filters
  client_ids?: string;
  client_names?: string;
  
  // Cost Filters
  min_cost?: number;
  max_cost?: number;
  
  // Menu Filters
  menu_ids?: string;
  menu_names?: string;
  
  // Ingredient Filters
  ingredient_codes?: string;
  ingredient_names?: string;
  
  // Status and Pagination
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  limit?: number;
  offset?: number;
  
  // Sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DashboardShipment {
  id: string;
  empresa_id: string;
  shipment_date: string;
  week_start_date: string;
  week_end_date: string;
  total_cost: number;
  total_menus: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  client_count: number;
  client_names?: string[];
}

export interface FilterResponse {
  status: 'success';
  shipments: DashboardShipment[];
  total_found: number;
  filters_applied: {
    date_range: string;
    shipment_date_range: string;
    cost_range: string;
    status: string;
    clients_filtered: boolean;
    menus_filtered: boolean;
    ingredients_filtered: boolean;
  };
}

export interface FilterOptionsResponse {
  status: 'success';
  options: {
    clients: Array<{
      id: number;
      nombre: string;
    }>;
    menus: Array<{
      id: string;
      nombre_menu: string;
    }>;
    ingredients: Array<{
      codigo: string;
      nombre: string;
    }>;
    statuses: string[];
    date_range: {
      min: string | null;
      max: string | null;
    };
    cost_range: {
      min: number;
      max: number;
    };
  };
}

export interface SummaryResponse {
  status: 'success';
  summary: {
    total_shipments: number;
    total_cost: number;
    total_menus: number;
    total_clients: number;
    avg_cost_per_shipment: number;
    status_breakdown: Record<string, number>;
    top_clients: Array<{
      client_id: number;
      client_name: string;
      shipment_count: number;
      total_cost: number;
    }>;
    top_ingredients: Array<{
      codigo: string;
      nombre: string;
      total_quantity: number;
      total_cost: number;
      usage_count: number;
    }>;
    period: {
      start_date: string | null;
      end_date: string | null;
    };
  };
}

// Get filtered shipments with advanced filtering
export async function getFilteredShipments(filters: FilterParams): Promise<FilterResponse> {
  const params = new URLSearchParams()
  
  // Add all filter parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })
  
  try {
    // Try the advanced filter endpoint first
    return await apiGet(`/shipments/advanced-filter?${params}`)
  } catch (error) {
    // Fallback to regular shipments endpoint if advanced filter doesn't exist
    console.warn('Advanced filter endpoint not available, falling back to regular shipments')
    const response = await apiGet(`/shipments?${params}`)
    
    // Transform regular shipments response to match expected format
    return {
      status: 'success' as const,
      shipments: response.shipments || [],
      total_found: response.total || 0,
      filters_applied: {
        date_range: '',
        shipment_date_range: '',
        cost_range: '',
        status: filters.status || '',
        clients_filtered: !!filters.client_ids,
        menus_filtered: !!filters.menu_ids,
        ingredients_filtered: !!filters.ingredient_codes
      }
    }
  }
}

// Get filter options for dropdowns
export async function getShipmentFilterOptions(empresaId: string): Promise<FilterOptionsResponse> {
  try {
    return await apiGet(`/shipments/filter-options?empresa_id=${empresaId}`)
  } catch (error) {
    console.warn('Filter options endpoint not available, using fallback data')
    // Fallback: get basic data from existing endpoints
    const [clients, ingredients] = await Promise.all([
      getCompanyClients().catch(() => []),
      getCompanyIngredients().catch(() => [])
    ])
    
    return {
      status: 'success' as const,
      options: {
        clients: clients.map((client: any) => ({
          id: client.id,
          nombre: client.nombre
        })),
        menus: [], // Empty for now, could be populated from other endpoints
        ingredients: ingredients.map((ingredient: any) => ({
          codigo: ingredient.codigo || ingredient.id,
          nombre: ingredient.nombre
        })),
        statuses: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        date_range: { min: null, max: null },
        cost_range: { min: 0, max: 100000 }
      }
    }
  }
}

// Get dashboard summary statistics
export async function getDashboardSummary(
  empresaId: string, 
  startDate?: string, 
  endDate?: string
): Promise<SummaryResponse> {
  const params = new URLSearchParams({ empresa_id: empresaId })
  
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  
  try {
    return await apiGet(`/shipments/dashboard-summary?${params}`)
  } catch (error) {
    console.warn('Dashboard summary endpoint not available, using fallback calculation')
    
    // Fallback: calculate summary from regular shipments data
    try {
      const shipmentsResponse = await apiGet(`/shipments?${params}`)
      const shipments = shipmentsResponse.shipments || []
      
      const totalCost = shipments.reduce((sum: number, s: any) => sum + (s.total_cost || 0), 0)
      const totalMenus = shipments.reduce((sum: number, s: any) => sum + (s.total_menus || 0), 0)
      const uniqueClients = new Set(shipments.flatMap((s: any) => s.client_names || [])).size
      
      return {
        status: 'success' as const,
        summary: {
          total_shipments: shipments.length,
          total_cost: totalCost,
          total_menus: totalMenus,
          total_clients: uniqueClients,
          avg_cost_per_shipment: shipments.length > 0 ? totalCost / shipments.length : 0,
          status_breakdown: shipments.reduce((acc: Record<string, number>, s: any) => {
            acc[s.status] = (acc[s.status] || 0) + 1
            return acc
          }, {}),
          top_clients: [],
          top_ingredients: [],
          period: {
            start_date: startDate || null,
            end_date: endDate || null
          }
        }
      }
    } catch (fallbackError) {
      // If even the fallback fails, return empty summary
      return {
        status: 'success' as const,
        summary: {
          total_shipments: 0,
          total_cost: 0,
          total_menus: 0,
          total_clients: 0,
          avg_cost_per_shipment: 0,
          status_breakdown: {},
          top_clients: [],
          top_ingredients: [],
          period: {
            start_date: startDate || null,
            end_date: endDate || null
          }
        }
      }
    }
  }
} 