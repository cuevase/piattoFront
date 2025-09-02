"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Configuración</h2>
        <p className="text-purple-600">Gestiona la configuración de tu cuenta y aplicación</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">Perfil de Usuario</CardTitle>
            <CardDescription className="text-purple-600">Actualiza tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue="Usuario Ejemplo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue="usuario@email.com"
                />
              </div>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">Configuración de la Aplicación</CardTitle>
            <CardDescription className="text-purple-600">
              Personaliza el comportamiento de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-purple-800 font-medium">Notificaciones por email</h4>
                <p className="text-sm text-purple-600">Recibe actualizaciones por correo</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <Separator className="bg-purple-200" />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-purple-800 font-medium">Modo oscuro</h4>
                <p className="text-sm text-purple-600">Cambiar tema de la aplicación</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            <Separator className="bg-purple-200" />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-purple-800 font-medium">Actualizaciones automáticas</h4>
                <p className="text-sm text-purple-600">Mantener la app actualizada</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">Zona de Peligro</CardTitle>
            <CardDescription className="text-purple-600">Acciones irreversibles para tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              Eliminar Cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 