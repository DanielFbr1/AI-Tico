import { Brain, MessageSquare, TrendingUp, PieChart, Lightbulb, Cog, Users as UsersIcon, Sparkles, Plus } from 'lucide-react';
import { useState } from 'react';
import { Grupo } from '../types';
import { MentorChat } from './MentorChat';

interface InteraccionesIAProps {
  grupos: Grupo[];
  onSelectGrupo: (grupo: Grupo) => void;
}

interface TipoInteraccion {
  tipo: string;
  color: string;
  icon: any;
  total: number;
  descripcion: string;
  ejemplo: string;
}

export function InteraccionesIA({ grupos, onSelectGrupo }: InteraccionesIAProps) {
  const [grupoChat, setGrupoChat] = useState<Grupo | null>(null);

  if (grupos.length === 0) {
    return null; // El estado vacío se maneja en el Dashboard
  }

  const totalInteracciones = grupos.reduce((sum, g) => sum + g.interacciones_ia, 0);

  const tiposInteraccion: TipoInteraccion[] = [
    {
      tipo: 'Metacognitivas',
      color: 'border-purple-200 bg-purple-50 text-purple-700',
      icon: Brain,
      total: Math.floor(totalInteracciones * 0.35),
      descripcion: 'Preguntas sobre el proceso de pensamiento y aprendizaje',
      ejemplo: '¿Por qué creéis que esta estrategia funcionará mejor?'
    },
    {
      tipo: 'Técnicas',
      color: 'border-blue-200 bg-blue-50 text-blue-700',
      icon: Cog,
      total: Math.floor(totalInteracciones * 0.25),
      descripcion: 'Consultas sobre herramientas y procedimientos',
      ejemplo: '¿Qué herramientas podríais investigar para esta tarea?'
    },
    {
      tipo: 'Organizativas',
      color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: UsersIcon,
      total: Math.floor(totalInteracciones * 0.20),
      descripcion: 'Preguntas sobre coordinación y gestión del equipo',
      ejemplo: '¿Cómo podéis distribuir las tareas según las fortalezas?'
    },
    {
      tipo: 'Creativas',
      color: 'border-orange-200 bg-orange-50 text-orange-700',
      icon: Lightbulb,
      total: Math.floor(totalInteracciones * 0.20),
      descripcion: 'Preguntas que estimulan el pensamiento creativo',
      ejemplo: '¿Qué os sorprendería ver en un proyecto como este?'
    }
  ];

  const gruposOrdenados = [...grupos].sort((a, b) => b.interacciones_ia - a.interacciones_ia);
  const maxInteracciones = Math.max(...grupos.map(g => g.interacciones_ia));

  return (
    <>
      {grupoChat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">

                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Chat con Mentor IA - <span className="text-indigo-600">{grupoChat.nombre}</span></h3>
              </div>
              <button
                onClick={() => setGrupoChat(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Plus className="rotate-45 w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MentorChat grupo={grupoChat} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-10">
        {/* Tipos de interacciones (Mover arriba como en la imagen si es necesario, 
            pero la imagen muestra métricas arriba y tipos abajo) */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
              <PieChart className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Tipos de preguntas (metodología socrática)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiposInteraccion.map((tipo) => {
              const Icon = tipo.icon;
              return (
                <div key={tipo.tipo} className={`border-2 rounded-2xl p-6 ${tipo.color} transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-xl">{tipo.tipo}</div>
                        <div className="text-sm opacity-80 font-medium">{tipo.descripcion}</div>
                      </div>
                    </div>
                    <div className="text-4xl font-black opacity-80">{tipo.total}</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className="flex gap-2">
                      <span className="font-bold text-sm whitespace-nowrap">Ejemplo:</span>
                      <span className="text-sm italic opacity-90 leading-relaxed font-medium">"{tipo.ejemplo}"</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ranking de grupos por interacciones */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Actividad por grupo</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {gruposOrdenados.map((grupo, index) => (
              <div
                key={grupo.id}
                className="flex items-center gap-4 p-5 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 leading-tight">{grupo.nombre}</div>
                </div>
                <div className="flex-1 max-w-xs hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000"
                        style={{ width: `${(grupo.interacciones_ia / maxInteracciones) * 100}%` }}
                      />
                    </div>
                    <div className="w-10 text-right font-bold text-slate-900 text-sm">{grupo.interacciones_ia}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGrupoChat(grupo)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden xs:inline">Chat IA</span>
                  </button>
                  <button
                    onClick={() => onSelectGrupo(grupo)}
                    className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-sm font-bold"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}