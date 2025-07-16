import React, { useState, useCallback } from 'react';
import type { Agent, MarketingPersona } from '../types';
import { generatePersonas } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';
import { PersonaIcon } from '../constants';

interface PersonaGeneratorToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EXAMPLE_DATA = {
    productDescription: "Um aplicativo de meditação guiada para iniciantes e profissionais ocupados, com sessões curtas de 5 a 10 minutos, trilhas sonoras personalizáveis e acompanhamento de progresso. Foco em reduzir a ansiedade e melhorar o foco.",
};

const PersonaCardSkeleton = () => (
    <div className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700/50 flex-shrink-0"></div>
            <div className="flex-1">
                <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            </div>
        </div>
        <div className="mt-4 space-y-4">
            <div className="space-y-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-5/6"></div>
            </div>
            <div className="space-y-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            </div>
        </div>
    </div>
);

const PersonaGeneratorTool: React.FC<PersonaGeneratorToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [productDescription, setProductDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [personas, setPersonas] = useState<MarketingPersona[]>([]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productDescription) {
            addToast("Por favor, descreva seu produto ou serviço.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setPersonas([]);
        addToast("Gerando personas...", ToastType.INFO);

        try {
            const personaDataResult = await generatePersonas(productDescription, agent.systemInstruction);
            setPersonas(personaDataResult.personas || []);
            addToast("Personas geradas com sucesso!", ToastType.SUCCESS);

        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao gerar as personas.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [productDescription, agent.systemInstruction, addToast]);
    
    const handleUseExample = () => {
        setProductDescription(EXAMPLE_DATA.productDescription);
        addToast("Dados de exemplo carregados!", ToastType.INFO);
    };

     const handleExport = () => {
        if (!personas || personas.length === 0) return;
        const content = JSON.stringify({ personas: personas }, null, 2);
        const filename = `marketing_personas_${new Date().toISOString()}.json`;
        const mimeType = 'application/json';
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Personas exportadas como JSON`, ToastType.SUCCESS);
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-black/10">
            <header className="p-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={onToggleSidebar} className="p-1 text-gray-600 dark:text-gray-400 rounded-md hover:bg-black/10 dark:hover:bg-white/10 md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="text-teal-500 dark:text-teal-400 hidden sm:block">{agent.icon}</div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{agent.name}</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
                    </div>
                </div>
                {personas.length > 0 && (
                     <button
                        onClick={handleExport}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-xs bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/60 dark:hover:bg-gray-600/50 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar JSON
                    </button>
                )}
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="w-full">
                        <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                     <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                        {agent.icon}
                                    </div>
                                    <label htmlFor="productDescription" className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Descrição do Produto ou Serviço
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUseExample}
                                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors text-teal-700 dark:text-teal-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a4.125 4.125 0 000-8.25 4.125 4.125 0 000 8.25z" /></svg>
                                    Usar Exemplo
                                </button>
                            </div>
                            <div>
                                <textarea
                                    id="productDescription"
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    placeholder="Ex: Um app de meditação guiada para iniciantes com sessões curtas de 5 a 10 minutos."
                                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                    rows={8}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Gerando...' : 'Gerar Personas'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12" aria-live="polite">
                        {(isLoading || personas.length > 0) && (
                            <div className="space-y-6">
                                {isLoading && personas.length === 0 && Array.from({ length: 3 }).map((_, i) => <PersonaCardSkeleton key={i} />)}
                                {personas.map((persona, i) => (
                                     <div key={i} className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-5 rounded-xl animate-fade-in-up">
                                        <div className="flex flex-col sm:flex-row items-center gap-5">
                                            <div className="w-28 h-28 rounded-full bg-teal-500/10 border-2 border-teal-500/20 flex-shrink-0 flex items-center justify-center text-teal-500">
                                                <div className="transform scale-[2]">
                                                    <PersonaIcon />
                                                </div>
                                            </div>
                                            <div className="text-center sm:text-left">
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{persona.name || 'Nome Indisponível'}</h2>
                                                <p className="text-md text-gray-600 dark:text-gray-400">{persona.demographics || ''}</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                            <div className="bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg">
                                                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Objetivos</h4>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                    {(persona.goals || []).map((goal, j) => <li key={j}>{goal}</li>)}
                                                </ul>
                                            </div>
                                            <div className="bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg">
                                                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Frustrações</h4>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                    {(persona.frustrations || []).map((frustration, j) => <li key={j}>{frustration}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                         <div className="mt-5 bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg">
                                            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Jornada do Usuário (Resumo)</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{persona.userJourney || 'Jornada não descrita.'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonaGeneratorTool;