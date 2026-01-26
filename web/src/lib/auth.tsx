import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from './axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    // Define logout here so it's available within useEffect
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        const fetchMe = async () => {
            if (!token) {
                setUser(null);
                return;
            }
            try {
                // Assuming 'api' is an imported axios instance or similar
                const res = await api.get('/me');
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user:", err);
                // If fetching me fails (e.g. token expired), logout
                logout();
            }
        };

        fetchMe();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // User will be fetched by effect or we can set it directly if passed
        // But better to rely on Single Source of Truth if possible, or optimistic update
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
