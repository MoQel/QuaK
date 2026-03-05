import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { api } from '@/api/api';

interface UserDto {
    userId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    emailVerified: boolean;
}

export const Profile: React.FC = () => {
    const [user, setUser] = useState<UserDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get<UserDto>('/api/me');
                setUser(data);
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setError('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-special" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-destructive">Error</h1>
                <p className="text-muted-foreground">{error || 'User not found'}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>

            <div className="grid gap-6">
                {/* Profile Overview Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-6">
                            <UserAvatar avatarUrl={user.avatarUrl} alt={user.name} size="lg" />
                            <div className="flex-1">
                                <CardTitle className="text-2xl mb-2">{user.name}</CardTitle>
                                <CardDescription className="text-base mb-3">{user.email}</CardDescription>
                                <div className="flex gap-2 flex-wrap">
                                    {user.emailVerified && (
                                        <Badge variant="secondary" className="bg-special text-text pointer-events-none">
                                            Verified Email
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="pointer-events-none">
                                        User ID: {user.userId}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Welcome back, {user.name}! This is your personal profile dashboard.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
