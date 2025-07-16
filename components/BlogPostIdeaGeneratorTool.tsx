import React, { useState, useCallback } from 'react';
import type { Agent, BlogPostIdea } from '../types';
import { generateBlogPostIdeas } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface BlogPostIdeaGeneratorToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const AccordionItem: React.FC<{ idea: BlogPostIdea, index: number }> = ({ idea, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-black/5 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <span className="font-semibold text-gray-900 dark:text-white">{index + 1}. {idea.title || 'Título Indisponível'}</span>
                <svg
                    className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-300 dark:border-white/10 space-y-4 bg-gray-100/50 dark:bg-black/30">
                    <div>
                        <h4 className="font-semibold text-teal-600 dark:text-teal-400 text-sm mb-1">Gancho</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{idea.hook || ''}"</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-teal-600 dark:text-teal-400 text-sm mb-1">Esboço</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            {(idea.outline || []).map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-teal-600 dark:text-teal-400 text-sm mb-1">Palavras-chave SEO</h4>
                        <div className="flex flex-wrap gap-2">
                           {(idea.seoKeywords || []).map((kw, i) => (
                                <span key={i} className="text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{kw}</span>
                           ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const BlogPostIdeaGeneratorTool: React.FC<BlogPostIdeaGeneratorToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ideas, setIdeas] = useState<BlogPostIdea[]>([]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) {
            addToast("Por favor, insira um tópico.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setIdeas([]);
        addToast("Gerando ideias de posts...", ToastType.INFO);
        try {
            const result = await generateBlogPostIdeas(topic, agent.systemInstruction);
            setIdeas(result.ideas || []);
            addToast("Ideias geradas com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            addToast(error.message || "Ocorreu um erro ao gerar as ideias.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [topic, agent.systemInstruction, addToast]);
    
    const handleExport = () => {
        if (!ideas || ideas.length === 0) return;
        const content = JSON.stringify({ ideas }, null, 2);
        const filename = `blog_ideas_${topic.replace(/\s+/g, '_').toLowerCase()}.json`;
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
        addToast(`Ideias exportadas como JSON`, ToastType.SUCCESS);
    };

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
                 {ideas.length > 0 && (
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
                                <label htmlFor="topic" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Tópico ou Palavra-chave
                                </label>
                            </div>
                            <div>
                                <input
                                    id="topic"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ex: Marketing de conteúdo para startups"
                                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Gerando...' : 'Gerar Ideias'}
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="mt-12">
                        {isLoading && ideas.length === 0 && (
                            <div className="flex items-center justify-center h-96 bg-white/60 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 animate-pulse">
                                <p className="text-gray-500 dark:text-gray-400 italic">Buscando inspiração...</p>
                            </div>
                        )}
                        {ideas.length > 0 && (
                            <div className="animate-fade-in-up bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
                                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ideias de Posts</h2>
                                 <div className="space-y-4">
                                     {ideas.map((idea, index) => (
                                        <AccordionItem key={index} idea={idea} index={index} />
                                     ))}
                                 </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPostIdeaGeneratorTool;
