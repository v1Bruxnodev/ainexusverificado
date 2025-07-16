import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { MessageAuthor, ToastType } from '../types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useToast } from '../contexts/ToastContext';

interface ChatMessageProps {
    message: ChatMessageType;
    agentIcon: React.ReactNode;
    isLastMessage: boolean;
    isGenerating: boolean;
    onRegenerate: () => void;
}

const CodeBlock: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
    const { addToast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const codeString = String(children).replace(/\n$/, '');

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'shell';

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            addToast("Código copiado!", ToastType.SUCCESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="font-mono text-sm relative group my-4 rounded-lg border bg-gray-500/5 dark:bg-black/30 border-gray-200 dark:border-white/10">
            <div className="flex justify-between items-center px-4 py-1.5 text-xs rounded-t-lg bg-gray-200/50 dark:bg-black/20 text-gray-600 dark:text-gray-400">
                <span>{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-sans transition-opacity opacity-50 group-hover:opacity-100 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    aria-label="Copiar código"
                >
                    {isCopied ? (
                         <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             Copiado!
                         </>
                    ) : (
                         <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                             Copiar
                         </>
                    )}
                </button>
            </div>
            <pre className="whitespace-pre-wrap break-words"><code className={`!bg-transparent block p-4 text-gray-800 dark:text-gray-200 ${className}`}>{children}</code></pre>
        </div>
    );
};

const SourceCitations: React.FC<{ sources: {uri: string, title: string}[] }> = ({ sources }) => (
    <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 tracking-wider">FONTES</h4>
        <div className="space-y-2">
            {sources.map((source, index) => (
                <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                    <span className="flex-shrink-0 w-4 h-4 text-center bg-gray-300 dark:bg-gray-600 group-hover:bg-teal-500 text-gray-700 dark:text-gray-300 group-hover:text-white text-xs font-bold rounded-full mt-0.5 transition-colors">{index + 1}</span>
                    <span className="truncate group-hover:underline">{source.title}</span>
                </a>
            ))}
        </div>
    </div>
);

const customRenderers = {
  h1: ({node, ...props}) => <h1 className="text-2xl sm:text-3xl font-bold my-5 text-gray-900 dark:text-white" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-xl sm:text-2xl font-bold mt-6 mb-3 pb-2 border-b border-black/10 dark:border-white/10 text-gray-900 dark:text-white" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-lg sm:text-xl font-bold mt-5 mb-2 text-gray-800 dark:text-gray-200" {...props} />,
  p: ({node, ...props}) => <p className="my-4 leading-relaxed" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc list-outside my-4 pl-5 sm:pl-6 space-y-2" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal list-outside my-4 pl-5 sm:pl-6 space-y-2" {...props} />,
  li: ({node, ...props}) => <li className="pl-2" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="my-4 px-4 py-2 bg-black/5 dark:bg-black/20 border-l-4 border-teal-500/50 text-gray-600 dark:text-gray-400" {...props} />,
  a: ({node, ...props}) => <a className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
  hr: ({node, ...props}) => <hr className="my-8 border-black/10 dark:border-white/10" {...props} />,
  code: ({node, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <CodeBlock className={className} {...props}>
        {String(children).replace(/\n$/, '')}
      </CodeBlock>
    ) : (
      <code className="text-sm font-mono bg-black/10 dark:bg-black/30 text-teal-700 dark:text-teal-300 rounded-sm px-1.5 py-1 mx-0.5" {...props}>
        {children}
      </code>
    );
  }
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, agentIcon, isLastMessage, isGenerating, onRegenerate }) => {
    const { addToast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

     useEffect(() => {
        return () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSpeaking]);
    
    const handleCopyResponse = () => {
        navigator.clipboard.writeText(message.text).then(() => {
            addToast("Resposta copiada!", ToastType.SUCCESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleToggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(message.text);
            utterance.lang = 'pt-BR';
            utterance.onend = () => setIsSpeaking(false);
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const isUser = message.author === MessageAuthor.USER;
    
    const textToRender = message.text + (isLastMessage && isGenerating ? '<span class="typing-cursor"></span>' : '');

    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
          <div className={`group flex items-start max-w-[95%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[70%] space-x-3 sm:space-x-4`}>
            {!isUser && (
                <div className="flex-shrink-0 p-2 rounded-full bg-gray-200 dark:bg-gray-700/50 text-teal-500 dark:text-teal-400 self-start">
                  {agentIcon}
                </div>
            )}
            
            <div className={`flex-1 overflow-hidden rounded-2xl shadow-lg ${isUser ? 'bg-gradient-to-br from-sky-500 to-blue-700 rounded-br-lg text-white' : 'bg-white dark:bg-gray-800/40 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-bl-lg'}`}>
                <div className="px-4 sm:px-5 py-3">
                    {message.image && (
                         <img 
                            src={`data:${message.image.mimeType};base64,${message.image.data}`}
                            alt="Upload do usuário" 
                            className="rounded-lg mb-3 max-h-72 w-auto max-w-full"
                        />
                    )}
                    {message.text && (
                      <div className={`text-sm leading-relaxed text-gray-800 dark:text-gray-200 break-words`}>
                          <ReactMarkdown
                              rehypePlugins={[rehypeRaw]}
                              remarkPlugins={[remarkGfm]}
                              components={customRenderers}
                          >
                              {textToRender}
                          </ReactMarkdown>
                      </div>
                    )}
                  {message.sources && message.sources.length > 0 && <SourceCitations sources={message.sources} />}
                </div>

                 {/* AI Actions moved inside the bubble, visible on hover, for layout stability */}
                {!isUser && message.text && (
                     <div className="border-t border-black/5 dark:border-white/10 px-3 py-1 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                            onClick={handleCopyResponse}
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                            title={isCopied ? "Copiado!" : "Copiar resposta"}
                        >
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2-2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                            )}
                        </button>
                        <button
                            onClick={handleToggleSpeech}
                            className={`p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${isSpeaking ? 'text-teal-500' : 'text-gray-500 dark:text-gray-400'}`}
                            title={isSpeaking ? "Parar leitura" : "Ouvir resposta"}
                        >
                             {isSpeaking ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                            )}
                        </button>
                        {isLastMessage && !isGenerating && (
                            <button
                                onClick={onRegenerate}
                                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                                title="Gerar novamente"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.398.812A5.002 5.002 0 005.999 7H8a1 1 0 010 2H3a1 1 0 01-1-1V3a1 1 0 011-1zm13.707 9.293a1 1 0 01.082 1.405l-1.398.812A5.002 5.002 0 0014.001 13H12a1 1 0 010-2h4.001a1 1 0 01.999 1v5a1 1 0 01-2 0v-2.101a7.002 7.002 0 01-11.899-2.186l1.398-.812A5.002 5.002 0 008 13h2a1 1 0 010 2H6.999a1 1 0 01-.999-1z" clipRule="evenodd" /></svg>
                            </button>
                         )}
                    </div>
                )}
            </div>

            {isUser && (
                 <div className="flex-shrink-0 p-2 ml-3 sm:ml-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 self-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
          </div>
        </div>
    );
};

export default ChatMessage;