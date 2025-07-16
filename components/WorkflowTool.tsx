import React, { useState, useCallback } from 'react';
import type { Agent, WorkflowStep, WorkflowResult, SWOTAnalysis, MarketingPersona, BlogPostIdea } from '../types';
import { WorkflowStepStatus } from '../types';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';
import { generateSwotAnalysis, generatePersonas, generateBlogPostIdeas } from '../services/geminiService';
import { STATIC_AGENTS } from '../constants';

// Helper to find system instructions
const getSystemInstruction = (agentId: string) => STATIC_AGENTS.find(a => a.id === agentId)?.systemInstruction || '';

// --- Local Icons ---
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const SpinnerIcon = () => <svg className="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface WorkflowToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const STEPS: Omit<WorkflowStep, 'status' | 'result' | 'error'>[] = [
    { id: 'swot', name: 'Análise SWOT' },
    { id: 'personas', name: 'Geração de Personas' },
    { id: 'blog_ideas', name: 'Ideias para Blog Posts' },
];

// --- Result Components ---

const SwotQuadrant: React.FC<{ title: string; items: string[] | undefined; colorClass: string; icon: React.ReactNode; }> = ({ title, items, colorClass, icon }) => (
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

const SwotResult = ({ analysis }: { analysis: SWOTAnalysis }) => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Análise SWOT</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SwotQuadrant title="Forças" items={analysis.strengths} colorClass="text-green-600 dark:text-green-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
            <SwotQuadrant title="Fraquezas" items={analysis.weaknesses} colorClass="text-red-600 dark:text-red-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>} />
            <SwotQuadrant title="Oportunidades" items={analysis.opportunities} colorClass="text-blue-600 dark:text-blue-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
            <SwotQuadrant title="Ameaças" items={analysis.threats} colorClass="text-yellow-600 dark:text-yellow-400" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        </div>
    </div>
);

