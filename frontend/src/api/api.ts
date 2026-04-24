/**
 * API utility for making authenticated requests to the backend
 * All requests automatically include session cookies
 */

/**
 * Example usage:
 *
 * // GET request
 * const projects = await api.get<Project[]>('/api/projects');
 *
 * // POST request
 * const newProject = await api.post<Project>('/api/projects', { name: 'My Project' });
 *
 * // PUT request
 * const updated = await api.put<Project>('/api/projects/123', { name: 'Updated Name' });
 *
 * // DELETE request
 * await api.delete('/api/projects/123');
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
    headers?: HeadersInit;
    skipRedirect?: boolean;
}

interface ProblemDetail {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
}

export class ProblemDetailError extends Error {
    public readonly status?: number;
    public readonly title?: string;
    public readonly detail?: string;
    public readonly instance?: string;

    constructor(problem: ProblemDetail) {
        super(problem.detail ?? problem.title ?? 'Unknown error');
        this.name = 'ProblemDetailError';
        this.status = problem.status;
        this.title = problem.title;
        this.detail = problem.detail;
        this.instance = problem.instance;
    }
}

/**
 * Make an authenticated API request
 * Automatically includes credentials (session cookie)
 */
export async function apiRequest<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get CSRF token from cookie
    const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const defaultOptions: FetchOptions = {
        credentials: 'include', // Always include session cookie
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
            ...options.headers,
        },
    };

    const response = await fetch(url, defaultOptions);

    // Handle authentication errors
    if (response.status === 401) {
        if (!options.skipRedirect) {
            // Redirect to login if not authenticated
            globalThis.location.href = '/login';
        }
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json') || contentType?.includes('application/problem+json')) {
            throw new ProblemDetailError(await response.json());
        }
        throw new Error(response.statusText);
    }

    // Return parsed JSON or text based on content type
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return await response.json();
    } else {
        return (await response.text()) as unknown as T;
    }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: <T>(endpoint: string, options?: FetchOptions) => apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data?: unknown, options?: FetchOptions) => {
        const isString = typeof data === 'string';
        const headers = { ...options?.headers } as Record<string, string>;

        if (isString && !headers['Content-Type']) {
            headers['Content-Type'] = 'text/plain';
        }

        return apiRequest<T>(endpoint, {
            ...options,
            headers,
            method: 'PUT',
            body: isString ? data : JSON.stringify(data),
        });
    },

    delete: <T>(endpoint: string, options?: FetchOptions) => apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

    patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
};
