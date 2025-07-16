import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent } from '../types';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    agents: Agent[];
    onSelectAgent: (agent: Agent) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, agents, onSelectAgent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const activeElement = listRef.current.children[activeIndex] as HTMLLIElement;
            activeElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex, filteredAgents]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        switch (e.key) {
            case 'Escape':
                onClose();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredAgents.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredAgents.length) % filteredAgents.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredAgents[activeIndex]) {
                    onSelectAgent(filteredAgents[activeIndex]);
                    onClose();
                }
                break;
        }
    }, [isOpen, onClose, filteredAgents, activeIndex, onSelectAgent]);

    useEffect(() => {
        // Using a global event listener attached to the window
        const handleGlobalKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
        
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleKeyDown]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-full max-w-2xl bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-gray-300 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar agente ou ferramenta..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setActiveIndex(0);
                        }}
                        className="w-full p-4 pl-12 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-gray-500 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                </div>
                {filteredAgents.length > 0 ? (
                    <ul ref={listRef} className="max-h-[50vh] overflow-y-auto border-t border-gray-200 dark:border-white/10 p-2">
                        {filteredAgents.map((agent, index) => (
                            <li
                                key={agent.id}
                                role="option"
                                aria-selected={activeIndex === index}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => {
                                    onSelectAgent(agent);
                                    onClose();
                                }}
                                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer ${
                                    activeIndex === index ? 'bg-teal-500/10 dark:bg-teal-500/20' : ''
                                }`}
                            >
                                <div className="text-teal-600 dark:text-teal-400">{agent.icon}</div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{agent.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                        Nenhum agente encontrado para "{searchTerm}"
                     </div>
                )}
                <div className="border-t border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 p-2 text-xs text-gray-500 dark:text-gray-500 flex items-center justify-end gap-4">
                    <span><kbd className="font-sans border border-gray-400 dark:border-gray-600 rounded px-1.5 py-0.5">↑</kbd> <kbd className="font-sans border border-gray-400 dark:border-gray-600 rounded px-1.5 py-0.5">↓</kbd> para navegar</span>
                    <span><kbd className="font-sans border border-gray-400 dark:border-gray-600 rounded px-1.5 py-0.5">↵</kbd> para selecionar</span>
                    <span><kbd className="font-sans border border-gray-400 dark:border-gray-600 rounded px-1.5 py-0.5">esc</kbd> para fechar</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;