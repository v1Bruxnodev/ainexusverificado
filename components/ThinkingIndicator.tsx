import React, { useState, useEffect } from 'react';

interface ThinkingIndicatorProps {
    agentIcon: React.ReactNode;
}

const THINKING_PHRASES = [
    "Consultando a base de conhecimento...",
    "Analisando os padrões...",
    "Gerando conexões neurais...",
    "Formatando a resposta...",
    "Acessando os circuitos de criatividade...",
    "Compilando os dados...",
];

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ agentIcon }) => {
    const [phrase, setPhrase] = useState(THINKING_PHRASES[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhrase(prev => {
                const currentIndex = THINKING_PHRASES.indexOf(prev);
                const nextIndex = (currentIndex + 1) % THINKING_PHRASES.length;
                return THINKING_PHRASES[nextIndex];
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-start space-x-3 sm:space-x-4 animate-fade-in-up justify-start">
            <div className="flex-shrink-0 p-2 rounded-full bg-gray-200 dark:bg-gray-700/50 text-teal-500 dark:text-teal-400 self-start">
                {agentIcon}
            </div>
            <div className="w-fit rounded-2xl shadow-lg bg-white dark:bg-gray-800/40 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-bl-lg px-4 py-3 flex items-center gap-3 mt-0">
                <div className="w-8 h-5 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle className="synapse-pulse" cx="50" cy="50" r="6" fill="#14b8a6" />
                        <circle className="synapse-pulse" cx="25" cy="35" r="4" fill="#14b8a6" style={{ animationDelay: '0.2s' }} />
                        <circle className="synapse-pulse" cx="75" cy="35" r="4" fill="#14b8a6" style={{ animationDelay: '0.4s' }} />
                        <circle className="synapse-pulse" cx="30" cy="65" r="4" fill="#14b8a6" style={{ animationDelay: '0.6s' }} />
                        <circle className="synapse-pulse" cx="70" cy="65" r="4" fill="#14b8a6" style={{ animationDelay: '0.8s' }} />
                    </svg>
                </div>
                 <span className="text-gray-500 dark:text-gray-400 italic text-sm">{phrase}</span>
            </div>
        </div>
    );
};

export default ThinkingIndicator;