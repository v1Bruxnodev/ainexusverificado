import React, { useState, useCallback, useEffect } from 'react';
import type { Agent, Presentation, Slide } from '../types';
import { generatePresentation } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

interface PresentationGeneratorToolProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const EXAMPLE_DATA = {
    topic: 'O Futuro do Trabalho Remoto: Desafios e Oportunidades',
    audience: 'Líderes de equipe e profissionais de RH',
    numSlides: 8,
};

const SkeletonResult = () => (
    <div className="animate-pulse">
        <div className="h-10 bg-gray-300 dark:bg-gray-700/50 rounded-md w-3/4 mb-4"></div>
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-5 rounded-xl">
            <div className="flex justify-between items-center border-b border-teal-500/20 pb-2 mb-4">
                 <div className="h-7 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/2"></div>
                 <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-28"></div>
            </div>
            <div className="min-h-[250px] mb-4 space-y-3">
                 <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                 <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
                 <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-5/6"></div>
                 <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            </div>
            <div className="bg-gray-200/50 dark:bg-black/30 p-3 rounded-md mb-4 space-y-2">
                 <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded-md w-1/3"></div>
                 <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded-md w-full"></div>
            </div>
             <div className="flex justify-between items-center mt-4">
                 <div className="h-9 bg-gray-300 dark:bg-gray-700/50 rounded-lg w-24"></div>
                 <div className="h-9 bg-gray-300 dark:bg-gray-700/50 rounded-lg w-24"></div>
             </div>
        </div>
    </div>
);


