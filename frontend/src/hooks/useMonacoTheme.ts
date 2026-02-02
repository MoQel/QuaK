import { useCallback, useEffect } from 'react';
import { Monaco } from '@monaco-editor/react';

export function useMonacoTheme(monaco: Monaco | null, theme: 'dark' | 'light') {
    const applyTheme = useCallback(() => {
        if (!monaco) return;

        try {
            const getCssVar = (name: string) => {
                if (typeof window === 'undefined') return '';
                const style = getComputedStyle(document.documentElement);
                return style ? style.getPropertyValue(name).trim() : '';
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
        } catch (e) {
            console.warn('Theme apply failed:', e);
        }
    }, [monaco, theme]);

    useEffect(() => {
        if (monaco) {
            const handle = requestAnimationFrame(() => {
                applyTheme();
            });
            return () => cancelAnimationFrame(handle);
        }
    }, [applyTheme, monaco]);

    return { applyTheme };
}
