import React, { useState, useCallback } from 'react';
import type { Agent, RouteOptimizationResult } from '../types';
import { generateRouteOptimization } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface RouteOptimizerToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EXAMPLE_DATA = `R. da Consolação, 930 - Consolação, São Paulo - SP
Av. Paulista, 1578 - Bela Vista, São Paulo - SP
R. Oscar Freire, 827 - Jardins, São Paulo - SP
Parque Ibirapuera - Portão 3, Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP
MASP, Av. Paulista, 1578 - Bela Vista, São Paulo - SP
Mercado Municipal de São Paulo, R. da Cantareira, 306 - Centro Histórico de São Paulo, São Paulo - SP`;

const SkeletonResult = () => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl animate-pulse space-y-4">
        <div className="h-7 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/2"></div>
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700/50"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                </div>
            ))}
        </div>
         <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3 mt-4"></div>
         <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
    </div>
);


const RouteOptimizerTool: React.FC<RouteOptimizerToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [addresses, setAddresses] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<RouteOptimizationResult | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const addressList = addresses.split('\n').filter(a => a.trim() !== '');
        if (addressList.length < 2) {
            addToast("Por favor, insira pelo menos dois endereços, um por linha.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setResult(null);
        addToast("Otimizando sua rota...", ToastType.INFO);

        try {
            const apiResult = await generateRouteOptimization(addresses, agent.systemInstruction);
            setResult(apiResult);
            addToast("Rota otimizada com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            addToast(error.message || "Ocorreu um erro ao otimizar a rota.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [addresses, agent.systemInstruction, addToast]);

    const handleUseExample = () => {
        setAddresses(EXAMPLE_DATA);
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
                                <label htmlFor="addresses" className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Lista de Endereços (um por linha)
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">O primeiro endereço da lista será considerado o ponto de partida.</p>
                            <textarea
                                id="addresses"
                                value={addresses}
                                onChange={(e) => setAddresses(e.target.value)}
                                placeholder="Rua A, 123 - Cidade, Estado&#10;Avenida B, 456 - Cidade, Estado&#10;Praça C, 789 - Cidade, Estado"
                                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                rows={10}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                {isLoading ? 'Otimizando...' : 'Otimizar Rota'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12" aria-live="polite">
                        {isLoading && <SkeletonResult />}
                        {result && (
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl animate-fade-in-up">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rota Otimizada</h2>
                                <ol className="space-y-3">
                                    {(result.optimizedRoute || []).map((address, index) => (
                                        <li key={index} className="flex items-center gap-4 text-gray-800 dark:text-gray-200">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30">
                                                {index + 1}
                                            </div>
                                            <span>{address}</span>
                                        </li>
                                    ))}
                                </ol>
                                {result.notes && (
                                     <div className="mt-6 pt-4 border-t border-gray-300 dark:border-white/10">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Notas da Otimização:</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">{result.notes}</p>
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteOptimizerTool;
