import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { User, AuthContextType } from '../types';
import * as authService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const initializeAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Auth initialization failed", error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            // Use timeout to prevent flash of login screen
            setTimeout(() => setIsLoading(false), 200);
        }
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = async (email: string, password: string) => {
        const loggedInUser = await authService.login(email, password);
        setUser(loggedInUser);
        setIsAuthenticated(true);
    };

    const register = async (email: string, password: string) => {
        const newUser = await authService.register(email, password);
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        // Clear all agent histories on logout
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('chatHistory_')) {
                localStorage.removeItem(key);
            }
        });
        window.location.hash = '/'; // Go to home after logout
    };

    const value = {
        user,
        isAuthenticated,
        login,
        register,
        logout,
        isLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
