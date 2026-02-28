import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'json':
            return 'application/json';
        case 'html':
        case 'htm':
            return 'text/html';
        case 'css':
            return 'text/css';
        case 'js':
            return 'application/javascript';
        case 'ts':
        case 'tsx':
        case 'jsx':
            return 'application/typescript';
        case 'py':
            return 'text/x-python';
        case 'qasm':
            return 'text/x-qasm';
        case 'qrisp':
            return 'text/x-qrisp';
        case 'png':
            return 'image/png';
        case 'jpeg':
        case 'jpg':
            return 'image/jpeg';
        case 'gif':
            return 'image/gif';
        case 'svg':
            return 'image/svg+xml';
        case 'xml':
            return 'application/xml';
        case 'md':
            return 'text/markdown';
        case 'csv':
            return 'text/csv';
        default:
            return 'text/plain';
    }
}
