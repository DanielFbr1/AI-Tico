import { useState } from 'react';

interface ChatBuilderProps {
    title: string;
    description: string;
    placeholder: string;
    activeGame: 'dicotomic' | 'trophic';
}

export default function ChatBuilder({ title, description, placeholder, activeGame }: ChatBuilderProps) {
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
        { sender: 'ai', text: `¡Hola, profe! 😊 ${description}` }
    ]);
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');

        // Añadir mensaje de carga
        setMessages(prev => [...prev, {
            sender: 'ai',
            text: 'Analizando la información y construyendo el árbol... 🌳'
        }]);

        try {
            const apiEndpoint = activeGame === 'dicotomic' ? '/api/generate-tree' : '/api/generate-pyramid';

            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMsg })
            });

            if (!res.ok) throw new Error('Error en la API');

            const data = await res.json();

            if (activeGame === 'dicotomic') {
                const newLevel = {
                    id: Date.now().toString(),
                    label: data.title || "Clave Generada por IA",
                    species: data.species
                };
                const saved = localStorage.getItem('tico_custom_trees');
                const currentTrees = saved ? JSON.parse(saved) : [];
                localStorage.setItem('tico_custom_trees', JSON.stringify([...currentTrees, newLevel]));
                window.dispatchEvent(new Event('tico_tree_added'));
            } else {
                const newPyramid = {
                    id: Date.now().toString(),
                    label: data.title || "Cadena Generada por IA",
                    emoji: data.emoji || "🌍",
                    colorClass: data.colorClass || "bg-indigo-500",
                    species: data.species
                };
                const saved = localStorage.getItem('tico_custom_pyramids');
                const currentPys = saved ? JSON.parse(saved) : [];
                localStorage.setItem('tico_custom_pyramids', JSON.stringify([...currentPys, newPyramid]));
                window.dispatchEvent(new Event('tico_pyramid_added'));
            }

            setMessages(prev => [
                ...prev.slice(0, -1), // Quitar mensaje de carga
                {
                    sender: 'ai',
                    text: `¡Listo! He creado el botón "${data.title}" en el menú principal. Ya puedes jugar con él. ✨\n\n(Recarga la página si no lo ves).`
                }
            ]);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    sender: 'ai',
                    text: '¡UPS! ❌ Hubo un error al generar el contenido (¿configuraste GOOGLE_GENERATIVE_AI_API_KEY?). Revisa la consola.'
                }
            ]);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-purple-600 text-white p-4 flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: "'Patrick Hand', cursive" }}>{title}</h2>
                    <p className="text-purple-200 text-sm">Crea tu propio juego interactivo desde el chat</p>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'user' ? 'bg-purple-100 text-purple-900 rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'}`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={placeholder}
                    className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all shadow-inner"
                    rows={2}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="bg-purple-600 text-white px-6 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
