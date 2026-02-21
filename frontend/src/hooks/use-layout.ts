import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { toggleMenubar, setMenubarVisibility } from '@/store/slices/layoutSlice';

export type PanelKey = 'file' | 'circuit' | 'code' | 'results' | 'inspector' | 'library';

export const useLayout = () => {
    const dispatch = useAppDispatch();

    // 1. Centralize State Access
    const { isMenubarVisible } = useAppSelector((state) => state.layout);

    const onToggleMenubar = () => {
        dispatch(toggleMenubar());
    };

    const onSetMenubarVisibility = (isVisible: boolean) => {
        dispatch(setMenubarVisibility(isVisible));
    };

    return {
        isMenubarVisible,
        onToggleMenubar,
        onSetMenubarVisibility,
    };
};
