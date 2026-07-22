import { cn } from '@/lib/utils.ts';
import { Button } from '@/components/ui/button.tsx';
import { X } from 'lucide-react';
import React from 'react';
import { Tab } from '@/store/tabs/tabsTypes.ts';

interface EditorTabLabelProps extends React.HTMLAttributes<HTMLDivElement> {
    tab: Tab;
    isActive: boolean;
    isThisGroupFocused: boolean;
    isDirty: boolean;
    onClose: () => void;
}

export const EditorTabLabel = React.forwardRef<HTMLDivElement, EditorTabLabelProps>(
    ({ tab, isActive, isThisGroupFocused, isDirty, onClose, className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    'group relative flex h-full rounded-none min-w-[100px] max-w-[200px] cursor-pointer select-none items-center px-3 text-sm font-medium transition-colors',
                    isActive
                        ? 'bg-subtle text-text border-b-2'
                        : 'bg-transparent text-text-muted hover:bg-bg hover:text-text border-b-2 border-b-transparent',
                    isActive && (isThisGroupFocused ? 'border-b-blue-500' : 'border-b-gray-500'),
                    className,
                )}
            >
                <span className="mr-2 flex-1 truncate">{tab.title}</span>

                <Button
                    type="button"
                    aria-label="Close tab"
                    className={cn(
                        'relative flex items-center justify-center p-0.5 rounded-sm h-5 w-5 hover:bg-bg-light ',
                        'bg-transparent shadow-none border-none',
                    )}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <X className="size-3.5 transition-opacity opacity-0 group-hover:opacity-100" />
                    {isDirty && (
                        <div className="absolute inset-0 flex items-center justify-center group-hover:hidden">
                            <div className="h-2 w-2 rounded-full bg-text-muted" />
                        </div>
                    )}
                </Button>
            </div>
        );
    },
);

EditorTabLabel.displayName = 'EditorTabLabel';
