'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabaseBrowser } from '@/app/lib/supabase-browser';

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = supabaseBrowser();
  const router = useRouter();

  const toggleMode = () =>
    setView(view === 'login' ? 'signup' : 'login');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;
        
        // ✅ Success: redirect to dashboard
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        
        // ✅ Success: redirect to dashboard after signup
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
      <Card className="w-full max-w-md border-purple-200 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image src="/pulpoo.png" alt="Logo" width={60} height={60} className="rounded-lg" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-purple-800">
              {view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-purple-600">
              {view === 'login'
                ? 'Ingresa tus credenciales para acceder'
                : 'Completa los datos para registrarte'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {view === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-700">
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-700">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-700">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
              {loading ? 'Procesando...' : view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-purple-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-purple-500">O continúa con</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${location.origin}/dashboard` },
              })
            }
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              {/* Google icon paths */}
            </svg>
            Continuar con Google
          </Button>

          <div className="text-center text-sm">
            <span className="text-purple-600">
              {view === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            </span>{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-purple-700 hover:text-purple-800 font-medium underline"
            >
              {view === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
