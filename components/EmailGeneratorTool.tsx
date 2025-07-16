import React, { useState, useCallback, useEffect } from 'react';
import type { Agent, Email } from '../types';
import { generateEmail } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface EmailGeneratorToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EmailGeneratorTool: React.FC<EmailGeneratorToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        recipient: '',
        objective: '',
        keyPoints: '',
        tone: 'Formal',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [originalEmail, setOriginalEmail] = useState<Email | null>(null);
    const [editedEmail, setEditedEmail] = useState<Email | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editedEmail) return;
        setEditedEmail({
            ...editedEmail,
            [e.target.name]: e.target.value,
        });
    };

    const handleResetEmail = () => {
        setEditedEmail(originalEmail);
        addToast("Campos restaurados para a versão original.", ToastType.INFO);
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.objective || !formData.keyPoints) {
            addToast("Por favor, preencha o objetivo e os pontos-chave.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setOriginalEmail(null);
        setEditedEmail(null);
        addToast("Gerando seu e-mail...", ToastType.INFO);

        const prompt = `Destinatário: ${formData.recipient || 'Não especificado'}\nObjetivo: ${formData.objective}\nPontos-chave a incluir: ${formData.keyPoints}\nTom desejado: ${formData.tone}`;

        try {
            const result = await generateEmail(prompt, agent.systemInstruction);
            setOriginalEmail(result);
            setEditedEmail(result);
            addToast("E-mail gerado com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao gerar o e-mail.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [formData, agent.systemInstruction, addToast]);
    
    const copyToClipboard = () => {
        if (!editedEmail) return;
        const textToCopy = `Subject: ${editedEmail.subject || ''}\n\n${editedEmail.body || ''}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            addToast("E-mail copiado para a área de transferência!", ToastType.SUCCESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
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
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="w-full">
                        <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                    {agent.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalhes do E-mail</h3>
                            </div>
                             <div>
                                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Objetivo</label>
                                <input id="objective" name="objective" type="text" value={formData.objective} onChange={handleInputChange} placeholder="Ex: Pedir um aumento, agendar reunião" className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" required />
                            </div>
                            <div>
                                <label htmlFor="keyPoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pontos-chave</label>
                                <textarea id="keyPoints" name="keyPoints" value={formData.keyPoints} onChange={handleInputChange} placeholder="Ex: Mencionar resultados do último trimestre..." className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" rows={6} required />
                            </div>
                            <div>
                                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destinatário (Opcional)</label>
                                <input id="recipient" name="recipient" type="text" value={formData.recipient} onChange={handleInputChange} placeholder="Ex: Sr. Silva, Chefe do Depto." className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" />
                            </div>
                            <div>
                                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tom</label>
                                <select id="tone" name="tone" value={formData.tone} onChange={handleInputChange} className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all appearance-none bg-no-repeat bg-right pr-8" style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em'}}>
                                    <option>Formal</option>
                                    <option>Casual</option>
                                    <option>Persuasivo</option>
                                    <option>Direto</option>
                                    <option>Amigável</option>
                                </select>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Gerando...' : 'Gerar E-mail'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12">
                        {isLoading && !editedEmail && (
                            <div className="flex flex-col items-center justify-center h-full bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl min-h-[400px] animate-pulse">
                                <div className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded-md w-3/4 mb-6"></div>
                                <div className="w-full space-y-4">
                                    <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                                    <div className="h-10 bg-gray-300 dark:bg-gray-700/50 rounded-lg w-full"></div>
                                    <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4 pt-4"></div>
                                    <div className="h-40 bg-gray-300 dark:bg-gray-700/50 rounded-lg w-full"></div>
                                </div>
                             </div>
                        )}
                        {editedEmail && (
                           <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4 animate-fade-in-up">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">E-mail Gerado</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleResetEmail}
                                            disabled={isLoading || !originalEmail}
                                            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/60 dark:hover:bg-gray-600/50 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Restaurar
                                        </button>
                                        <button onClick={copyToClipboard} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs bg-teal-500/20 text-teal-700 dark:text-teal-300 rounded-lg hover:bg-teal-500/30 transition-colors">
                                            {isCopied ? 'Copiado!' : 'Copiar E-mail'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assunto</label>
                                    <input name="subject" type="text" value={editedEmail.subject || ''} onChange={handleEmailChange} className="mt-1 w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" />
                                </div>
                                <div>
                                     <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Corpo do E-mail</label>
                                    <textarea name="body" value={editedEmail.body || ''} onChange={handleEmailChange} className="mt-1 w-full h-80 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailGeneratorTool;
