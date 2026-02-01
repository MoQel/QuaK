import { api } from '@/api/api.ts';
import { Base64 } from 'js-base64';
import { FileContentResponse, FileDetailsResponse } from '@/api/dto/filesystem.ts';

export async function fetchFileContent(id: string): Promise<{ content: string; ext: string } | null> {
    try {
        const [contentRes, detailsRes] = await Promise.all([
            api.get<FileContentResponse>(`/api/file/${id}/content`),
            api.get<FileDetailsResponse>(`/api/file/${id}`),
        ]);

        const content = Base64.decode(contentRes.content);
        const filename = detailsRes.name || '';
        const ext = filename.includes('.') ? filename.split('.').pop()! : 'txt';

        return { content, ext };
    } catch (error) {
        console.error(`Failed to load file ${id}`, error);
        return null;
    }
}

export async function saveFileContent(id: string, content: string) {
    const encodedContent = Base64.encode(content);
    await api.put(`/api/file/${id}/content`, {
        content: encodedContent,
        contentType: 'text/plain',
    });
}
