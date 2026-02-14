import { BookOpen, Target, Heart, Search, Plus, ArrowRight, Brain } from 'lucide-react';

interface TipoProyecto {
  id: string;
  nombre: string;
  descripcion: string;
  icon: any;
  color: string;
  departamentos: string[];
  ejemplo: string;
}

interface SeleccionProyectoProps {
  onSeleccionar: (proyectoId: string) => void;
}

const proyectosDisponibles: TipoProyecto[] = [
  {
    id: 'abp-proyectos',
    nombre: 'Aprendizaje Basado en Proyectos',
    descripcion: 'Los alumnos desarrollan un producto final para resolver un reto o pregunta compleja.',
    icon: BookOpen,
    color: 'from-blue-600 to-indigo-600',
    departamentos: ['Investigación', 'Planificación', 'Ejecución', 'Comunicación', 'Evaluación'],
    ejemplo: 'Crear un refugio de biodiversidad en el patio del colegio.'
  },
  {
    id: 'abp-problemas',
    nombre: 'Aprendizaje Basado en Problemas',
    descripcion: 'Los alumnos adquieren conocimientos resolviendo un problema abierto y real.',
    icon: Brain,
    color: 'from-purple-600 to-pink-600',
    departamentos: ['Análisis', 'Hipótesis', 'Investigación', 'Propuesta', 'Reflexión'],
    ejemplo: '¿Cómo podríamos reducir el ruido en los pasillos de forma creativa?'
  },
  {
    id: 'aprendizaje-servicio',
    nombre: 'Aprendizaje Servicio (ApS)',
    descripcion: 'Los alumnos aprenden mientras realizan un servicio real a su comunidad.',
    icon: Heart,
    color: 'from-red-600 to-orange-600',
    departamentos: ['Detección', 'Planificación', 'Acción Social', 'Evaluación', 'Difusión'],
    ejemplo: 'Organizar una campaña de donación de libros para un hospital local.'
  },
  {
    id: 'indagacion',
    nombre: 'Indagación',
    descripcion: 'Los alumnos exploran, preguntan y descubren conceptos a través de la investigación activa.',
    icon: Search,
    color: 'from-green-600 to-teal-600',
    departamentos: ['Pregunta', 'Exploración', 'Análisis', 'Descubrimiento', 'Reflexión'],
    ejemplo: 'Investigar cómo viven las hormigas o por qué los imanes se atraen.'
  },
  {
    id: 'proyecto-personalizado',
    nombre: 'Proyecto Personalizado',
    descripcion: 'Define tu propia metodología y departamentos desde cero.',
    icon: Plus,
    color: 'from-slate-600 to-slate-800',
    departamentos: [],
    ejemplo: 'Cualquier otro formato que encaje con tu visión educativa.'
  }
];

export function SeleccionProyecto({ onSeleccionar }: SeleccionProyectoProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
              <BookOpen className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Elige la Metodología</h1>
          <p className="text-2xl text-white font-medium drop-shadow-md">
            Selecciona cómo quieres trabajar con tu clase
          </p>
        </div>

        {/* Grid de proyectos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {proyectosDisponibles.map((proyecto) => {
            const Icon = proyecto.icon;
            return (
              <button
                key={proyecto.id}
                onClick={() => onSeleccionar(proyecto.id)}
                className="group relative bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 text-left overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${proyecto.color} opacity-10 rounded-bl-full`}></div>

                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${proyecto.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-9 h-9 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{proyecto.nombre}</h2>
                  <p className="text-gray-700 mb-4 font-medium">{proyecto.descripcion}</p>

                  {proyecto.departamentos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Departamentos:</p>
                      <div className="flex flex-wrap gap-2">
                        {proyecto.departamentos.map((dept, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-xl p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Ejemplo:</span> {proyecto.ejemplo}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all">
                    <span>Seleccionar proyecto</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-white text-sm font-medium drop-shadow-md">
            💡 Puedes crear múltiples proyectos y gestionarlos de forma independiente
          </p>
        </div>
      </div>
    </div>
  );
}
