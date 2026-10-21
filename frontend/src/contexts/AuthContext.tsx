import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { api } from '@/api/api';
import { API_BASE_URL } from '@/api/backendUrls';
import type { AuthStatusResponse } from '@/api/dto/auth';

// Minimal user identity for AuthContext
interface User {
    userId: string;
    guest: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    guestEnabled: boolean;
    isLoading: boolean;
    login: (provider?: 'google' | 'github') => void;
    signInAsGuest: () => Promise<void>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [guestEnabled, setGuestEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
                credentials: 'include', // Important: include cookies
            });

            if (response.ok) {
                const data: AuthStatusResponse = await response.json();
                setGuestEnabled(data.guestEnabled);
                if (data.authenticated && data.userId) {
                    setUser({ userId: data.userId, guest: data.guest });
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
    }, []);

    useEffect(() => {
        checkAuthStatus().then();
    }, [checkAuthStatus]);

    const login = useCallback((provider: 'google' | 'github' = 'google') => {
        // Redirect to backend OAuth2 login endpoint
        globalThis.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
    }, []);

    const signInAsGuest = useCallback(async () => {
        const data = await api.post<AuthStatusResponse>('/api/auth/guest');
        if (data.userId) {
            setUser({ userId: data.userId, guest: true });
        }
    }, []);

    const logout = useCallback(() => {
        api.post('/api/auth/logout')
            .catch((error) => console.error('Logout failed:', error))
            .finally(() => {
                // Redirect to home page to ensure all states are cleared
                globalThis.location.href = '/';
            });
    }, []);

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isAuthenticated: !!user,
            isGuest: !!user?.guest,
            guestEnabled,
            isLoading,
            login,
            signInAsGuest,
            logout,
            checkAuthStatus,
        }),
        [user, guestEnabled, isLoading, login, signInAsGuest, logout, checkAuthStatus],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
