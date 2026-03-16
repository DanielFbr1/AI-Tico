import { useState } from 'react';
import { X, Key, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface ModalUnirseProyectoProfesorProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function ModalUnirseProyectoProfesor({ onClose, onSuccess }: ModalUnirseProyectoProfesorProps) {
    const [codigo, setCodigo] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigo.trim() || !user) return;

        setBuscando(true);
        setError(null);
        setResultado(null);

        try {
            // 1. Buscar el proyecto por código
            const { data: proyecto, error: pError } = await supabase
                .from('proyectos')
                .select('id, nombre, descripcion, created_by, clase')
                .eq('codigo_sala', codigo.trim().toUpperCase())
                .maybeSingle();

            if (pError || !proyecto) {
                setError('No se ha encontrado ningún proyecto con ese código. Verifica que sea correcto.');
                return;
            }

            // 2. Verificar si ya es el dueño
            if (proyecto.created_by === user.id) {
                setError('Ya eres el propietario de este proyecto.');
                return;
            }

            // 3. Verificar si ya colabora
            const { data: colaborador } = await supabase
                .from('proyecto_colaboradores')
                .select('id')
                .eq('proyecto_id', proyecto.id)
                .eq('profesor_id', user.id)
                .maybeSingle();

            if (colaborador) {
                setError('Ya eres colaborador de este proyecto.');
                return;
            }

            // 4. Verificar si tiene petición pendiente
            const { data: peticion } = await supabase
                .from('peticiones_colaboracion')
                .select('id, estado')
                .eq('proyecto_id', proyecto.id)
                .eq('profesor_solicitante_id', user.id)
                .eq('estado', 'pendiente')
                .maybeSingle();

            if (peticion) {
                setError('Ya tienes una petición pendiente para este proyecto.');
                return;
            }

            setResultado(proyecto);
        } catch (err) {
            console.error('Error al buscar proyecto:', err);
            setError('Hubo un error al buscar el proyecto.');
        } finally {
            setBuscando(false);
        }
    };

    const handleSolicitar = async () => {
        if (!resultado || !user) return;

        setBuscando(true);
        try {
            const { error: sError } = await supabase
                .from('peticiones_colaboracion')
                .insert([{
                    proyecto_id: resultado.id,
                    profesor_solicitante_id: user.id,
                    profesor_propietario_id: resultado.created_by,
                    estado: 'pendiente'
                }]);

            if (sError) throw sError;

            toast.success(`Petición enviada para el proyecto: ${resultado.nombre}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error al enviar petición:', err);
            toast.error('No se pudo enviar la petición.');
        } finally {
            setBuscando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -z-10 opacity-50"></div>
                
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4">
                        <Key className="w-7 h-7" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Unirse a Proyecto</h2>
                    <p className="text-slate-500 font-medium mt-1">Introduce el código del proyecto de otro docente.</p>
                </div>

                {!resultado ? (
                    <form onSubmit={handleBuscar} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Código de Clase</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="EJ: TICO-1234"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xl tracking-widest placeholder:text-slate-200"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-rose-600 font-bold leading-tight">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={buscando || !codigo.trim()}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {buscando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            Buscar Proyecto
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-2">Proyecto Encontrado</label>
                            <h3 className="text-2xl font-black text-blue-900 tracking-tight mb-2">{resultado.nombre}</h3>
                            <div className="flex items-center gap-2 text-blue-600/70 font-bold text-sm bg-white/50 w-fit px-3 py-1 rounded-full border border-blue-100 mb-4">
                                <CheckCircle2 className="w-4 h-4" />
                                {resultado.clase || 'Sin clase asignada'}
                            </div>
                            <p className="text-blue-800/60 text-sm line-clamp-3 leading-relaxed">{resultado.descripcion}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setResultado(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all shadow-sm"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleSolicitar}
                                disabled={buscando}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                            >
                                {buscando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                                Solicitar Unirse
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
