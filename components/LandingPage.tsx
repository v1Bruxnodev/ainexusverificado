import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ToastType } from '../types';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAuth();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    addToast('As senhas não correspondem.', ToastType.ERROR);
                    return;
                }
                await register(email, password);
                // O redirecionamento é o feedback, não precisa de toast de sucesso aqui.
            } else {
                await login(email, password);
                // O redirecionamento é o feedback.
            }
        } catch (error: any) {
            addToast(error.message, ToastType.ERROR);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-transparent text-white">
            <div className="futuristic-background" aria-hidden="true">
                <div className="vignette"></div>
            </div>
            
            <div className="relative z-10 isolate px-6 pt-14 lg:px-8 flex flex-col min-h-screen">
                 <header className="absolute inset-x-0 top-0 z-10">
                    <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                        <div className="flex lg:flex-1">
                            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-3">
                                <span className="p-2 bg-gradient-to-br from-teal-400/20 to-blue-500/20 text-white rounded-lg border border-teal-500/20">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7">
                                        <defs>
                                            <linearGradient id="icon-gradient-landing" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#5eead4"/>
                                                <stop offset="100%" stopColor="#3b82f6"/>
                                            </linearGradient>
                                        </defs>
                                        <path fill="url(#icon-gradient-landing)" d="M13.4,2.01,7.22,12,13.4,21.99h3.38L10.6,12,l6.18-9.99ZM7.22,2.01,1,12,l6.22,9.99h3.38L4.4,12,l6.19-9.99Z"/>
                                    </svg>
                                </span>
                                <div style={{ fontFamily: "'Exo 2', sans-serif" }} className="text-xl text-white tracking-wider">
                                    <span style={{fontWeight: 600}}>NEXUS</span>
                                    <span style={{fontWeight: 300}} className="text-teal-400"> AI</span>
                                </div>
                            </a>
                        </div>
                    </nav>
                </header>

                <main className="flex-grow flex items-center justify-center">
                    <div className="mx-auto max-w-md w-full animate-fade-in-up">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
                            <h2 className="text-3xl font-bold text-center text-white mb-2">
                                {mode === 'login' ? 'Bem-vindo(a) de Volta' : 'Crie sua Conta'}
                            </h2>
                            <p className="text-center text-gray-300 mb-8">
                                {mode === 'login' ? 'Acesse sua força de trabalho digital.' : 'Comece sua jornada na automação inteligente.'}
                            </p>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-200">Email</label>
                                    <div className="mt-2">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full rounded-md border-0 bg-white/10 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm sm:leading-6 transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-200">Senha</label>
                                    <div className="mt-2">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-md border-0 bg-white/10 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm sm:leading-6 transition"
                                        />
                                    </div>
                                </div>
                                {mode === 'register' && (
                                     <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-200">Confirmar Senha</label>
                                        <div className="mt-2">
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="block w-full rounded-md border-0 bg-white/10 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm sm:leading-6 transition"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex w-full items-center justify-center rounded-md bg-teal-500 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 transition-all disabled:bg-gray-500 disabled:cursor-wait"
                                    >
                                       {isSubmitting ? (
                                           <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processando...
                                           </>
                                       ) : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
                                    </button>
                                </div>
                            </form>
                            <p className="mt-8 text-center text-sm text-gray-300">
                                {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold leading-6 text-teal-400 hover:text-teal-300 transition">
                                    {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
                                </button>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AuthPage;