import { closeTab, setActiveTab } from '@/store/slices/tabsSlice.ts';
import { X } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

export function TabBar() {
    const dispatch = useAppDispatch();
    const { openTabs, activeTabId } = useAppSelector((state) => state.tabs);

    if (openTabs.length === 0) return null;

    return (
        <div className="flex flex-row bg-[#252526] overflow-x-auto h-9 items-center border-b border-black/20">
            {openTabs.map((tab) => (
                <div
                    key={tab.id}
                    onClick={() => dispatch(setActiveTab(tab.id))}
                    className={`
                        group flex items-center px-3 h-full cursor-pointer select-none text-sm min-w-[120px] max-w-[200px] border-r border-white/10
                        ${
                            tab.id === activeTabId
                                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500'
                                : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]'
                        }
                    `}
                >
                    <span className="truncate flex-1 mr-2">{tab.title}</span>
                    <span
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            dispatch(closeTab(tab.id));
                        }}
                    >
                        <X size={14} />
                    </span>
                </div>
            ))}
        </div>
    );
}
