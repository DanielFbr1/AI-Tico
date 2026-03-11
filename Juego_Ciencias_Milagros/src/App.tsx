import { useState } from 'react';
import { Layers, ListTree } from 'lucide-react';
import DichotomousKey from './games/DichotomousKey';
import TrophicPyramid from './games/TrophicPyramid';
import ChatBuilder from './games/ChatBuilder';

function App() {
  const [activeGame, setActiveGame] = useState<'menu' | 'dicotomic' | 'trophic'>('menu');
  const [showBuilder, setShowBuilder] = useState(false);

  if (activeGame === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-3xl filter"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-300/20 rounded-full blur-3xl filter"></div>
        </div>

        <header className="text-center mb-16 z-10">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-4 font-patrick tracking-widest drop-shadow-sm filter drop-shadow-md">
            Exploradores de Milagros
          </h1>
          <p className="text-2xl md:text-3xl text-slate-700 font-medium opacity-90">
            ¡Descubre la fauna y flora de nuestro colegio!
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl z-10">
          {/* Tarjeta Claves Dicotómicas */}
          <button
            onClick={() => setActiveGame('dicotomic')}
            className="group relative flex flex-col items-center p-10 bg-white/70 backdrop-blur-xl hover:bg-gradient-to-br hover:from-white hover:to-emerald-50 border-2 border-white/60 hover:border-emerald-300 transition-all duration-300 transform hover:-translate-y-3 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.3)] rounded-[2.5rem] justify-center min-h-[300px] shadow-xl"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-300 rounded-full flex items-center justify-center text-emerald-700 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
              <ListTree size={56} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-bold tracking-wide text-slate-800 font-patrick group-hover:text-emerald-700 transition-colors">Clave dicotómica</h2>
          </button>

          {/* Tarjeta Cadenas Tróficas */}
          <button
            onClick={() => setActiveGame('trophic')}
            className="group relative flex flex-col items-center p-10 bg-white/70 backdrop-blur-xl hover:bg-gradient-to-br hover:from-white hover:to-orange-50 border-2 border-white/60 hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-3 hover:shadow-[0_20px_50px_-12px_rgba(249,115,22,0.3)] rounded-[2.5rem] justify-center min-h-[300px] shadow-xl"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-300 rounded-full flex items-center justify-center text-orange-700 mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 shadow-inner">
              <Layers size={56} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-bold tracking-wide text-slate-800 font-patrick group-hover:text-orange-700 transition-colors">Pirámide Trófica</h2>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col bg-slate-50">
      <header className="relative flex flex-col sm:flex-row justify-between items-center bg-white/90 backdrop-blur-md p-4 px-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 sm:mb-8 sticky top-4 z-40 min-h-[80px] gap-4 sm:gap-0">
        <div className="flex w-full sm:w-1/3 justify-center sm:justify-start z-10">
          <button
            onClick={() => { setActiveGame('menu'); setShowBuilder(false); }}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>←</span> Volver al Menú
          </button>
        </div>

        {/* Centered Title (Absolute on desktop for perfect center, inline on mobile) */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max text-center pointer-events-none z-0">
          <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-patrick tracking-wide drop-shadow-sm">
            {activeGame === 'dicotomic' && 'Claves Dicotómicas'}
            {activeGame === 'trophic' && 'Pirámide Trófica'}
          </h2>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden w-full text-center z-10">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-patrick tracking-wide">
            {activeGame === 'dicotomic' && 'Claves Dicotómicas'}
            {activeGame === 'trophic' && 'Pirámide Trófica'}
          </h2>
        </div>

        <div className="flex w-full sm:w-1/3 justify-center sm:justify-end z-10">
          <div className="relative">
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className={`transition-all duration-300 rounded-full px-5 py-2.5 font-bold flex items-center gap-2 shadow-md hover:shadow-lg border-2 text-sm ${showBuilder ? 'bg-purple-600 text-white border-purple-700' : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200'}`}
            >
              <span className="text-lg">🤖</span> <span className="inline">Creador IA</span>
            </button>

            {showBuilder && (
              <div className="absolute right-0 top-14 w-[350px] md:w-[450px] max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-white/95 backdrop-blur-3xl p-5 rounded-3xl shadow-[0_20px_60px_-15px_rgba(147,51,234,0.4)] border-2 border-purple-200 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right">
                <button onClick={() => setShowBuilder(false)} className="sticky top-0 z-10 text-slate-400 hover:text-slate-700 font-bold mb-3 self-end text-sm transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full leading-none">
                  ✕
                </button>
                <ChatBuilder
                  activeGame={activeGame}
                  title={activeGame === 'dicotomic' ? "Generador de Claves" : "Generador de Cadenas"}
                  description={activeGame === 'dicotomic' ? "Genera de dos formas: 1) Dame solo la lista de especies (máx 10). 2) Dame las especies y las preguntas exactas que quieres usar." : "Genera de dos formas: 1) Dime el ecosistema (ej: Sabana). 2) Dame una lista de 5 especies concretas para armarla."}
                  placeholder="Escribe tus instrucciones para la IA aquí..."
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto relative">
        {activeGame === 'dicotomic' && <DichotomousKey />}
        {activeGame === 'trophic' && <TrophicPyramid />}
      </main>
    </div>
  );
}

export default App;
