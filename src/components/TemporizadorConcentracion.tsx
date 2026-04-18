import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Timer, Check } from 'lucide-react';

export const TemporizadorConcentracion = ({ userId = 'default' }: { userId?: string }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(`tico_timer_seconds_${userId}`);
    return saved ? parseInt(saved) : 300;
  });
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(() => {
    const saved = localStorage.getItem(`tico_timer_initial_${userId}`);
    return saved ? parseInt(saved) : 300;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Guardar estado localmente para cada alumno
  useEffect(() => {
    localStorage.setItem(`tico_timer_seconds_${userId}`, timeLeft.toString());
    localStorage.setItem(`tico_timer_initial_${userId}`, initialTime.toString());
  }, [timeLeft, initialTime, userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(initialTime);
  }, [initialTime]);

  const adjustTime = (amount: number) => {
    if (isActive) return;
    const newTime = Math.max(60, initialTime + amount);
    setInitialTime(newTime);
    setTimeLeft(newTime);
  };

  const handleEditClick = () => {
    if (isActive) return;
    setIsEditing(true);
    setEditValue(Math.floor(initialTime / 60).toString());
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const saveEdit = () => {
    const mins = parseInt(editValue);
    if (!isNaN(mins) && mins > 0 && mins <= 120) {
      const newSeconds = mins * 60;
      setInitialTime(newSeconds);
      setTimeLeft(newSeconds);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Calcular progreso para la línea de fondo
  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <div className="flex items-center gap-2 bg-[#1e1e24] p-1.5 pr-3 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden group min-w-[200px]">
      
      {/* Fondo de progreso sutil */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-[#8b3dff]/30 transition-all duration-1000 ease-linear pointer-events-none"
        style={{ width: `${100 - progress}%` }}
      ></div>

      {/* Botón Play/Pause Principal */}
      <button
        onClick={toggleTimer}
        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${
          isActive 
            ? 'bg-amber-500 hover:bg-amber-600' 
            : 'bg-[#8b3dff] hover:bg-[#7a2df2]'
        }`}
      >
        {isActive ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
      </button>

      {/* Área Central: Tiempo y Controles */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 px-1">
          {/* BOTÓN RESTAR */}
          <button 
            onClick={() => adjustTime(-60)} 
            disabled={isActive}
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-md transition-all active:scale-90"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* TIEMPO EDITABLE */}
          <div className="flex-1 text-center">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/10 border-none text-white text-center font-black text-lg p-0 focus:ring-0 rounded"
                />
              </div>
            ) : (
              <div 
                onClick={handleEditClick}
                className={`font-black text-xl tracking-tighter tabular-nums leading-none cursor-pointer hover:text-[#8b3dff] transition-colors select-none ${isActive ? 'text-white' : 'text-slate-300'}`}
                title="Haz clic para editar minutos"
              >
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* BOTÓN SUMAR */}
          <button 
            onClick={() => adjustTime(60)} 
            disabled={isActive}
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-md transition-all active:scale-90"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Botón Reset Pequeño */}
      <button
        onClick={resetTimer}
        className="w-8 h-8 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group/reset"
        title="Reiniciar"
      >
        <RotateCcw className="w-4 h-4 text-slate-500 group-hover/reset:text-white transition-transform group-active/reset:rotate-180" />
      </button>

      {/* Indicador de Modo Enfoque */}
      {isActive && (
        <div className="absolute top-0 right-0 p-0.5">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        </div>
      )}
    </div>
  );
};
