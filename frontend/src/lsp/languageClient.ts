import { type LanguageClientConfig, LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { CloseAction, ErrorAction } from 'vscode-languageclient';
import { Uri } from 'monaco-editor';
import '@codingame/monaco-vscode-standalone-languages';

const clientWrappers = new Map<string, LanguageClientWrapper>();

export async function getLanguageClient(languageId: string, wsUrl: string): Promise<LanguageClientWrapper> {
    if (clientWrappers.has(languageId)) {
        return clientWrappers.get(languageId)!;
    }

    const languageClientConfig: LanguageClientConfig = {
        languageId: languageId,
        clientOptions: {
            documentSelector: ['python', 'py'],
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart }),
            },
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: Uri.parse('file:///tmp'),
            },
        },
        logLevel: LogLevel.Debug,
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: wsUrl,
            },
        },
    };

    const clientWrapper = new LanguageClientWrapper(languageClientConfig);

    try {
        await clientWrapper.start();
        clientWrappers.set(languageId, clientWrapper);
        console.log(`Language Client for ${languageId} started successfully.`);
    } catch (error) {
        console.error(`Error with starting language client for (${languageId}):`, error);
        throw error;
    }

    return clientWrapper;
}

export async function disposeLanguageClient(languageId: string) {
    const wrapper = clientWrappers.get(languageId);
    if (wrapper) {
        await wrapper.dispose();
        clientWrappers.delete(languageId);
    }
}

export const useLangClientConfig = () => {
    return async () => {
        const languageClientConfig: LanguageClientConfig = {
            languageId: 'python',
            clientOptions: {
                documentSelector: ['python', 'py'],
                errorHandler: {
                    error: () => ({ action: ErrorAction.Continue }),
                    closed: () => ({ action: CloseAction.DoNotRestart }),
                },
            },
            logLevel: LogLevel.Debug,
            connection: {
                options: {
                    $type: 'WebSocketUrl',
                    url: 'ws://localhost:30000/sampleServer',
                },
            },
        };

        const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);

        await languageClientWrapper.start();
    };
};
