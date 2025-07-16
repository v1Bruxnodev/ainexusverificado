import React, { useState, useEffect, useCallback } from 'react';
import type { Agent } from '../types';
import { ICONS } from '../constants';

const CUSTOM_AGENTS_KEY = 'customAiAgents';

const getIconComponent = (iconName: string): React.ReactNode => {
    const IconComponent = ICONS[iconName];
    return IconComponent ? <IconComponent /> : <ICONS.CodeIcon />; // Fallback icon
};

export const useCustomAgents = (staticAgents: Agent[]) => {
    const [agents, setAgents] = useState<Agent[]>(staticAgents);

    useEffect(() => {
        try {
            const storedAgentsRaw = localStorage.getItem(CUSTOM_AGENTS_KEY);
            if (storedAgentsRaw) {
                const storedAgents = JSON.parse(storedAgentsRaw);
                const customAgentsWithIcons = storedAgents.map((agent: any) => ({
                    ...agent,
                    icon: getIconComponent(agent.iconName), // Re-hydrate the React component
                }));
                setAgents([...staticAgents, ...customAgentsWithIcons]);
            } else {
                 setAgents(staticAgents);
            }
        } catch (error) {
            console.error("Failed to load custom agents from localStorage:", error);
            localStorage.removeItem(CUSTOM_AGENTS_KEY);
            setAgents(staticAgents);
        }
    }, [staticAgents]);

    const addAgent = useCallback((newAgentData: Omit<Agent, 'id' | 'icon' | 'isCustom'> & { iconName: string }): Agent => {
        const customAgentsRaw = localStorage.getItem(CUSTOM_AGENTS_KEY);
        const customAgents = customAgentsRaw ? JSON.parse(customAgentsRaw) : [];

        // This object, including iconName, is what gets stored.
        const newAgentForStorage = {
            id: `custom_${Date.now()}`,
            ...newAgentData,
            isCustom: true,
        };

        const updatedAgentsForStorage = [...customAgents, newAgentForStorage];
        localStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(updatedAgentsForStorage));

        // Create the agent object for the application state, ensuring it matches the Agent type.
        const { iconName, ...restOfAgentData } = newAgentData;
        
        const newAgentForState: Agent = {
            id: newAgentForStorage.id,
            ...restOfAgentData,
            icon: getIconComponent(iconName),
            isCustom: true,
        };

        setAgents(prev => [...prev, newAgentForState]);
        
        // Return the state-ready agent object.
        return newAgentForState;
    }, []);

    return { agents, addAgent };
};