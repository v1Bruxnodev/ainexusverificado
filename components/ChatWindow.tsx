import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent, ChatMessage as ChatMessageType } from '../types';
import { MessageAuthor, ToastType } from '../types';
import { createChatSession, sendMessageStream } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';
import { useToast } from '../contexts/ToastContext';
import type { Chat } from '@google/genai';

interface ChatWindowProps {
    agent: Agent;
    onToggleSidebar: () => void;
}

const getHistoryFromStorage = (agentId: string): ChatMessageType[] | null => {
    const storedHistory = localStorage.getItem(`chatHistory_${agentId}`);
    if (storedHistory) {
        try {
            return JSON.parse(storedHistory);
        } catch (e) {
            console.error("Falha ao analisar o histórico do chat:", e);
            return null;
        }
    }
    return null;
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agent, onToggleSidebar }) => {
    const { addToast } = useToast();
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);
    const [currentInput, setCurrentInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [imagePreview, setImagePreview] = useState<{ data: string; mimeType: string; url: string } | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const storedHistory = getHistoryFromStorage(agent.id);
        const initialMessages = storedHistory && storedHistory.length > 0
            ? storedHistory
            : [{ author: MessageAuthor.AI, text: agent.welcomeMessage }];
        
        setMessages(initialMessages);
        
        const historyForApi = initialMessages[0]?.text !== agent.welcomeMessage ? initialMessages : [];
        const newChat = createChatSession(agent.systemInstruction, historyForApi);
        setChat(newChat);

    }, [agent]);

    useEffect(() => {
        if (messages.length > 0 && (messages.length > 1 || messages[0].text !== agent.welcomeMessage)) {
            localStorage.setItem(`chatHistory_${agent.id}`, JSON.stringify(messages));
        }
    }, [messages, agent.id, agent.welcomeMessage]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

     useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [currentInput]);
    
    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }
    
    const executeSendMessage = useCallback(async (
        chatToUse: Chat,
        text: string,
        image?: { data: string; mimeType: string }
    ) => {
        if (!chatToUse) return;

        const userMessage: ChatMessageType = {
            author: MessageAuthor.USER,
            text,
            ...(image && { image: { data: image.data, mimeType: image.mimeType } })
        };

        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);
        setIsGenerating(true);
        abortControllerRef.current = new AbortController();

        try {
            const stream = sendMessageStream(chatToUse, text, agent.useGoogleSearch, image, abortControllerRef.current.signal);

            let isFirstChunk = true;
            for await (const chunk of stream) {
                if (isFirstChunk) {
                    setIsThinking(false);
                    setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);
                    isFirstChunk = false;
                }
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.author === MessageAuthor.AI) {
                        if (chunk.text) lastMessage.text += chunk.text;
                        if (chunk.sources) lastMessage.sources = chunk.sources;
                    }
                    return newMessages;
                });
            }
        } catch (error: any) {
             console.error("Erro no envio da mensagem:", error);
             const errorMessage = error.name === 'AbortError' 
                 ? "Geração interrompida." 
                 : "Ocorreu um erro ao processar sua solicitação.";
             addToast(errorMessage, error.name === 'AbortError' ? ToastType.INFO : ToastType.ERROR);
             
             // Limpa a mensagem da IA que foi adicionada de forma otimista se estiver vazia
             setMessages(prev => {
                 const lastMessage = prev[prev.length - 1];
                 if (lastMessage && lastMessage.author === MessageAuthor.AI && lastMessage.text === '') {
                     return prev.slice(0, -1);
                 }
                 return prev;
             });
        } finally {
            setIsGenerating(false);
            setIsThinking(false);
            abortControllerRef.current = null;
        }
    }, [agent.useGoogleSearch, addToast]);

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const canSubmit = !isGenerating && (currentInput.trim() || imagePreview);
        if (!canSubmit || !chat) return;

        const textToSend = currentInput;
        const imageToSend = imagePreview ? { data: imagePreview.data, mimeType: imagePreview.mimeType } : undefined;
        
        setCurrentInput('');
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        executeSendMessage(chat, textToSend, imageToSend);
    }, [currentInput, isGenerating, imagePreview, executeSendMessage, chat]);

    const handlePromptSuggestionClick = useCallback((prompt: string) => {
        if (isGenerating || !chat) return;
        executeSendMessage(chat, prompt, undefined);
    }, [isGenerating, executeSendMessage, chat]);

    const handleRegenerateResponse = useCallback(async () => {
        if (isGenerating || isThinking) return;
        
        addToast("Gerando nova resposta...", ToastType.INFO);

        const lastAiMessageIndex = messages.map(m => m.author).lastIndexOf(MessageAuthor.AI);
        if (lastAiMessageIndex === -1) return;

        let lastUserMessageIndex = -1;
        for (let i = lastAiMessageIndex - 1; i >= 0; i--) {
            if (messages[i].author === MessageAuthor.USER) {
                lastUserMessageIndex = i;
                break;
            }
        }
        if (lastUserMessageIndex === -1) return;
        
        const lastUserMessage = messages[lastUserMessageIndex];
        const historyForNewChat = messages.slice(0, lastUserMessageIndex);

        setMessages(historyForNewChat);
        
        const newChat = createChatSession(agent.systemInstruction, historyForNewChat);
        setChat(newChat);

        executeSendMessage(newChat, lastUserMessage.text, lastUserMessage.image);
    }, [isGenerating, isThinking, messages, agent.systemInstruction, executeSendMessage, addToast]);
    
    const handleClearChat = useCallback(() => {
        localStorage.removeItem(`chatHistory_${agent.id}`);
        const initialMessage = { author: MessageAuthor.AI, text: agent.welcomeMessage };
        setMessages([initialMessage]);
        const newChat = createChatSession(agent.systemInstruction);
        setChat(newChat);
        addToast("Histórico da conversa limpo.", ToastType.INFO);
    }, [agent, addToast]);

    const handleExportChat = () => {
        const historyToExport = messages
            .map(msg => `[${msg.author.toUpperCase()}]\n${msg.text}\n`)
            .join('\n---\n\n');
        
        const blob = new Blob([historyToExport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_history_${agent.id}_${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("Histórico exportado com sucesso!", ToastType.SUCCESS);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const base64Data = await fileToBase64(file);
                const objectUrl = URL.createObjectURL(file);
                setImagePreview({ data: base64Data, mimeType: file.type, url: objectUrl });
            } else {
                addToast("Por favor, selecione um arquivo de imagem válido.", ToastType.ERROR);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };
    
    const toggleListening = () => {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    useEffect(() => {
        if (!recognition) return;

        recognition.onstart = () => {
            setIsListening(true);
            addToast("Microfone ativado. Pode falar!", ToastType.INFO);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCurrentInput(prev => prev + transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            addToast(`Erro no reconhecimento de voz: ${event.error}`, ToastType.ERROR);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
    }, [addToast]);

    const showPromptSuggestions = messages.length <= 1;

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-black/10">
            <header className="p-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-10">
                 <div className="flex items-center space-x-4">
                    <button onClick={onToggleSidebar} className="p-1 text-gray-600 dark:text-gray-400 rounded-md hover:bg-black/10 dark:hover:bg-white/10 md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="text-teal-500 dark:text-teal-400 hidden sm:block">{agent.icon}</div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{agent.name}</h2>
                        <div className="flex items-center space-x-2">
                           <span className="h-2 w-2 bg-green-400 rounded-full"></span>
                           <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Online</p>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportChat}
                        title="Exportar conversa"
                        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-label="Exportar conversa"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        onClick={handleClearChat}
                        title="Limpar conversa"
                        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-colors"
                        aria-label="Limpar conversa"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                 </div>
            </header>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4 sm:space-y-6">
                {messages.map((msg, index) => (
                    <ChatMessage 
                        key={index} 
                        message={msg} 
                        agentIcon={agent.icon} 
                        isLastMessage={index === messages.length - 1 && msg.author === MessageAuthor.AI}
                        isGenerating={isGenerating}
                        onRegenerate={handleRegenerateResponse}
                    />
                ))}
                {isThinking && <ThinkingIndicator agentIcon={agent.icon} />}
                 {showPromptSuggestions && agent.promptSuggestions && !isGenerating && !isThinking && (
                    <div className="pb-8 animate-fade-in-up">
                        <h3 className="text-center text-gray-500 dark:text-gray-400 text-sm mb-4 font-medium">Sugestões para começar</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                            {agent.promptSuggestions.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePromptSuggestionClick(prompt)}
                                    className="text-left p-4 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors duration-200 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                 )}
            </div>
            <div className="px-2 sm:px-4 lg:px-6 py-3 bg-transparent flex-shrink-0">
                {isGenerating && (
                     <div className="flex justify-center mb-2">
                         <button onClick={handleStopGeneration} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-lg transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                             Parar Geração
                         </button>
                     </div>
                )}
                 <div className="max-w-4xl mx-auto">
                    {imagePreview && (
                        <div className="relative mb-2 w-24 h-24 ml-2">
                            <img src={imagePreview.url} alt="Preview" className="w-full h-full object-cover rounded-md border border-black/10 dark:border-white/10" />
                            <button
                                type="button"
                                onClick={() => { 
                                    setImagePreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                    URL.revokeObjectURL(imagePreview.url);
                                }}
                                className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-700 dark:bg-gray-900 text-white rounded-full p-1 border-2 border-white dark:border-gray-700 hover:scale-110 transition-transform"
                                aria-label="Remover imagem"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="relative">
                        <div className="flex items-end bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl p-2 pl-4 transition-all focus-within:border-teal-500 focus-within:shadow-[0_0_20px_rgba(56,189,173,0.3)]">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors mr-2" aria-label="Anexar imagem">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </button>
                             <textarea
                                ref={textareaRef}
                                rows={1}
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleFormSubmit(e as any);
                                    }
                                }}
                                placeholder={`Converse com ${agent.name}...`}
                                disabled={isGenerating || isThinking}
                                className="w-full bg-transparent resize-none max-h-36 py-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-600 dark:placeholder-gray-500 focus:outline-none"
                            />
                            {recognition && (
                                <button type="button" onClick={toggleListening} className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`} aria-label="Gravar áudio">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                                </button>
                            )}
                            <button type="submit" disabled={isGenerating || isThinking || (!currentInput.trim() && !imagePreview)} className="p-2 ml-2 rounded-full bg-teal-500 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:bg-teal-600 scale-100 disabled:scale-100 hover:scale-105 active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;