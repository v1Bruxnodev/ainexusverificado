
import React, { useState, useEffect, useRef } from 'react';

interface WelcomeScreenProps {
    onNameSubmit: (name: string) => void;
}

const BOOT_SEQUENCE = [
    { text: "INITIALIZING NEXUS_CORE...", delay: 500 },
    { text: "VIRTUAL_AGENTS_ONLINE.", delay: 1000 },
    { text: "CONNECTION ESTABLISHED.", delay: 1500 },
];

const WELCOME_MESSAGES = [
    "Olá. Sou o Nexus, sua interface central para uma suíte de agentes de IA.",
    "Minha função é aumentar sua produtividade e criatividade.",
    "Para começarmos, como devo me referir a você?",
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNameSubmit }) => {
    const [name, setName] = useState('');
    const [bootStep, setBootStep] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Mouse position effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
            document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Boot sequence effect
    useEffect(() => {
        if (bootStep < BOOT_SEQUENCE.length) {
            const timer = setTimeout(() => {
                setBootStep(prev => prev + 1);
            }, BOOT_SEQUENCE[bootStep].delay / 2); // Faster boot
            return () => clearTimeout(timer);
        }
    }, [bootStep]);

    // Main typing animation effect
    useEffect(() => {
        if (bootStep < BOOT_SEQUENCE.length) return; // Wait for boot to finish

        if (isConfirming) {
            const finalMessage = `IDENTIDADE CONFIRMADA. BEM-VINDO, ${name.toUpperCase()}. INICIALIZANDO WORKSPACE...`;
            if (confirmationText.length < finalMessage.length) {
                const timeout = setTimeout(() => {
                    setConfirmationText(finalMessage.slice(0, confirmationText.length + 1));
                }, 40);
                return () => clearTimeout(timeout);
            } else {
                setTimeout(() => onNameSubmit(name.trim()), 1000);
            }
            return;
        }

        if (currentMessageIndex >= WELCOME_MESSAGES.length) {
            setIsTyping(false);
            setShowForm(true);
            setTimeout(() => inputRef.current?.focus(), 100);
            return;
        }

        const currentMessage = WELCOME_MESSAGES[currentMessageIndex];
        if (typedText.length < currentMessage.length) {
            const timeout = setTimeout(() => {
                setTypedText(currentMessage.slice(0, typedText.length + 1));
            }, 50);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setCurrentMessageIndex(prev => prev + 1);
                setTypedText('');
            }, 1200);
            return () => clearTimeout(timeout);
        }
    }, [typedText, currentMessageIndex, bootStep, isConfirming, confirmationText, name, onNameSubmit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setShowForm(false);
            setIsConfirming(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8 bg-transparent relative overflow-y-auto">
            <div className="futuristic-background" aria-hidden="true">
                <div className="sparks"></div>
                <div className="vignette"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-3xl">
                <div className="flex items-center space-x-3 mb-8 animate-fade-in-up">
                    <div className="p-3 bg-gradient-to-br from-teal-400/20 to-blue-500/20 text-white rounded-xl border border-teal-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-10 w-10">
                            <defs>
                                <linearGradient id="icon-gradient-welcome" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#5eead4"/>
                                    <stop offset="100%" stopColor="#3b82f6"/>
                                </linearGradient>
                            </defs>
                            <path fill="url(#icon-gradient-welcome)" d="M13.4,2.01,7.22,12,13.4,21.99h3.38L10.6,12,l6.18-9.99ZM7.22,2.01,1,12,l6.22,9.99h3.38L4.4,12,l6.19-9.99Z"/>
                        </svg>
                    </div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif" }} className="text-4xl text-gray-900 dark:text-white tracking-wider">
                        <span style={{fontWeight: 600}}>NEXUS</span>
                        <span style={{fontWeight: 300}} className="text-teal-500 dark:text-teal-400"> AI</span>
                    </div>
                </div>
                
                <div className="min-h-[200px] sm:min-h-[150px] w-full mb-10 font-mono text-lg sm:text-xl text-gray-300 text-left">
                    {BOOT_SEQUENCE.slice(0, bootStep).map((item, index) => (
                         <p key={index} className="animate-stagger-in" style={{animationDelay: `${index * 100}ms`}}><span className="text-gray-500">{`> `}</span>{item.text}</p>
                    ))}
                    {bootStep >= BOOT_SEQUENCE.length && (
                        <>
                             <p>
                                <span className="text-teal-400">[NEXUS_AI]: </span>
                                {typedText}
                                {isTyping && <span className="typing-cursor"></span>}
                            </p>
                            {isConfirming && (
                                <p>
                                    <span className="text-teal-400">[NEXUS_AI]: </span>
                                    {confirmationText}
                                    <span className="typing-cursor"></span>
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div className={`w-full max-w-lg transition-opacity duration-700 ${showForm ? 'opacity-100' : 'opacity-0'}`}>
                    {showForm && (
                        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 animate-fade-in-up font-mono text-lg sm:text-xl">
                             <label htmlFor="name-input" className="text-cyan-400 whitespace-nowrap">
                                 [INFORME_SEU_NOME] ~$
                             </label>
                             <input
                                id="name-input"
                                ref={inputRef}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent text-gray-200 focus:outline-none"
                                required
                                autoComplete="off"
                            />
                            <button type="submit" className="hidden">Submit</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
