import { IDockviewPanelHeaderProps } from 'dockview-react';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';

export const CustomTabRenderer = (props: IDockviewPanelHeaderProps) => {
    const { api } = props;
    const [isVisible, setIsVisible] = useState(api.isVisible);

    useEffect(() => {
        const disposable = api.onDidVisibilityChange((event) => {
            setIsVisible(event.isVisible);
        });
        return () => disposable.dispose();
    }, [api]);

    const handleClose = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            // Closing a panel is a pure layout action: hide the view but keep the open
            // tabs (and therefore the circuit) intact. This is symmetric across panels —
            // closing the Code panel no longer wipes every tab.
            api.close();
        },
        [api],
    );

    return (
        <div
            // onClick={() => api.setActive()}
            className={`
                flex items-center justify-between h-full w-[120px] px-3 cursor-pointer transition-colors duration-150 group
                ${isVisible ? 'bg-transparent' : 'hover:bg-[var(--bg)]'}
                ${isVisible ? 'border-b-2 border-[var(--special)]' : 'border-b-2 border-transparent'}
            `}
        >
            {/* Title */}
            <span className="text-sm font-semibold text-[var(--text)] truncate mr-2">{api.title}</span>

            {/* Close Button */}
            <Button
                onClick={handleClose}
                className={`relative flex items-center justify-center p-0.5 rounded-sm h-5 w-5
                    hover:bg-bg-light bg-transparent shadow-none border-none
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
            >
                <X size={12} className="text-[var(--text)]" />
            </Button>
        </div>
    );
};
