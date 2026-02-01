import { useCallback, useEffect } from 'react';
import { Monaco } from '@monaco-editor/react';

export function useMonacoTheme(monaco: Monaco | null, theme: 'dark' | 'light') {
    const applyTheme = useCallback(() => {
        if (!monaco) return;

        const getCssVar = (name: string) => {
            return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        };

        monaco.editor.defineTheme('my-theme', {
            base: theme === 'dark' ? 'vs-dark' : 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': getCssVar('--editor-bg'),
                'editorLineNumber.foreground': getCssVar('--editor-line-number'),
                'editorLineNumber.activeForeground': getCssVar('--editor-line-number'),
            },
        });

        monaco.editor.setTheme('my-theme');
    }, [monaco, theme]);

    useEffect(() => {
        // Wait for the browser to apply the CSS class and recalculate styles
        const handle = requestAnimationFrame(() => {
            applyTheme();
        });
        return () => cancelAnimationFrame(handle);
    }, [applyTheme]);

    return { applyTheme };
}
