// API client for Next.js - uses fetch instead of axios
const getBaseURL = () => {
    if (typeof window === 'undefined') {
        // Server-side: use relative URL or environment variable
        return process.env.NEXT_PUBLIC_API_URL || '/api';
    }
    
    // Client-side: use relative URL for same-origin requests
    return '/api';
};

export const API = {
    get: async (url: string, options?: RequestInit) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> || {}),
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${getBaseURL()}${url}`, {
            ...options,
            headers,
            credentials: 'include',
        });
        
        const data = await response.json().catch(() => ({}));
        
        return {
            status: response.status,
            data,
            statusText: response.statusText,
        };
    },
    
    post: async (url: string, body?: any, options?: RequestInit) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> || {}),
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${getBaseURL()}${url}`, {
            ...options,
            method: 'POST',
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
        });
        
        const data = await response.json().catch(() => ({}));
        
        return {
            status: response.status,
            data,
            statusText: response.statusText,
        };
    },

    patch: async (url: string, body?: unknown, options?: RequestInit) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${getBaseURL()}${url}`, {
            ...options,
            method: 'PATCH',
            headers,
            credentials: 'include',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const data = await response.json().catch(() => ({}));

        return {
            status: response.status,
            data,
            statusText: response.statusText,
        };
    },

    delete: async (url: string, options?: RequestInit) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: Record<string, string> = {
            ...(options?.headers as Record<string, string> || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${getBaseURL()}${url}`, {
            ...options,
            method: 'DELETE',
            headers,
            credentials: 'include',
        });

        const data = await response.json().catch(() => ({}));

        return {
            status: response.status,
            data,
            statusText: response.statusText,
        };
    },
};
