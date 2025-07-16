import React, { useState, useCallback } from 'react';
import type { Agent, MeetingSummary } from '../types';
import { generateMeetingSummary } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface MeetingAssistantToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EXAMPLE_DATA = `Notas da Reunião - Lançamento Q3 - 25/07/2024

Participantes: Ana, Bruno, Carla

- Bruno: O design da landing page está quase pronto. Preciso do texto final até sexta-feira.
- Ana: O time de marketing vai entregar o texto do copy na quinta. Carla, o time de backend está no prazo?
- Carla: Sim, as APIs estão prontas. Só precisamos integrar com o novo sistema de pagamento. Isso pode levar uma semana a mais.
- Ana: Ok, isso é um risco. Carla, pode verificar a complexidade? Bruno, se o copy atrasar, qual o impacto?
- Bruno: Um dia de atraso no copy atrasa o deploy em um dia.
- Ana: Ok, plano de ação: Carla investiga a integração e traz um prazo final amanhã. Eu vou acompanhar o time de marketing para garantir a entrega do texto.`;


const SkeletonResult = () => (
    <div className="animate-pulse space-y-6">
        <div className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-5/6"></div>
        </div>
        <div className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
        </div>
        <div className="bg-gray-200/50 dark:bg-black/30 p-5 rounded-xl space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/2"></div>
            <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3 mt-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            <div className="h-24 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full mt-2"></div>
        </div>
    </div>
);

const MeetingAssistantTool: React.FC<MeetingAssistantToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<MeetingSummary | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes) {
            addToast("Por favor, insira as anotações da reunião.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setSummary(null);
        addToast("Processando anotações da reunião...", ToastType.INFO);

        try {
            const result = await generateMeetingSummary(notes, agent.systemInstruction);
            setSummary(result);
            addToast("Resumo da reunião gerado com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            addToast(error.message || "Ocorreu um erro ao processar as anotações.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [notes, agent.systemInstruction, addToast]);

    const handleUseExample = () => {
        setNotes(EXAMPLE_DATA);
        addToast("Exemplo carregado!", ToastType.INFO);
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
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                    {agent.icon}
                                </div>
                                <label htmlFor="notes" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Anotações ou Transcrição da Reunião
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={handleUseExample}
                                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors text-teal-700 dark:text-teal-300"
                            >
                                Usar Exemplo
                            </button>
                        </div>
                        <div>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Cole aqui as anotações brutas da sua reunião..."
                                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                rows={15}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                {isLoading ? 'Processando...' : 'Gerar Resumo'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12" aria-live="polite">
                        {isLoading && <SkeletonResult />}
                        {summary && (
                            <div className="animate-fade-in-up space-y-6">
                                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Resumo Executivo</h3>
                                    <p className="text-gray-700 dark:text-gray-300">{summary.summary}</p>
                                </div>
                                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Itens de Ação</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[400px] text-left">
                                            <thead>
                                                <tr className="border-b border-gray-300 dark:border-white/10">
                                                    <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Tarefa</th>
                                                    <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Responsável</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(summary.actionItems || []).map((item, index) => (
                                                    <tr key={index} className="border-b border-gray-200 dark:border-white/5">
                                                        <td className="p-3 text-gray-700 dark:text-gray-300">{item.task}</td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{item.owner}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rascunho de E-mail de Acompanhamento</h3>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            readOnly
                                            value={summary.followUpEmail?.subject || ''}
                                            className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white font-semibold"
                                        />
                                        <textarea
                                            readOnly
                                            value={summary.followUpEmail?.body || ''}
                                            className="w-full h-64 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white resize-y"
                                        />
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

export default MeetingAssistantTool;