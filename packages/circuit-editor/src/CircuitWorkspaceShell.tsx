import { Button } from '@quak/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@quak/ui/resizable';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const LIBRARY_DEFAULT_SIZE = 30;
const LIBRARY_MIN_SIZE = 20;
const LIBRARY_MAX_SIZE = 40;

interface CircuitWorkspaceShellProps {
    library: ReactNode;
    editor: ReactNode;
    /**
     * Collapse is uncontrolled: the shell owns the state and only reports changes.
     * Each host persists it however it likes (localStorage in the web IDE, webview
     * state in the extension). The shell knows nothing about any storage.
     */
    defaultCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    /** Namespaces the resizable panel-size persistence; omit to use the default. */
    layoutStorageId?: string;
}

/**
 * The circuit editor's outer layout: the library on the left (resizable and
 * collapsible), the editor filling the rest. Purely presentational: library and
 * editor are injected as slots, so the web IDE and the VSCode extension share the
 * exact same chrome and each wires in its own data.
 */
export function CircuitWorkspaceShell({
    library,
    editor,
    defaultCollapsed = false,
    onCollapsedChange,
    layoutStorageId = 'circuit-workspace-layout',
}: Readonly<CircuitWorkspaceShellProps>) {
    const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(defaultCollapsed);

    const toggleLibrary = () => {
        setIsLibraryCollapsed((collapsed) => {
            const next = !collapsed;
            onCollapsedChange?.(next);
            return next;
        });
    };

    if (isLibraryCollapsed) {
        return (
            <div className="flex h-full min-h-0 w-full bg-bg-subtle">
                <aside className="flex w-12 shrink-0 justify-center border-r border-border pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleLibrary}
                        className="h-9 w-9"
                        title="Expand library"
                        aria-label="Expand library"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                </aside>

                <div className="min-w-0 flex-1">{editor}</div>
            </div>
        );
    }

    return (
        <ResizablePanelGroup
            autoSaveId={layoutStorageId}
            direction="horizontal"
            className="relative min-h-0 bg-bg-subtle"
        >
            <ResizablePanel
                id="circuit-library"
                order={0}
                defaultSize={LIBRARY_DEFAULT_SIZE}
                minSize={LIBRARY_MIN_SIZE}
                maxSize={LIBRARY_MAX_SIZE}
                className="min-w-[200px] overflow-hidden"
            >
                {library}
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel id="circuit-editor" order={1} minSize={40} className="min-w-0">
                {editor}
            </ResizablePanel>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleLibrary}
                className="absolute left-2 top-1 z-20 h-9 w-9"
                title="Collapse library"
                aria-label="Collapse library"
            >
                <PanelLeftClose className="h-4 w-4" />
            </Button>
        </ResizablePanelGroup>
    );
}
