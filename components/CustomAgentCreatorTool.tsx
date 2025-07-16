import React, { useState, useCallback } from 'react';
import type { Agent } from '../types';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';
import { ICONS } from '../constants';

interface CustomAgentCreatorToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
    onAgentCreated: (newAgentData: Omit<Agent, 'id' | 'icon' | 'isCustom'> & { iconName: string }) => Agent;
}

const iconEntries = Object.entries(ICONS);

const CustomAgentCreatorTool: React.FC<CustomAgentCreatorToolProps> = ({ agent, onToggleSidebar, onAgentCreated }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemInstruction: '',
        iconName: 'CodeIcon',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleIconChange = (iconName: string) => {
        setFormData(prev => ({ ...prev, iconName }));
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.description || !formData.systemInstruction) {
            addToast("Por favor, preencha todos os campos obrigatórios.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        try {
            const newAgentData = {
                ...formData,
                welcomeMessage: `Olá! Eu sou ${formData.name}, seu novo assistente personalizado. Como posso te ajudar hoje?`,
                promptSuggestions: [
                    "Qual é a sua principal função?",
                    "Me dê um exemplo do que você pode fazer.",
                    "Como você foi configurado?"
                ],
            };
            
            // The hook handles saving to localStorage and updating the global state.
            // It returns the full agent object.
            const newAgent = onAgentCreated(newAgentData);

            addToast("Agente personalizado criado com sucesso!", ToastType.SUCCESS);
            setFormData({ name: '', description: '', systemInstruction: '', iconName: 'CodeIcon' }); // Reset form
            
            // Navigate to the new agent's page
            window.location.hash = `/${newAgent.id}`;

        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao criar o agente.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [formData, addToast, onAgentCreated]);

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
                        <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                    {agent.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Crie seu Agente Personalizado</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dê vida ao seu próprio assistente de IA, definindo sua personalidade e função.</p>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Agente *</label>
                                <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Ex: Revisor de Código Python" className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" required />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição Curta *</label>
                                <input id="description" name="description" type="text" value={formData.description} onChange={handleInputChange} placeholder="Ex: Analisa código Python e sugere melhorias." className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" required />
                            </div>

                            <div>
                                <label htmlFor="systemInstruction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instrução de Sistema (A Alma do Agente) *</label>
                                <textarea id="systemInstruction" name="systemInstruction" value={formData.systemInstruction} onChange={handleInputChange} placeholder="Ex: Você é um programador Python sênior. Revise o código fornecido, aponte erros, sugira melhorias de performance e formate suas respostas em markdown." className="w-full h-48 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all resize-y" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícone *</label>
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 p-3 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg">
                                    {iconEntries.map(([name, IconComponent]) => (
                                        <button
                                            type="button"
                                            key={name}
                                            onClick={() => handleIconChange(name)}
                                            className={`p-2 rounded-lg transition-all ${formData.iconName === name ? 'bg-teal-500/30 ring-2 ring-teal-500' : 'hover:bg-gray-300/50 dark:hover:bg-white/10'}`}
                                            title={name.replace('Icon', '')}
                                        >
                                            <IconComponent />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                    {isLoading ? 'Criando...' : 'Criar Agente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomAgentCreatorTool;