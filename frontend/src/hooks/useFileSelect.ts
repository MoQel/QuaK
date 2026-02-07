import { File } from '@/views/project-manager-view/util/FileElement.tsx';
import { openTab } from '@/store/slices/tabsSlice.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

export const useFileSelect = () => {
    const dispatch = useAppDispatch();

    return (file: File) => {
        dispatch(openTab({ tab: { id: file.id, title: file.name, language: '' } }));
    };
};