const PersonasResult = ({ personas }: { personas: MarketingPersona[] }) => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personas de Marketing</h3>
        <div className="space-y-6">
            {(personas || []).map((persona, i) => (
                <div key={i} className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl">
                    <h4 className="text-lg font-semibold text-teal-600 dark:text-teal-400">{persona.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{persona.demographics}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Objetivos</h5>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                                {(persona.goals || []).map((g, j) => <li key={j}>{g}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Frustrações</h5>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                                {(persona.frustrations || []).map((f, j) => <li key={j}>{f}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const BlogIdeasResult = ({ ideas }: { ideas: BlogPostIdea[] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ideias para Blog Posts</h3>
            <div className="space-y-4">
                {(ideas || []).map((idea, index) => (
                    <div key={index} className="bg-black/5 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-xl overflow-hidden">
                        <button
                            onClick={() => toggleAccordion(index)}
                            className="w-full flex justify-between items-center text-left p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="font-semibold text-gray-900 dark:text-white">{idea.title}</span>
                            <svg
                                className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openIndex === index && (
                            <div className="p-4 border-t border-gray-300 dark:border-white/10 space-y-4 bg-gray-100/50 dark:bg-black/30">
                                <div>
                                    <h4 className="font-semibold text-teal-600 dark:text-teal-400 text-sm mb-1">Gancho</h4>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{idea.hook}"</p>
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
                ))}
            </div>
        </div>
    );
};

const WorkflowTool: React.FC<WorkflowToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [topic, setTopic] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(
        STEPS.map(step => ({ ...step, status: WorkflowStepStatus.PENDING, result: null, error: null }))
    );
    const [workflowResult, setWorkflowResult] = useState<WorkflowResult>({});

    const updateStepStatus = (id: string, status: WorkflowStepStatus, result: any = null, error: string | null = null) => {
        setWorkflowSteps(prev => prev.map(step =>
            step.id === id ? { ...step, status, result, error } : step
        ));
    };

    const runWorkflow = useCallback(async () => {
        setIsRunning(true);
        setWorkflowResult({});
        setWorkflowSteps(STEPS.map(step => ({ ...step, status: WorkflowStepStatus.PENDING, result: null, error: null })));
        addToast("Iniciando workflow de conteúdo...", ToastType.INFO);

        let businessDescription = topic;
        let personas: MarketingPersona[] = [];

        try {
            // --- Step 1: SWOT Analysis ---
            updateStepStatus('swot', WorkflowStepStatus.RUNNING);
            const swotResult = await generateSwotAnalysis(
                `Analisar o negócio/produto: ${topic}`,
                getSystemInstruction('swot_analyzer')
            );
            updateStepStatus('swot', WorkflowStepStatus.COMPLETED, swotResult);
            setWorkflowResult(prev => ({ ...prev, swot: swotResult }));

            // Improve business description for next steps based on SWOT
            const strengths = (swotResult.strengths || []).join(', ');
            const opportunities = (swotResult.opportunities || []).join(', ');
            if (strengths) businessDescription += `\n\nContexto adicional: Seus pontos fortes são: ${strengths}.`;
            if (opportunities) businessDescription += `\nSuas oportunidades de mercado são: ${opportunities}.`;

            // --- Step 2: Persona Generation ---
            updateStepStatus('personas', WorkflowStepStatus.RUNNING);
            const personasResult = await generatePersonas(
                `Gerar personas para o seguinte negócio: ${businessDescription}`,
                getSystemInstruction('persona_generator')
            );
            personas = personasResult.personas || [];
            updateStepStatus('personas', WorkflowStepStatus.COMPLETED, personasResult);
            setWorkflowResult(prev => ({ ...prev, personas }));

            // --- Step 3: Blog Post Ideas ---
            updateStepStatus('blog_ideas', WorkflowStepStatus.RUNNING);
            const personaSummary = personas.length > 0
                ? `para um público similar a: ${personas.map(p => p.name).join(', ')}`
                : '';

            const blogIdeasResult = await generateBlogPostIdeas(
                `Gerar ideias de blog post ${personaSummary} sobre o tópico: ${topic}`,
                getSystemInstruction('blog_post_idea_generator')
            );
            updateStepStatus('blog_ideas', WorkflowStepStatus.COMPLETED, blogIdeasResult);
            setWorkflowResult(prev => ({ ...prev, blogIdeas: blogIdeasResult }));

            addToast("Workflow concluído com sucesso!", ToastType.SUCCESS);

        } catch (error: any) {
            setWorkflowSteps(prev => {
                const runningStep = prev.find(s => s.status === WorkflowStepStatus.RUNNING);
                if (runningStep) {
                    return prev.map(step =>
                        step.id === runningStep.id ? { ...step, status: WorkflowStepStatus.FAILED, error: error.message } : step
                    );
                }
                return prev;
            });
            console.error("Erro no workflow:", error);
            addToast(`Erro durante o workflow: ${error.message}`, ToastType.ERROR);
        } finally {
            setIsRunning(false);
        }

    }, [topic, addToast]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) {
            addToast("Por favor, descreva o negócio ou produto.", ToastType.ERROR);
            return;
        }
        runWorkflow();
    };

    const renderStepStatusIcon = (status: WorkflowStepStatus) => {
        switch (status) {
            case WorkflowStepStatus.COMPLETED: return <div className="text-green-500"><CheckIcon /></div>;
            case WorkflowStepStatus.RUNNING: return <div className="text-blue-500"><SpinnerIcon /></div>;
            case WorkflowStepStatus.FAILED: return <div className="text-red-500"><ErrorIcon /></div>;
            default: return <div className="text-gray-400"><PendingIcon /></div>;
        }
    };
    
    const isFinished = !isRunning && workflowSteps.every(s => s.status !== WorkflowStepStatus.PENDING && s.status !== WorkflowStepStatus.RUNNING);

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
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                         <div className="flex items-center gap-4">
                             <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                {agent.icon}
                            </div>
                            <label htmlFor="topic" className="text-lg font-semibold text-gray-900 dark:text-white">
                                Descreva o Negócio ou Produto
                            </label>
                        </div>
                        <div>
                            <textarea
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Ex: Uma cafeteria de especialidade focada em produtos locais e sustentáveis, localizada em um bairro universitário."
                                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                rows={5}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isRunning} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                {isRunning ? 'Executando...' : 'Executar Workflow'}
                            </button>
                        </div>
                    </form>

                    {(isRunning || isFinished) && (
                        <div className="mt-12">
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Progresso do Workflow</h2>
                            <div className="relative pl-12">
                                {/* Vertical Line */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>

                                {workflowSteps.map((step) => (
                                    <div key={step.id} className="relative mb-10">
                                        <div className="absolute left-0 top-1.5 flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-gray-800 rounded-full border-4 border-gray-300 dark:border-gray-700">
                                            {renderStepStatusIcon(step.status)}
                                        </div>
                                        <div className="ml-8 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-5 rounded-xl">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{step.name}</h3>
                                             {step.status === WorkflowStepStatus.FAILED && step.error && (
                                                <p className="text-sm text-red-500 mt-2">Erro: {step.error}</p>
                                            )}
                                            {step.status === WorkflowStepStatus.COMPLETED && (
                                                <p className="text-sm text-green-600 dark:text-green-400 mt-2">Concluído com sucesso!</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isFinished && Object.keys(workflowResult).length > 0 && (
                        <div className="mt-12 space-y-8 animate-fade-in-up">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Resultados do Workflow</h2>
                            {workflowResult.swot && <SwotResult analysis={workflowResult.swot} />}
                            {workflowResult.personas && <PersonasResult personas={workflowResult.personas} />}
                            {workflowResult.blogIdeas && <BlogIdeasResult ideas={workflowResult.blogIdeas.ideas} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowTool;