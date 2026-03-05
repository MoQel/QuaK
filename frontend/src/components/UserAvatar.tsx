import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    /** The URL of the avatar image (may be null/undefined). */
    avatarUrl: string | null | undefined;
    /** Alt text for the image (usually the user's name). */
    alt: string;
    /** Size variant: 'sm' for navbar, 'lg' for profile page. */
    size?: 'sm' | 'lg';
    /** Additional CSS classes for the outer container. */
    className?: string;
    /** How often (in ms) to retry loading a failed image. Default: 30 000 ms. */
    retryIntervalMs?: number;
}

/**
 * A robust avatar component that:
 * 1. Shows the user's avatar image when the URL loads successfully.
 * 2. Falls back to a person icon (UserIcon) when:
 *    - avatarUrl is null/undefined
 *    - The image fails to load (broken URL, network error, etc.)
 * 3. Periodically retries loading a failed image (default: every 30s)
 *    so that if the URL becomes available again the avatar reappears.
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
    avatarUrl,
    alt,
    size = 'sm',
    className,
    retryIntervalMs = 30_000,
}) => {
    const [imgFailed, setImgFailed] = useState(false);
    const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset failure state whenever the URL changes
    useEffect(() => {
        setImgFailed(false);
    }, [avatarUrl]);

    // Clear retry timer on unmount
    useEffect(() => {
        return () => {
            if (retryTimerRef.current) {
                clearInterval(retryTimerRef.current);
            }
        };
    }, []);

    const handleError = useCallback(() => {
        setImgFailed(true);

        // Set up periodic retry if not already running
        if (!retryTimerRef.current && avatarUrl) {
            retryTimerRef.current = setInterval(() => {
                // Probe the URL with a new Image() to avoid flicker
                const probe = new Image();
                probe.onload = () => {
                    // Image is now loadable — clear the failure state and stop retrying
                    setImgFailed(false);
                    if (retryTimerRef.current) {
                        clearInterval(retryTimerRef.current);
                        retryTimerRef.current = null;
                    }
                };
                // Bust the cache so we actually re-fetch
                probe.src = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
            }, retryIntervalMs);
        }
    }, [avatarUrl, retryIntervalMs]);

    const showFallback = !avatarUrl || imgFailed;

    const sizeClasses = size === 'lg' ? 'w-24 h-24' : 'w-9 h-9';

    const iconSizeClasses = size === 'lg' ? 'w-12 h-12' : 'w-5 h-5';

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center overflow-hidden shrink-0',
                sizeClasses,
                showFallback ? 'bg-gradient-to-br from-blue-400 to-blue-700' : 'border-2 border-blue-500',
                className,
            )}
        >
            {showFallback ? (
                <UserIcon className={cn(iconSizeClasses, 'text-white')} />
            ) : (
                <img
                    src={avatarUrl}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={handleError}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                />
            )}
        </div>
    );
};

export default UserAvatar;
