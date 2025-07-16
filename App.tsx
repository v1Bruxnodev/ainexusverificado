
import React, { useState, useCallback, useEffect } from 'react';
import type { Agent } from './types';
import { STATIC_AGENTS } from './constants';
import AgentSelector from './components/AgentSelector';
import ChatWindow from './components/ChatWindow';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import { useCustomAgents } from './hooks/useCustomAgents';
import WelcomeScreen from './components/WelcomeScreen';

// Import all tool components
import PresentationGeneratorTool from './components/PresentationGeneratorTool';
import ResumeAnalyzerTool from './components/ResumeAnalyzerTool';
import SwotAnalyzerTool from './components/SwotAnalyzerTool';
import EmailGeneratorTool from './components/EmailGeneratorTool';
import ConceptSimplifierTool from './components/ConceptSimplifierTool';
import JobDescriptionGeneratorTool from './components/JobDescriptionGeneratorTool';
import BlogPostIdeaGeneratorTool from './components/BlogPostIdeaGeneratorTool';
import SentimentAnalyzerTool from './components/SentimentAnalyzerTool';
import PersonaGeneratorTool from './components/PersonaGeneratorTool';
import WorkflowTool from './components/WorkflowTool';
import CustomAgentCreatorTool from './components/CustomAgentCreatorTool';
import MeetingAssistantTool from './components/MeetingAssistantTool';
import RouteOptimizerTool from './components/RouteOptimizerTool';


// Map agent IDs to their corresponding tool components
const toolComponents: Record<string, React.FC<{ agent: Agent; onToggleSidebar: () => void; }>> = {
    'presentation_generator': PresentationGeneratorTool,
    'resume_analyzer': ResumeAnalyzerTool,
    'swot_analyzer': SwotAnalyzerTool,
    'email_writer': EmailGeneratorTool,
    'concept_simplifier': ConceptSimplifierTool,
    'job_description_writer': JobDescriptionGeneratorTool,
    'blog_post_idea_generator': BlogPostIdeaGeneratorTool,
    'sentiment_analyzer': SentimentAnalyzerTool,
    'persona_generator': PersonaGeneratorTool,
    'content_workflow': WorkflowTool,
    'custom_agent_creator': CustomAgentCreatorTool,
    'meeting_assistant': MeetingAssistantTool,
    'route_optimizer': RouteOptimizerTool,
};

interface AppContentProps {
    userName: string;
}

const AppContent: React.FC<AppContentProps> = ({ userName }) => {
    const { agents, addAgent } = useCustomAgents(STATIC_AGENTS);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const getAgentFromHash = () => {
            const hash = window.location.hash.replace(/^#\//, '');
            if (!hash) return null;
            return agents.find(a => a.id === hash) || null;
        };
        
        const handleHashChange = () => {
            const agentFromHash = getAgentFromHash();
            if (agentFromHash) {
                setSelectedAgent(agentFromHash);
            } else {
                 if (window.location.hash === '#/' || window.location.hash === '') {
                    setSelectedAgent(null);
                 }
            }
        };

        window.addEventListener('hashchange', handleHashChange, false);
        handleHashChange();

        return () => {
            window.removeEventListener('hashchange', handleHashChange, false);
        };
    }, [agents]);

    const handleSelectAgent = useCallback((agent: Agent) => {
        window.location.hash = `/${agent.id}`;
        setIsSidebarOpen(false);
        setIsCommandPaletteOpen(false);
    }, []);

    const handleGoHome = useCallback(() => {
        window.location.hash = '/';
    }, []);
    
    const handleToggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);
    
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
             if (e.key === 'Escape' && isCommandPaletteOpen) {
                setIsCommandPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isCommandPaletteOpen]);

    const featuredAgentIds = [
        'content_workflow', 'custom_agent_creator', 'meeting_assistant',
        'resume_analyzer', 'strategic_advisor', 'news_researcher'
    ];
    const featuredAgents = featuredAgentIds.map(id => agents.find(a => a.id === id)).filter(Boolean) as Agent[];
    
    const renderContent = () => {
        if (!selectedAgent) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8 bg-transparent relative overflow-y-auto">
                    <div className="futuristic-background" aria-hidden="true">
                        <div className="sparks"></div>
                        <div className="vignette"></div>
                    </div>
                    <div className="absolute top-4 left-4 md:hidden z-20">
                        <button onClick={handleToggleSidebar} className="p-2 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <div className="text-center max-w-5xl mx-auto w-full relative z-10">
                        <div className="mb-12">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                                Bem-vindo(a), {userName}
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Selecione um assistente para começar ou pressione <kbd className="font-sans border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">Ctrl</kbd> + <kbd className="font-sans border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">K</kbd> para buscar.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredAgents.map((agent, index) => (
                                <button 
                                    key={agent.id}
                                    onClick={() => handleSelectAgent(agent)}
                                    className="group relative p-6 rounded-2xl text-left bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/10 hover:border-teal-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-1 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                                            {agent.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{agent.name}</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{agent.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        
        if (selectedAgent.isTool) {
            const ToolComponent = toolComponents[selectedAgent.id];
            if (ToolComponent) {
                if (selectedAgent.id === 'custom_agent_creator') {
                    return <CustomAgentCreatorTool 
                                key={selectedAgent.id} 
                                agent={selectedAgent} 
                                onToggleSidebar={handleToggleSidebar} 
                                onAgentCreated={addAgent}
                            />;
                }
                return <ToolComponent 
                            key={selectedAgent.id} 
                            agent={selectedAgent} 
                            onToggleSidebar={handleToggleSidebar} 
                        />;
            }
        }
        
        return <ChatWindow 
                    key={selectedAgent.id} 
                    agent={selectedAgent}
                    onToggleSidebar={handleToggleSidebar}
                />;
    };

    return (
        <div className="flex h-screen bg-transparent">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-20 md:hidden"
                    onClick={handleToggleSidebar}
                    aria-hidden="true"
                />
            )}
            <div className={`
                fixed inset-y-0 left-0 z-30 transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
            `}>
                <AgentSelector
                    agents={agents}
                    selectedAgentId={selectedAgent?.id || null}
                    onSelectAgent={handleSelectAgent}
                    onGoHome={handleGoHome}
                    userName={userName}
                />
            </div>
        
            <main className="flex-1 flex flex-col h-full relative">
                 {renderContent()}
            </main>
        
            <ToastContainer />
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                agents={agents}
                onSelectAgent={handleSelectAgent}
            />
        </div>
    );
};

const App: React.FC = () => {
    const [userName, setUserName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // We use a timeout to prevent a flicker while checking localStorage
        const timer = setTimeout(() => {
            try {
                const storedName = localStorage.getItem('nexusAiUserName');
                if (storedName) {
                    setUserName(storedName);
                }
            } catch (error) {
                console.error("Failed to access localStorage:", error);
            } finally {
                setIsLoading(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleNameSubmit = (name: string) => {
        try {
            localStorage.setItem('nexusAiUserName', name);
            setUserName(name);
        } catch (error) {
            console.error("Failed to save name to localStorage:", error);
            // Still set name in state to allow app usage
            setUserName(name);
        }
    };

    if (isLoading) {
        // This blank screen prevents the welcome screen from flashing
        // before we've had a chance to check for a stored name.
        return <div className="h-screen w-screen bg-[#02040a]"></div>;
    }

    return (
        <ToastProvider>
            {!userName ? (
                <WelcomeScreen onNameSubmit={handleNameSubmit} />
            ) : (
                <AppContent userName={userName} />
            )}
        </ToastProvider>
    );
}

export default App;
