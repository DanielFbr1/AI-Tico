import { X } from 'lucide-react';
import { Grupo, Criterio } from '../types';
import { EvaluacionGrupalContent } from './EvaluacionGrupalContent';

interface ModalEvaluacionGrupalProps {
    grupo: Grupo;
    onClose: () => void;
    onSave?: () => void;
    rubricaProyecto?: Criterio[];
    onRubricChange?: (newRubric: Criterio[]) => void;
}

export function ModalEvaluacionGrupal({ grupo, onClose, onSave, rubricaProyecto, onRubricChange }: ModalEvaluacionGrupalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-0 relative">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all absolute top-6 right-6 z-[70] bg-white/50 backdrop-blur-sm shadow-sm border border-gray-100">
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                {/* Render the extracted content */}
                {/* Pass isModal=true to adjust internal styling if needed */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <EvaluacionGrupalContent
                        grupo={grupo}
                        onSave={onSave}
                        onCancel={onClose}
                        rubricaProyecto={rubricaProyecto}
                        onRubricChange={onRubricChange}
                        isModal={true}
                    />
                </div>
            </div>
        </div>
    );
}
