import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { LogLevel } from '@codingame/monaco-vscode-api';

const clientWrappers = new Map<string, LanguageClientWrapper>();

export async function getLanguageClient(languageId: string, wsUrl: string): Promise<LanguageClientWrapper> {
    if (clientWrappers.has(languageId)) {
        return clientWrappers.get(languageId)!;
    }

    const clientWrapper = new LanguageClientWrapper({
        languageId: languageId,
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: wsUrl,
            },
        },
        clientOptions: {
            documentSelector: [languageId],
        },
        logLevel: LogLevel.Warning,
    });

    await clientWrapper.start();
    clientWrappers.set(languageId, clientWrapper);

    return clientWrapper;
}

export async function disposeLanguageClient(languageId: string) {
    const wrapper = clientWrappers.get(languageId);
    if (wrapper) {
        await wrapper.dispose();
        clientWrappers.delete(languageId);
    }
}
