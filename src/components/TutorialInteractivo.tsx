import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface PasoTutorial {
  id: string;
  titulo: string;
  descripcion: string;
  targetSelector?: string;
  posicion?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialInteractivoProps {
  pasos: PasoTutorial[];
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (index: number) => void;
}

export function TutorialInteractivo({ pasos, onComplete, onSkip, onStepChange }: TutorialInteractivoProps) {
  const [pasoActual, setPasoActual] = useState(0);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const paso = pasos[pasoActual];
  const esUltimoPaso = pasoActual === pasos.length - 1;

  useEffect(() => {
    // Notificar cambio de paso al montarse o cambiar pasoActual
    if (onStepChange) {
      onStepChange(pasoActual);
    }
  }, [pasoActual, onStepChange]);

  useEffect(() => {
    const updatePosition = () => {
      if (paso.targetSelector) {
        const element = document.querySelector(paso.targetSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect); // Guardamos la posición exacta del elemento

          // Calcular posición del tooltip
          let top = rect.top;
          let left = rect.left;

          switch (paso.posicion) {
            case 'bottom':
              top = rect.bottom + 20;
              left = rect.left + rect.width / 2;
              break;
            case 'top':
              top = rect.top - 20;
              left = rect.left + rect.width / 2;
              break;
            case 'right':
              top = rect.top + rect.height / 2;
              left = rect.right + 20;
              break;
            case 'left':
              top = rect.top + rect.height / 2;
              left = rect.left - 20;
              break;
            default:
              top = window.innerHeight / 2;
              left = window.innerWidth / 2;
          }
          // Clamp values to prevent overflow
          const tooltipWidth = Math.min(448, window.innerWidth - 32); // max-w-md is 448px
          left = Math.max(16 + tooltipWidth / 2, Math.min(left, window.innerWidth - 16 - tooltipWidth / 2));
          top = Math.max(16, Math.min(top, window.innerHeight - 16));

          setPosicion({ top, left });
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setTargetRect(null); // Elemento no encontrado
        }
      } else {
        setTargetRect(null); // No hay target en pasos "center"
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [pasoActual, paso]);

  const handleSiguiente = () => {
    if (esUltimoPaso) {
      onComplete();
    } else {
      setPasoActual(pasoActual + 1);
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  return (
    <>
      {/* Overlay transparente (sin desenfoque) para bloquear clicks fuera */}
      <div className="fixed inset-0 bg-transparent z-40" />

      {/* HIGHLIGHT BOX: Elemento independiente por encima de todo */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: '12px',
            boxShadow: `
                0 0 0 4px rgba(59, 130, 246, 0.6), 
                0 0 0 8px rgba(147, 51, 234, 0.3),
                0 0 0 9999px rgba(0, 0, 0, 0.6)
              `,
            animation: 'tutorial-pulse 2s infinite'
          }}
        />
      )}

      {/* Tooltip del tutorial - POSICIONAMIENTO DINÁMICO */}
      <div
        className="fixed z-[60] bg-white rounded-2xl shadow-2xl border-2 border-blue-400 p-5 md:p-6 w-[calc(100vw-2rem)] md:w-auto max-w-md animate-bounce-in transition-all duration-300 mx-auto left-0 right-0 md:mx-0 md:left-auto md:right-auto"
        style={{
          top: window.innerWidth < 768 ? 'auto' : (paso.posicion === 'center' ? '50%' : `${posicion.top}px`),
          bottom: window.innerWidth < 768 ? '120px' : 'auto',
          left: window.innerWidth < 768 ? '50%' : (paso.posicion === 'center' ? '50%' : `${posicion.left}px`),
          transform: window.innerWidth < 768 ? 'translateX(-50%)' : (
            paso.posicion === 'center' ? 'translate(-50%, -50%)' :
              paso.posicion === 'bottom' ? 'translate(-50%, 0)' :
                paso.posicion === 'top' ? 'translate(-50%, -100%)' :
                  paso.posicion === 'right' ? 'translate(0, -50%)' :
                    paso.posicion === 'left' ? 'translate(-100%, -50%)' : 'none'
          ),
          margin: 0
        }}
      >
        {/* Decoración superior */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              {pasoActual + 1}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{paso.titulo}</h3>
              <div className="text-xs text-blue-600 font-medium">
                Paso {pasoActual + 1} de {pasos.length}
              </div>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descripción con fondo */}
        <div className="bg-white bg-opacity-80 rounded-xl p-4 mb-6 border border-blue-100">
          <p className="text-gray-800 text-sm leading-relaxed">{paso.descripcion}</p>
        </div>

        {/* Barra de progreso mejorada */}
        <div className="mb-6">
          <div className="flex gap-1.5">
            {pasos.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${index <= pasoActual
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-md'
                  : 'bg-gray-200'
                  }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-gray-600">
            <span>Inicio</span>
            <span>{Math.round(((pasoActual + 1) / pasos.length) * 100)}% completado</span>
          </div>
        </div>

        {/* Botones de navegación mejorados */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Saltar tutorial
          </button>

          <div className="flex gap-2">
            {pasoActual > 0 && (
              <button
                onClick={handleAnterior}
                className="px-4 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            )}
            <button
              onClick={handleSiguiente}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 text-sm font-bold shadow-lg hover:shadow-xl"
            >
              {esUltimoPaso ? (
                <>
                  <Check className="w-4 h-4" />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Estilos mejorados para el highlight */}
      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 
                        0 0 0 8px rgba(147, 51, 234, 0.3),
                        0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.4), 
                        0 0 0 12px rgba(147, 51, 234, 0.2),
                        0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}