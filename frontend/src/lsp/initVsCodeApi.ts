import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

let initialized = false;

export async function initVscodeApi() {
    if (initialized) return;
    initialized = true;

    loader.config({ monaco });

    const wrapper = new MonacoVscodeApiWrapper({
        $type: 'classic',
        viewsConfig: {
            $type: 'EditorService',
        },
        logLevel: LogLevel.Warning,
    });

    await wrapper.start({
        caller: 'my-react-editor',
    });
}
