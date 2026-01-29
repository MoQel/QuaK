import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/api/api';

// Minimal user identity for AuthContext
interface User {
    userId: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider?: 'google' | 'github') => void;
    logout: () => void;
    checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
                credentials: 'include', // Important: include cookies
            });

            if (response.ok) {
                const data = await response.json();
                // Expecting { authenticated: boolean, userId: string }
                if (data.authenticated && data.userId) {
                    setUser({ userId: data.userId });
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to check auth status:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = (provider: 'google' | 'github' = 'google') => {
        // Redirect to backend OAuth2 login endpoint
        window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            // Redirect to home page to ensure all states are cleared
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                checkAuthStatus,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
