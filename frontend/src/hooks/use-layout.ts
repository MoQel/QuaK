import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { togglePanel, toggleMenubar, setMenubarVisibility, resetLayout } from '@/store/layout/layoutSlice';

export type PanelKey = 'file' | 'circuit' | 'code' | 'results' | 'inspector' | 'library';

export const useLayout = () => {
    const dispatch = useAppDispatch();

    // 1. Centralize State Access
    const { visiblePanels, isMenubarVisible, topLayout } = useAppSelector((state) => state.layout);

    const onTogglePanel = (panel: PanelKey) => {
        dispatch(togglePanel(panel));
    };

    const onToggleMenubar = () => {
        dispatch(toggleMenubar());
    };

    const onSetMenubarVisibility = (isVisible: boolean) => {
        dispatch(setMenubarVisibility(isVisible));
    };

    const onResetLayout = () => {
        dispatch(resetLayout());
    };

    return {
        // State
        visiblePanels,
        isMenubarVisible,
        topLayout,

        // Actions
        onTogglePanel,
        onToggleMenubar,
        onSetMenubarVisibility,
        onResetLayout,
    };
};
