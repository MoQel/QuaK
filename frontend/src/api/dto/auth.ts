// --- Response DTOs ---

export interface AuthStatusResponse {
    authenticated: boolean;
    userId: string | null;
    guest: boolean;
    guestEnabled: boolean;
}
