import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChefHat, Users, TrendingUp, Building } from "lucide-react"

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Resumen General</h2>
        <p className="text-purple-600">Bienvenido a tu panel de control</p>
      </div>

      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-800">
                Tu Empresa
              </h3>
              <p className="text-purple-600 text-sm">
                Información de la empresa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-800 flex items-center">
              <ChefHat className="w-5 h-5 mr-2" />
              Menús Creados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">12</div>
            <p className="text-sm text-purple-500">Este mes</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-800 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">248</div>
            <p className="text-sm text-purple-500">Última semana</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Crecimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">+23%</div>
            <p className="text-sm text-purple-500">Vs mes anterior</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-700">Nuevo menú "Especial de Temporada" creado</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Hace 2h
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-700">Configuración de precios actualizada</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Hace 5h
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-700">Reporte mensual generado</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Ayer
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}