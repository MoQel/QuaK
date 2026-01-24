import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/api';

export interface UserDto {
    userId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    emailVerified: boolean;
}

export function useCurrentUser() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [user, setUser] = useState<UserDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            // Wait for AuthContext to finish initialization
            if (isAuthLoading) {
                return;
            }

            if (!isAuthenticated) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                // Ensure loading state is set while fetching
                setLoading(true);
                const data = await api.get<UserDto>('/api/me', { skipRedirect: true });
                setUser(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch user:', err);
                setError('Failed to load user data');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [isAuthenticated, isAuthLoading]);

    return { user, loading: loading || isAuthLoading, error };
}
