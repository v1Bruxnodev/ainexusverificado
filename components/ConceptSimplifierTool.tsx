import React, { useState, useCallback } from 'react';
import type { Agent } from '../types';
import { simplifyConcept } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ConceptSimplifierToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const ConceptSimplifierTool: React.FC<ConceptSimplifierToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [complexText, setComplexText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [simplifiedText, setSimplifiedText] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complexText) {
            addToast("Por favor, insira o texto a ser simplificado.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setSimplifiedText(null);
        addToast("Simplificando o conceito...", ToastType.INFO);

        try {
            const result = await simplifyConcept(complexText, agent.systemInstruction);
            setSimplifiedText(result);
            addToast("Texto simplificado com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao simplificar o texto.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [complexText, agent.systemInstruction, addToast]);

     const handleExport = () => {
        if (!simplifiedText) return;
        const blob = new Blob([simplifiedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conceito_simplificado_${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("Texto exportado como .txt", ToastType.SUCCESS);
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
                 {simplifiedText && (
                     <button
                        onClick={handleExport}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-xs bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/60 dark:hover:bg-gray-600/50 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar TXT
                    </button>
                )}
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="w-full">
                        <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                    {agent.icon}
                                </div>
                                <label htmlFor="complexText" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Texto Complexo
                                </label>
                            </div>
                            <div>
                                <textarea
                                    id="complexText"
                                    value={complexText}
                                    onChange={(e) => setComplexText(e.target.value)}
                                    placeholder="Cole aqui o texto, jargão ou conceito que você deseja simplificar..."
                                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                    rows={12}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Simplificando...' : 'Simplificar Texto'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12">
                        {isLoading && !simplifiedText && (
                             <div className="flex items-center justify-center h-96 bg-white/60 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 animate-pulse">
                                <p className="text-gray-500 dark:text-gray-400 italic">A IA está decifrando o conceito...</p>
                            </div>
                        )}
                        {simplifiedText && (
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl animate-fade-in-up">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Explicação Simplificada</h2>
                                </div>
                                <div className="prose max-w-none text-gray-800 dark:text-gray-200">
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw]}
                                        remarkPlugins={[remarkGfm]}
                                    >
                                        {simplifiedText}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConceptSimplifierTool;