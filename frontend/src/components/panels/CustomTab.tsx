import { IDockviewPanelHeaderProps } from 'dockview-react';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { safeCloseCodePanel } from '@/store/tabs/tabsThunks.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { Button } from '@/components/ui/button.tsx';

export const CustomTabRenderer = (props: IDockviewPanelHeaderProps) => {
    const { api } = props;
    const [isVisible, setIsVisible] = useState(api.isVisible);
    const dispatch = useAppDispatch();
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);

    useEffect(() => {
        const disposable = api.onDidVisibilityChange((event) => {
            setIsVisible(event.isVisible);
        });
        return () => disposable.dispose();
    }, [api]);

    useEffect(() => {
        const handleForceClose = () => {
            if (api.id === 'code') api.close();
        };

        globalThis.addEventListener('dockview-close-panel-code', handleForceClose);
        return () => globalThis.removeEventListener('dockview-close-panel-code', handleForceClose);
    }, [api]);

    const handleClose = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            // Check if dirty files are open
            if (api.id === 'code' && dirtyFiles.length !== 0) {
                dispatch(safeCloseCodePanel());
                return;
            }

            api.close();
        },
        [api, dirtyFiles],
    );

    return (
        <div
            // onClick={() => api.setActive()}
            className={`
                flex items-center justify-between h-full px-3 cursor-pointer transition-colors duration-150 group
                ${isVisible ? 'bg-transparent' : 'hover:bg-[var(--bg)]'}
                ${isVisible ? 'shadow-[inset_0_-2px_0_0_var(--special)]' : ''}
            `}
        >
            {/* Title */}
            <span className="text-sm font-semibold text-[var(--text)] truncate mr-2">{api.title}</span>

            {/* Close Button */}
            <Button
                onClick={handleClose}
                className={`
                    flex items-center justify-center w-5 h-5 rounded-md
                    transition-all duration-150
                    hover:bg-[var(--bg-light)] 
                    opacity-0 group-hover:opacity-100
                `}
            >
                <X size={12} className="text-[var(--text)]" />
            </Button>
        </div>
    );
};
