import React, { useState, useCallback } from 'react';
import type { Agent, SentimentAnalysis } from '../types';
import { analyzeSentiment } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface SentimentAnalyzerToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const SentimentAnalyzerTool: React.FC<SentimentAnalyzerToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text) {
            addToast("Por favor, insira um texto para análise.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setAnalysis(null);
        addToast("Analisando sentimento...", ToastType.INFO);
        try {
            const result = await analyzeSentiment(text, agent.systemInstruction);
            setAnalysis(result);
            addToast("Análise de sentimento concluída!", ToastType.SUCCESS);
        } catch (error: any) {
            addToast(error.message || "Ocorreu um erro ao analisar o sentimento.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [text, agent.systemInstruction, addToast]);

    const handleExport = () => {
        if (!analysis) return;
        const content = JSON.stringify(analysis, null, 2);
        const filename = `sentiment_analysis_${new Date().toISOString()}.json`;
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

    const getSentimentStyles = (sentiment?: 'Positivo' | 'Negativo' | 'Neutro') => {
        switch (sentiment) {
            case 'Positivo': return { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' };
            case 'Negativo': return { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' };
            default: return { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-500/20' };
        }
    };
    
    const sentimentStyles = analysis ? getSentimentStyles(analysis.sentiment) : getSentimentStyles('Neutro');

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-black/10">
            <header className="p-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-10">
                 <div className="flex items-center space-x-4">
                    <button onClick={onToggleSidebar} className="p-1 text-gray-600 dark:text-gray-400 rounded-md hover:bg-black/10 dark:hover:bg-white/10 md:hidden"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
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
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                    {agent.icon}
                                </div>
                                <label htmlFor="text" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Texto para Análise
                                </label>
                            </div>
                            <div>
                                <textarea id="text" value={text} onChange={e => setText(e.target.value)} placeholder="Cole aqui um comentário, avaliação, tweet, etc." className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" rows={12} required />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Analisando...' : 'Analisar Sentimento'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12">
                        {isLoading && !analysis && (
                            <div className="flex items-center justify-center h-96 bg-white/60 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 animate-pulse">
                                <p className="text-gray-500 dark:text-gray-400 italic">Avaliando as palavras...</p>
                            </div>
                        )}
                        {analysis && (
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl animate-fade-in-up space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultado da Análise</h2>
                                <div className={`flex items-center justify-between p-4 rounded-lg border ${sentimentStyles.bg} ${sentimentStyles.border}`}>
                                    <span className={`text-xl font-bold ${sentimentStyles.text}`}>{analysis.sentiment || 'N/A'}</span>
                                    <span className={`text-lg font-mono p-2 rounded-md ${sentimentStyles.bg} ${sentimentStyles.text}`}>{(analysis.score || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Justificativa</h4>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm italic prose prose-sm max-w-none">
                                        <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                            {analysis.justification || ''}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Palavras-chave Influentes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(analysis.keywords || []).map((kw, i) => {
                                            const kwStyles = getSentimentStyles(kw.influence?.charAt(0).toUpperCase() + kw.influence?.slice(1) as any);
                                            return (
                                                <span key={i} className={`text-sm px-3 py-1 rounded-full border ${kwStyles.bg} ${kwStyles.text} ${kwStyles.border}`}>{kw.word}</span>
                                            );
                                        })}
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

export default SentimentAnalyzerTool;
