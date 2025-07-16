import type { User } from '../types';

// Helper function to handle fetch responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
        // For 204 No Content response, return an empty object or handle as needed
        if (response.status === 204) {
            return {} as T;
        }
        return response.json();
    } else {
        const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}` }));
        throw new Error(errorData.error || `Erro ${response.status}`);
    }
}

export const register = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse<User>(response);
};

export const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse<User>(response);
};

export const logout = async (): Promise<void> => {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) {
        // Even if API call fails, we proceed with client-side logout
        console.error("Logout API call failed, but continuing client-side logout.");
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            return null; // Not logged in
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch current user", error);
        return null;
    }
};
