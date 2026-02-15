import React from 'react';
import { TicoGameWidget } from '../../components/TicoGame/TicoGameWidget';

interface TicoFullScreenPageProps {
    onBack: () => void;
    projectId?: string | number;
}

export const TicoFullScreenPage: React.FC<TicoFullScreenPageProps> = ({ onBack, projectId }) => {
    return (
        <div className="fixed inset-0 bg-slate-50 z-[100] overflow-hidden">
            {/* Sin header arriba, solo el Widget a pantalla completa */}
            <TicoGameWidget projectId={projectId} onBack={onBack} />
        </div>
    );
};
