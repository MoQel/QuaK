// --- Request DTOs ---

export interface ProjectRoleRequest {
    userId: string;
    role: string;
}

// --- Response DTOs ---

export interface ProjectRoleResponse {
    userId: string;
    projectId: string;
    role: string | null;
}

export interface UserSearchResult {
    userId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    emailVerified: boolean;
}