const PresentationGeneratorTool: React.FC<PresentationGeneratorToolProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [topic, setTopic] = useState('');
    const [audience, setAudience] = useState('');
    const [numSlides, setNumSlides] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    
    const [originalPresentation, setOriginalPresentation] = useState<Presentation | null>(null);
    const [editedPresentation, setEditedPresentation] = useState<Presentation | null>(null);
    
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic || !audience) {
            addToast("Por favor, preencha o tema e o público-alvo.", ToastType.ERROR);
            return;
        }
        setIsLoading(true);
        setOriginalPresentation(null);
        setEditedPresentation(null);
        setCurrentSlideIndex(0);
        addToast("Gerando sua apresentação... Isso pode levar um minuto.", ToastType.INFO);

        const prompt = `Gere uma apresentação sobre "${topic}" para um público de "${audience}". A apresentação deve conter aproximadamente ${numSlides} slides.`;

        try {
            const result = await generatePresentation(prompt, agent.systemInstruction);
            setOriginalPresentation(JSON.parse(JSON.stringify(result))); // Deep copy
            setEditedPresentation(result);
            addToast("Apresentação gerada com sucesso! Agora você pode editá-la.", ToastType.SUCCESS);
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Ocorreu um erro ao gerar a apresentação.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [topic, audience, numSlides, agent.systemInstruction, addToast]);
    
    const handleValueChange = <T extends keyof Presentation | keyof Slide>(
        field: T,
        value: string,
        slideIndex?: number
    ) => {
        setEditedPresentation(prev => {
            if (!prev) return null;
            const newPresentation = { ...prev };
            if (slideIndex !== undefined) {
                const newSlides = [...(newPresentation.slides || [])];
                const newSlide = { ...newSlides[slideIndex], [field]: value };
                newSlides[slideIndex] = newSlide;
                return { ...newPresentation, slides: newSlides };
            } else {
                return { ...newPresentation, [field]: value as any };
            }
        });
    };
    
    const handleSlideContentChange = (slideIndex: number, contentIndex: number, value: string) => {
        setEditedPresentation(prev => {
            if (!prev) return null;
            const newSlides = [...(prev.slides || [])];
            const newContent = [...(newSlides[slideIndex].content || [])];
            newContent[contentIndex] = value;
            newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
            return { ...prev, slides: newSlides };
        });
    };

    const addContentPoint = (slideIndex: number) => {
         setEditedPresentation(prev => {
            if (!prev) return null;
            const newSlides = [...(prev.slides || [])];
            const newContent = [...(newSlides[slideIndex].content || []), 'Novo ponto.'];
            newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
            return { ...prev, slides: newSlides };
        });
    };

    const removeContentPoint = (slideIndex: number, contentIndex: number) => {
        setEditedPresentation(prev => {
            if (!prev) return null;
            const newSlides = [...(prev.slides || [])];
            const newContent = (newSlides[slideIndex].content || []).filter((_, i) => i !== contentIndex);
            newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
            return { ...prev, slides: newSlides };
        });
    };

    const handleReset = () => {
        setEditedPresentation(JSON.parse(JSON.stringify(originalPresentation))); // Deep copy
        addToast("Alterações revertidas para o original.", ToastType.INFO);
    };

    const handleUseExample = () => {
        setTopic(EXAMPLE_DATA.topic);
        setAudience(EXAMPLE_DATA.audience);
        setNumSlides(EXAMPLE_DATA.numSlides);
        addToast("Dados de exemplo carregados!", ToastType.INFO);
    };

    const handleExport = (format: 'json') => {
        if (!editedPresentation) return;

        let content = '';
        let filename = '';
        let mimeType = '';

        if (format === 'json') {
            content = JSON.stringify(editedPresentation, null, 2);
            filename = `${(editedPresentation.title || 'apresentacao').replace(/\s+/g, '_').toLowerCase()}.json`;
            mimeType = 'application/json';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Apresentação exportada como ${format.toUpperCase()}`, ToastType.SUCCESS);
    };

    const currentSlide = editedPresentation?.slides?.[currentSlideIndex];

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
                 {editedPresentation && (
                     <div className="flex items-center gap-2">
                         <button
                            onClick={handleReset}
                            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-xs bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/60 dark:hover:bg-gray-600/50 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                            Resetar
                        </button>
                         <button
                            onClick={() => handleExport('json')}
                            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-xs bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors text-teal-700 dark:text-teal-300"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Exportar JSON
                        </button>
                     </div>
                )}
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {!editedPresentation && (
                        <div className="w-full">
                            <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg">
                                        {agent.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detalhes da Apresentação</h3>
                                </div>
                                <div className="flex justify-end -mt-8">
                                    <button
                                        type="button"
                                        onClick={handleUseExample}
                                        className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors text-teal-700 dark:text-teal-300"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a4.125 4.125 0 000-8.25 4.125 4.125 0 000 8.25z" /></svg>
                                        Usar Exemplo
                                    </button>
                                </div>
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tema da Apresentação</label>
                                    <input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: O Futuro da Inteligência Artificial" className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" required/>
                                </div>
                                <div>
                                    <label htmlFor="audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Público-alvo</label>
                                    <input id="audience" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ex: Estudantes de tecnologia" className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" required/>
                                </div>
                                <div>
                                    <label htmlFor="numSlides" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número de Slides (Aproximado)</label>
                                    <input id="numSlides" type="number" value={numSlides} onChange={(e) => setNumSlides(parseInt(e.target.value, 10))} className="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all" min="3" max="20" />
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" disabled={isLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                        {isLoading ? 'Gerando...' : 'Gerar Apresentação'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    
                    <div className="mt-8" aria-live="polite">
                        {isLoading && <SkeletonResult />}
                        {!isLoading && editedPresentation && currentSlide && (
                            <div key={currentSlideIndex} className="animate-slide-in-right">
                                <input
                                    type="text"
                                    value={editedPresentation.title || ''}
                                    onChange={(e) => handleValueChange('title', e.target.value)}
                                    className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-transparent focus:border-teal-500 focus:outline-none w-full mb-4 p-2 -ml-2"
                                />

                                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-5 rounded-xl">
                                    <div className="flex justify-between items-center border-b border-teal-500/20 pb-3 mb-4">
                                        <input
                                            type="text"
                                            value={currentSlide.title || ''}
                                            onChange={(e) => handleValueChange('title', e.target.value, currentSlideIndex)}
                                            className="text-lg font-semibold text-teal-600 dark:text-teal-400 bg-transparent focus:outline-none w-full"
                                        />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                            Slide {currentSlideIndex + 1} de {(editedPresentation.slides || []).length}
                                        </p>
                                    </div>
                                    <div className="min-h-[200px] md:min-h-[250px] mb-4 text-gray-700 dark:text-gray-300">
                                        <h4 className="text-sm font-medium mb-2">Conteúdo</h4>
                                        <div className="space-y-2">
                                            {(currentSlide.content || []).map((point, i) => (
                                                <div key={i} className="flex items-center gap-2 group">
                                                    <span className="text-teal-500 mt-1">▪</span>
                                                    <input
                                                        type="text"
                                                        value={point}
                                                        onChange={e => handleSlideContentChange(currentSlideIndex, i, e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none p-1 rounded-md focus:bg-black/10 dark:focus:bg-white/10"
                                                    />
                                                    <button onClick={() => removeContentPoint(currentSlideIndex, i)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                         <button onClick={() => addContentPoint(currentSlideIndex)} className="text-sm text-teal-600 dark:text-teal-400 mt-3 hover:underline">+ Adicionar Ponto</button>
                                    </div>
                                    <div className="bg-gray-200/50 dark:bg-black/30 p-3 rounded-md mb-4">
                                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notas do Apresentador</h4>
                                        <textarea
                                            value={currentSlide.speakerNotes || ''}
                                            onChange={e => handleValueChange('speakerNotes', e.target.value, currentSlideIndex)}
                                            className="text-sm text-gray-600 dark:text-gray-400 italic bg-transparent focus:outline-none w-full resize-y"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <button 
                                            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentSlideIndex === 0}
                                            className="px-4 py-2 text-sm bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/60 dark:hover:bg-gray-600/50 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >Anterior</button>
                                        <button 
                                            onClick={() => setCurrentSlideIndex(prev => Math.min((editedPresentation.slides || []).length - 1, prev + 1))}
                                            disabled={currentSlideIndex === (editedPresentation.slides || []).length - 1}
                                            className="px-4 py-2 text-sm bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/60 dark:hover:bg-gray-600/50 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >Próximo</button>
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

export default PresentationGeneratorTool;
