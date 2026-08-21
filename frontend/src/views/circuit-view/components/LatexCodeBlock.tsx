import { Check, Copy } from 'lucide-react';
import { type CSSProperties } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button.tsx';
import { useTheme } from '@/theme.tsx';
import { ExportStatus } from '@/hooks/useQuantikzExport.ts';

interface LatexCodeBlockProps {
    code: string;
    onCopy: () => void;
    status: ExportStatus;
}

const CODE_STYLE: CSSProperties = {
    margin: 0,
    background: 'transparent',
    maxHeight: '420px',
    overflow: 'auto',
    padding: '1rem',
    paddingRight: '3rem',
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    fontFamily: 'monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
};

export function LatexCodeBlock({ code, onCopy, status }: Readonly<LatexCodeBlockProps>) {
    const { theme } = useTheme();

    return (
        <div className="relative rounded-md border border-border bg-bg-subtle overflow-y-auto">
            <Button
                variant="ghost"
                size="icon"
                onClick={onCopy}
                className="absolute right-2 top-2 z-10"
                aria-label="Copy LaTeX code"
            >
                {status === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>

            <SyntaxHighlighter language="latex" style={theme === 'dark' ? oneDark : oneLight} customStyle={CODE_STYLE}>
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
