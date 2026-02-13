# v0.dev Export - Part 1: Core application logic and pages

This artifact contains the main application entry points, core pages, and service layer.

## File List
- `src/App.tsx`
- `src/main.tsx`
- `src/pages/DashboardDocente.tsx`
- `src/pages/DashboardAlumno.tsx`
- `src/pages/LandingPage.tsx`
- `src/services/ai.ts`
- `src/context/AuthContext.tsx`
- `src/lib/supabase.ts`
- `src/lib/utils.ts`
- `src/types/index.ts`

---

### src/App.tsx
```tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardDocente } from './pages/DashboardDocente';
import { DashboardAlumno } from './pages/DashboardAlumno';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role: 'docente' | 'alumno' }) {
  const { user, role: userRole, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user || userRole !== role) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/docente/*" 
            element={
              <ProtectedRoute role="docente">
                <DashboardDocente />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alumno/*" 
            element={
              <ProtectedRoute role="alumno">
                <DashboardAlumno />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
```

---

### src/main.tsx
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

### src/services/ai.ts
```ts
import { Grupo, Proyecto } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function generarRespuestaIA(
  pregunta: string, 
  departamento: string, 
  proyecto: string,
  historial: { role: 'user' | 'assistant', content: string }[] = []
) {
  if (!GROQ_API_KEY) {
    throw new Error('La API Key de Groq no está configurada');
  }

  const systemPrompt = `Eres un Mentor IA experto en Proyectos ABP para estudiantes de Educación Primaria (10-12 años).
    Vuestro proyecto actual es: ${proyecto}.
    Tú eres el mentor del departamento de: ${departamento}.
    
    Tus reglas clave:
    1. HABLA SIEMPRE EN ESPAÑOL.
    2. No resuelvas el trabajo por ellos, guíales con preguntas y consejos.
    3. Usa un lenguaje motivador, amable y adaptado a su edad.
    4. El objetivo es que desarrollen el pensamiento crítico.
    5. Si hacen una pregunta técnica, explícales el concepto con un ejemplo.
    
    Analiza siempre su pregunta y clasifícala mentalmente en una de estas categorías: Técnica, Creativa, Organizativa o Metacognitiva.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...historial,
          { role: 'user', content: pregunta }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al conectar con la IA');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error IA:', error);
    throw error;
  }
}
```

---

### src/context/AuthContext.tsx
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: 'docente' | 'alumno' | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signInAlumno: (nombre: string, codigo: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'docente' | 'alumno' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata.role || 'docente');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata.role || 'docente');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({ email, password: pass });
  };

  const signInAlumno = async (nombre: string, codigo: string) => {
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyectos')
      .select('*')
      .eq('codigo_sala', codigo.toUpperCase())
      .single();

    if (proyectoError || !proyecto) {
      return { error: new Error('Código de sala no válido') };
    }

    const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          nombre: nombre,
          role: 'alumno',
          proyecto_id: proyecto.id
        }
      }
    });

    return { data: authData, error: authError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signInAlumno, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

### src/lib/supabase.ts
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### src/lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### src/types/index.ts
```ts
export type ProyectoEstado = 'En preparación' | 'En curso' | 'Finalizado';

export interface Fase {
  id: string;
  nombre: string;
  estado: 'completada' | 'actual' | 'pendiente';
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  clase: string;
  estado: ProyectoEstado;
  codigo_sala: string;
  docente_id: string;
  fases: Fase[];
  grupos: Grupo[];
}

export interface Grupo {
  id: string;
  proyecto_id: string;
  nombre: string;
  departamento: string;
  miembros: string[];
  progreso: number;
  estado: 'Bloqueado' | 'En progreso' | 'Completado';
  interacciones_ia: number;
}

export interface Mensaje {
  id: string;
  grupo_id: string;
  remitente: string;
  contenido: string;
  tipo: 'alumno' | 'ia';
  categoria?: 'Técnica' | 'Creativa' | 'Organizativa' | 'Metacognitiva';
  created_at: string;
}
```
