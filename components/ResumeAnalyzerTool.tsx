import React, { useState, useCallback } from 'react';
import type { Agent, ResumeAnalysis } from '../types';
import { analyzeResume } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';
import RadialProgress from './RadialProgress';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ResumeAnalyzerToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EXAMPLE_DATA = {
    jobDescription: `**Cargo:** Engenheiro de Frontend Sênior (React)\n\n**Responsabilidades:**\n- Desenvolver e manter aplicações web de alta performance usando React e TypeScript.\n- Colaborar com designers de UX/UI para implementar interfaces responsivas e intuitivas.\n- Escrever código limpo, testável e bem documentado.\n- Otimizar aplicações para máxima velocidade e escalabilidade.\n\n**Requisitos:**\n- 5+ anos de experiência com React.\n- Forte proficiência em TypeScript, HTML5 e CSS3.\n- Experiência com Next.js e state management (Redux ou Zustand).\n- Conhecimento em testes unitários e de integração (Jest, React Testing Library).`,
    resumeText: `**João da Silva**\nEngenheiro de Software | Desenvolvedor Frontend\n\n**Resumo:**\nDesenvolvedor Frontend com 8 anos de experiência na criação de interfaces modernas e responsivas. Especializado em React, Next.js e ecossistema JavaScript. Paixão por criar produtos com excelente experiência de usuário.\n\n**Experiência:**\n**Tech Solutions Inc.** - Desenvolvedor Frontend Sênior (2019 - Presente)\n- Liderou o desenvolvimento do novo dashboard de cliente usando React, TypeScript e Next.js, resultando em um aumento de 30% na satisfação do cliente.\n- Implementou um design system com Storybook, melhorando a consistência e velocidade de desenvolvimento.\n\n**Web Innovators** - Desenvolvedor Frontend Pleno (2016 - 2019)\n- Desenvolveu e manteve múltiplos websites institucionais usando React e Redux.\n\n**Habilidades:**\n- **Linguagens:** JavaScript, TypeScript, HTML, CSS\n- **Frameworks:** React, Next.js, Jest\n- **Ferramentas:** Git, Webpack, Docker`
};

const SkeletonResult = () => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded-md w-3/4 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col items-center justify-start bg-gray-200/50 dark:bg-black/30 p-6 rounded-lg">
                <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-2/3 mb-4"></div>
                <div className="w-[140px] h-[140px] bg-gray-300 dark:bg-gray-700/50 rounded-full"></div>
                <div className="mt-4 w-full space-y-2">
                     <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-3/4"></div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg space-y-3">
                    <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-5/6"></div>
                </div>
                <div className="bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg space-y-3">
                    <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-4/6"></div>
                </div>
            </div>
        </div>
        <div className="mt-6 bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg space-y-3">
             <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3"></div>
             <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
             <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
        </div>
    </div>
);

const AnalysisItem: React.FC<{ title: string, items: string[], icon: React.ReactNode }> = ({ title, items, icon }) => (
    <div className="bg-gray-200/50 dark:bg-black/30 p-4 rounded-lg">
        <h4 className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {items.map((item, i) => <li key={i} className="flex items-start"><span className="mr-2 mt-1">▪</span><span>{item}</span></li>)}
        </ul>
    </div>
);

const ResumeAnalyzerTool: React.FC<ResumeAnalyzerToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [jobDescription, setJobDescription] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobDescription || !resumeText) {
            addToast("Por favor, preencha a descrição da vaga e o texto do currículo.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setAnalysis(null);
        addToast("Analisando currículo... Isso pode levar um minuto.", ToastType.INFO);

        const prompt = `DESCRIÇÃO DA VAGA:\n${jobDescription}\n\n---FIM DA DESCRIÇÃO---\n\nCURRÍCULO:\n${resumeText}\n\n---FIM DO CURRÍCULO---`;

        try {
            const result = await analyzeResume(prompt, agent.systemInstruction);
            setAnalysis(result);
            addToast("Análise concluída com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao analisar o currículo.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [jobDescription, resumeText, agent.systemInstruction, addToast]);
    
    const handleUseExample = () => {
        setJobDescription(EXAMPLE_DATA.jobDescription);
        setResumeText(EXAMPLE_DATA.resumeText);
        addToast("Dados de exemplo carregados!", ToastType.INFO);
    };

    const handleExport = () => {
        if (!analysis) return;
        const content = JSON.stringify(analysis, null, 2);
        const filename = `resume_analysis_${new Date().toISOString()}.json`;
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
                        <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                        {agent.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dados para Análise</h3>
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
                            <div className="space-y-6">
                                 <div>
                                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição da Vaga</label>
                                    <textarea
                                        id="jobDescription"
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Cole aqui a descrição completa da vaga..."
                                        className="w-full h-64 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all resize-y"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="resumeText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Texto do Currículo</label>
                                    <textarea
                                        id="resumeText"
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                        placeholder="Cole aqui o conteúdo completo do currículo do candidato..."
                                        className="w-full h-64 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all resize-y"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Analisando...' : 'Analisar Compatibilidade'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12" aria-live="polite">
                        {isLoading && <SkeletonResult />}
                        {!isLoading && analysis && (
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl animate-fade-in-up">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Resultado da Análise</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1 flex flex-col items-center justify-start bg-gray-200/50 dark:bg-black/30 p-6 rounded-lg">
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Compatibilidade</h3>
                                        <div className="animate-glow-pulse">
                                            <RadialProgress progress={analysis.score || 0} size={140} strokeWidth={12} />
                                        </div>
                                        <div className="mt-4 w-full text-left">
                                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Resumo da Análise:</h4>
                                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {analysis.summary || "Resumo não disponível."}
                                          </p>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 space-y-6">
                                        <AnalysisItem title="Pontos Fortes" items={analysis.strengths || []} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
                                        <AnalysisItem title="Pontos a Melhorar" items={analysis.weaknesses || []} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <AnalysisItem title="Perguntas Sugeridas para Entrevista" items={analysis.interviewQuestions || []} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeAnalyzerTool;