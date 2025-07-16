import React, { useState, useCallback } from 'react';
import type { Agent, SWOTAnalysis } from '../types';
import { generateSwotAnalysis } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface SwotAnalyzerToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EXAMPLE_DATA = {
    description: "Uma cafeteria de especialidade focada em produtos locais e sustentáveis, localizada em um bairro universitário com grande fluxo de estudantes e professores. A concorrência é formada por grandes redes de fast-food e uma outra cafeteria independente a 3 quarteirões de distância.",
};

const SkeletonResult = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded-md w-3/4 mb-6 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl h-full space-y-3">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-5/6"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-4/6"></div>
                </div>
            ))}
        </div>
    </div>
);


const SwotAnalyzerTool: React.FC<SwotAnalyzerToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<SWOTAnalysis | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) {
            addToast("Por favor, descreva o negócio ou produto a ser analisado.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setAnalysis(null);
        addToast("Gerando análise SWOT... Isso pode levar um momento.", ToastType.INFO);

        try {
            const result = await generateSwotAnalysis(description, agent.systemInstruction);
            setAnalysis(result);
            addToast("Análise SWOT gerada com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao gerar a análise SWOT.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [description, agent.systemInstruction, addToast]);
    
    const handleUseExample = () => {
        setDescription(EXAMPLE_DATA.description);
        addToast("Dados de exemplo carregados!", ToastType.INFO);
    };

    const handleExport = () => {
        if (!analysis) return;
        const content = JSON.stringify(analysis, null, 2);
        const filename = `swot_analysis_${new Date().toISOString()}.json`;
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
        addToast(`Análise exportada como JSON`, ToastType.SUCCESS);
    };

    const Quadrant: React.FC<{ title: string; items: string[]; colorClass: string; icon: React.ReactNode; }> = ({ title, items, colorClass, icon }) => (
        <div className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl h-full">
            <h3 className={`flex items-center text-lg font-semibold ${colorClass} mb-3 border-b pb-2 border-black/10 dark:border-white/10`}>
                {icon}
                <span className="ml-2">{title}</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {(items || []).map((item, i) => (
                    <li key={i} className="flex items-start">
                        <span className={`mr-2 mt-1 flex-shrink-0 ${colorClass}`}>▪</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );

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
                {analysis && (
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
                                    <label htmlFor="description" className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Negócio, Produto ou Ideia
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
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: Uma cafeteria de especialidade focada em produtos locais e sustentáveis, localizada em um bairro universitário."
                                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                    rows={8}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Analisando...' : 'Gerar Análise SWOT'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12" aria-live="polite">
                        {isLoading && <SkeletonResult />}
                        {!isLoading && analysis && (
                            <div className="animate-fade-in-up">
                                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Resultado da Análise SWOT</h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="animate-stagger-in" style={{ animationDelay: '100ms' }}>
                                        <Quadrant title="Forças" items={analysis.strengths || []} colorClass="text-green-600 dark:text-green-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                                    </div>
                                    <div className="animate-stagger-in" style={{ animationDelay: '200ms' }}>
                                        <Quadrant title="Fraquezas" items={analysis.weaknesses || []} colorClass="text-red-600 dark:text-red-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>} />
                                    </div>
                                    <div className="animate-stagger-in" style={{ animationDelay: '300ms' }}>
                                        <Quadrant title="Oportunidades" items={analysis.opportunities || []} colorClass="text-blue-600 dark:text-blue-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
                                    </div>
                                    <div className="animate-stagger-in" style={{ animationDelay: '400ms' }}>
                                        <Quadrant title="Ameaças" items={analysis.threats || []} colorClass="text-yellow-600 dark:text-yellow-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                                    </div>
                                 </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwotAnalyzerTool;
