import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import {
    RegisteredFileSystemProvider,
    registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override';

// Global registration of languages
import '@codingame/monaco-vscode-standalone-languages';

loader.config({ monaco });

export const fileSystemProvider = new RegisteredFileSystemProvider(false);

let initialized = false;

export async function initVscodeApi() {
    if (initialized) return;
    initialized = true;

    registerFileSystemOverlay(1, fileSystemProvider);

    const wrapper = new MonacoVscodeApiWrapper({
        $type: 'classic',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer: document.getElementById('root') as HTMLElement,
        },
        logLevel: LogLevel.Debug,
        monacoWorkerFactory: configureDefaultWorkerFactory,
    });

    await wrapper.start();
    console.log('VS Code API & Languages initialized');
}
