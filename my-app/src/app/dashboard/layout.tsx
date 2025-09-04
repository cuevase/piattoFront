"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, BarChart3, Settings, LogOut, Users, Building, Eye, Loader2, Package, Cog } from "lucide-react"
import { supabaseBrowser } from "@/app/lib/supabase-browser"
import { apiGet, getCompanyInfo, getCompanyClients } from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [companyError, setCompanyError] = useState<string | null>(null)
  
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = supabaseBrowser()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Fetch company information
      if (user.email) {
        await fetchCompanyInfo(user.email)
      }
      
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const fetchCompanyInfo = async (email: string) => {
    try {
      console.log('🔍 DEBUG: Fetching company info using direct Supabase query')
      
      const companyData = await getCompanyInfo()
      
      console.log('🔍 DEBUG: Company data received:', companyData)
      
      if (!companyData) {
        console.log('🔍 DEBUG: No company data found')
        setCompanyError('No estás vinculado a ninguna empresa. Contacta a tu administrador para que te incorpore a la empresa.')
        setCompany(null)
      } else {
        console.log('🔍 DEBUG: Company data found, setting company')
        
        // Create company info from the direct Supabase query
        const empresaInfo = Array.isArray(companyData.empresas) ? companyData.empresas[0] : companyData.empresas
        const companyInfo = {
          empresa_id: companyData.empresa_id,
          user_role: companyData.user_role || 'worker', // Use actual role from API
          added_at: empresaInfo?.created_at,
          profile_id: companyData.empresa_id,
          name: empresaInfo?.nombre_empresa || 'Tu Empresa',
          logo_url: empresaInfo?.logo_url || null,
          descripcion: empresaInfo?.descripcion || null
        }
        
        setCompany(companyInfo)
        setCompanyError(null)
        
        // Additional company-specific initialization can be added here
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching company info:', error)
      setCompanyError(error instanceof Error ? error.message : 'Error al obtener información de la empresa.')
      setCompany(null)
    }
  }

  

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Task delegation removed

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-purple-800 mb-2">Cargando...</h2>
          <p className="text-purple-600">Verificando tu acceso</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show company error message if user is not linked to any company
  if (companyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-800">
              Acceso Restringido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-700">{companyError}</p>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is admin based on role from empresa relation
  const isAdmin = company && company.user_role === 'admin'

  const menuItems = [
    { id: "/dashboard/menus", label: "Generar Menús", icon: ChefHat },
    { id: "/dashboard/clientes", label: "Clientes", icon: Users },
    { id: "/dashboard/shipments", label: "Envíos", icon: Package },
    { id: "/dashboard/data", label: "Ver Datos", icon: Eye },
    // Only show company config for admin users
    ...(isAdmin ? [{ id: "/dashboard/config/company", label: "Configuración de Empresa", icon: Building }] : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src="/pulpoo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-purple-800">Panel de Control</h1>
                {company && (
                  <p className="text-sm text-purple-600">
                    {company.name || 'Tu Empresa'} {company.user_role && `(${company.user_role})`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-purple-600">
                Hola, {user.user_metadata?.full_name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              
              
              <Link
                href="/dashboard/menus"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/menus')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChefHat className="h-4 w-4" />
                Generar Menús
              </Link>
              

              
              <Link
                href="/dashboard/clientes"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/clientes'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4" />
                Clientes
              </Link>
              
              <Link
                href="/dashboard/shipments"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/shipments')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="h-4 w-4" />
                Consolidaciones
              </Link>

              
              
              <Link
                href="/dashboard/data"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard/data')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Eye className="h-4 w-4" />
                Data
              </Link>
              
              
              {company?.user_role === 'admin' && (
                <Link
                  href="/dashboard/config/company"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/dashboard/config/company')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Cog className="h-4 w-4" />
                  Configuración
                </Link>
              )}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      
    </div>
  )
} 