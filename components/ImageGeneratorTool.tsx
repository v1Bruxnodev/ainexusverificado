import React, { useState, useCallback } from 'react';
import type { Agent } from '../types';
import { generateImage } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface ImageGeneratorToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const SkeletonResult = () => (
    <div className="animate-pulse">
        <div className="aspect-square bg-gray-300 dark:bg-gray-700/50 rounded-xl"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3 mt-4 mx-auto"></div>
    </div>
);

const ImageGeneratorTool: React.FC<ImageGeneratorToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            addToast("Por favor, insira uma descrição para a imagem.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setGeneratedImage(null);
        addToast("Gerando sua imagem... Isso pode levar um momento.", ToastType.INFO);

        try {
            const result = await generateImage(prompt);
            setGeneratedImage(`data:image/jpeg;base64,${result}`);
            addToast("Imagem gerada com sucesso!", ToastType.SUCCESS);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao gerar a imagem.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, addToast]);
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const a = document.createElement('a');
        a.href = generatedImage;
        a.download = `nexus_ai_${prompt.substring(0, 20).replace(/\s+/g, '_')}.jpeg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast("Download da imagem iniciado!", ToastType.SUCCESS);
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
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                {agent.icon}
                            </div>
                            <label htmlFor="prompt" className="text-lg font-semibold text-gray-900 dark:text-white">
                                Descrição da Imagem (Prompt)
                            </label>
                        </div>
                        <div>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Um astronauta surfando em uma onda cósmica, estilo synthwave, cores vibrantes..."
                                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                {isLoading ? 'Gerando...' : 'Gerar Imagem'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12" aria-live="polite">
                        {isLoading && <SkeletonResult />}
                        {generatedImage && (
                            <div className="animate-fade-in-up">
                                <img src={generatedImage} alt={prompt} className="w-full h-auto rounded-xl shadow-2xl border-2 border-teal-500/30" />
                                <div className="text-center mt-6">
                                    <button
                                        onClick={handleDownload}
                                        className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGeneratorTool;
