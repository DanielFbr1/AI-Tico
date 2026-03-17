import { FileText, Video, Music, Image as ImageIcon, Eye, Trash2, Rocket } from 'lucide-react';
import { Recurso } from '../types';

interface RecursoCardProps {
    recurso: Recurso;
    onClick: (recurso: Recurso) => void;
    onClickDelete?: (recurso: Recurso) => void;
    onPublish?: (recurso: Recurso) => void;
    className?: string;
}

export function RecursoCard({ recurso, onClick, onClickDelete, onPublish, className = '' }: RecursoCardProps) {
    const getTipoIcon = (tipo: Recurso['tipo']) => {
        switch (tipo) {
            case 'texto': return FileText;
            case 'video': return Video;
            case 'audio': return Music;
            case 'imagen': return ImageIcon;
        }
    };

    const getTipoColor = (tipo: Recurso['tipo']) => {
        switch (tipo) {
            case 'texto': return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'video': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'audio': return 'bg-green-100 text-green-700 border-green-300';
            case 'imagen': return 'bg-orange-100 text-orange-700 border-orange-300';
        }
    };

    const TipoIcon = getTipoIcon(recurso.tipo);

    return (
        <div
            className={`p-5 border border-slate-200 rounded-2xl hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 transition-all cursor-pointer bg-slate-50/50 group ${className}`}
            onClick={() => onClick(recurso)}
        >
            <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${getTipoColor(recurso.tipo)} shrink-0`}>
                    <TipoIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 mb-1 truncate leading-tight group-hover:text-purple-700 transition-colors">{recurso.titulo}</h4>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                            {recurso.grupoNombre.split('–')[1]?.trim() || recurso.grupoNombre}
                        </span>
                        {recurso.publicado === false && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Borrador
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{recurso.descripcion}</p>
                </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {new Date(recurso.fechaSubida || new Date()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all text-xs font-bold uppercase tracking-wider">
                    <Eye className="w-3 h-3" />
                    Ver
                </button>
                <div className="flex items-center gap-2 ml-2">
                    {recurso.publicado === false && onPublish && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPublish(recurso);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all text-xs font-bold uppercase tracking-wider"
                            title="Publicar ahora"
                        >
                            <Rocket className="w-3 h-3" />
                            Publicar
                        </button>
                    )}
                    {onClickDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClickDelete(recurso);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white text-rose-500 border border-slate-200 rounded-lg hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all text-xs font-bold uppercase tracking-wider"
                            title="Borrar recurso"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
