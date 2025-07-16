
import React, { useState } from 'react';
import type { Agent } from '../types';

interface AgentSelectorProps {
    agents: Agent[];
    selectedAgentId: string | null;
    onSelectAgent: (agent: Agent) => void;
    onGoHome: () => void;
    userName: string;
}

const AgentButton: React.FC<{ agent: Agent; isSelected: boolean; onClick: () => void; }> = ({ agent, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`group flex items-start text-left p-3 rounded-lg transition-all duration-200 w-full ${
            isSelected
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-gray-900 dark:text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white hover:-translate-y-0.5'
        }`}
    >
        <div className={`mr-4 mt-0.5 text-teal-500 dark:text-teal-400 flex-shrink-0 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>{agent.icon}</div>
        <div className="flex-1">
            <h2 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{agent.description}</p>
        </div>
    </button>
);


const AgentSelector: React.FC<AgentSelectorProps> = ({ agents, selectedAgentId, onSelectAgent, onGoHome, userName }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    const sortedAgents = [...agents].sort((a, b) => a.name.localeCompare(b.name));

    const filteredAgents = sortedAgents.filter(agent =>
        agent.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        agent.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
    
    const customAgents = filteredAgents.filter(agent => agent.isCustom);
    const toolAgents = filteredAgents.filter(agent => agent.isTool && !agent.isCustom);
    const chatAgents = filteredAgents.filter(agent => !agent.isTool && !agent.isCustom);

    return (
        <aside className="w-72 lg:w-80 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border-r border-black/5 dark:border-white/5 flex flex-col p-4 h-full">
            <button 
                className="flex items-center space-x-3 mb-6 px-2 cursor-pointer group text-left"
                onClick={onGoHome}
            >
                <div className="p-2 bg-gradient-to-br from-teal-400/20 to-blue-500/20 text-white rounded-lg border border-teal-500/20 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-teal-500/20 transition-all duration-300">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7">
                        <defs>
                            <linearGradient id="icon-gradient-selector" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#5eead4"/>
                                <stop offset="100%" stopColor="#3b82f6"/>
                            </linearGradient>
                        </defs>
                        <path fill="url(#icon-gradient-selector)" d="M13.4,2.01,7.22,12,13.4,21.99h3.38L10.6,12,l6.18-9.99ZM7.22,2.01,1,12,l6.22,9.99h3.38L4.4,12,l6.19-9.99Z"/>
                    </svg>
                </div>
                <div style={{ fontFamily: "'Exo 2', sans-serif" }} className="text-xl text-gray-900 dark:text-white tracking-wider group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                    <span style={{fontWeight: 600}}>NEXUS</span>
                    <span style={{fontWeight: 300}} className="text-teal-500 dark:text-teal-400"> AI</span>
                </div>
            </button>
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Buscar agente ou ferramenta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg py-2 pl-10 pr-4 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:focus:ring-teal-400 focus:shadow-[0_0_15px_rgba(56,189,173,0.4)] transition-all"
                    aria-label="Buscar agente ou ferramenta"
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500 pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </span>
            </div>
            <nav className="flex flex-col space-y-1 overflow-y-auto flex-1 -mr-2 pr-2">
                 {customAgents.length > 0 && (
                    <>
                        <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Meus Agentes</h3>
                        <div className="space-y-1">
                            {customAgents.map((agent) => (
                                <AgentButton key={agent.id} agent={agent} isSelected={selectedAgentId === agent.id} onClick={() => onSelectAgent(agent)} />
                            ))}
                        </div>
                    </>
                 )}
                {toolAgents.length > 0 && (
                    <>
                        <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">Ferramentas</h3>
                        <div className="space-y-1">
                            {toolAgents.map((agent) => (
                                <AgentButton key={agent.id} agent={agent} isSelected={selectedAgentId === agent.id} onClick={() => onSelectAgent(agent)} />
                            ))}
                        </div>
                    </>
                )}
                 {chatAgents.length > 0 && (
                    <>
                        <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">Agentes de IA</h3>
                        <div className="space-y-1">
                            {chatAgents.map((agent) => (
                                <AgentButton key={agent.id} agent={agent} isSelected={selectedAgentId === agent.id} onClick={() => onSelectAgent(agent)} />
                            ))}
                        </div>
                    </>
                 )}
            </nav>
            <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
                <div className="px-1 flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-gray-800 dark:text-white truncate" title={userName}>{userName}</p>
                    </div>
                </div>
                <div 
                    className="w-full flex items-center justify-center p-2 text-xs text-gray-500 dark:text-gray-400"
                >
                    Desenvolvido por&nbsp;
                    <a 
                        href="https://minimalistportfoliobr.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                        Bruno Almeida
                    </a>
                </div>
            </div>
        </aside>
    );
};

export default AgentSelector;
