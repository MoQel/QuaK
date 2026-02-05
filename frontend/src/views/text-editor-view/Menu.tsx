import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSubTrigger,
    MenubarSubContent,
    MenubarSub,
    MenubarCheckboxItem,
} from '@/components/ui/menubar.tsx';

type saver = () => void;
type language = {
    /** Hook to be called when the language is selected */
    select: () => void;
    displayName: string;
    /** True, when the language is selcted */
    isSelected: boolean;
};

/**
 * Component that displays a menubar at the top of the text-editor
 * @param onSave Hook that gets called when a save should be triggered
 * @param languages The languages that are selectable
 * @constructor
 */
export function Menu({ onSave, languages }: { onSave: saver; languages: language[] }) {
    return (
        <Menubar className="rounded-none bg-bg">
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onSelect={onSave}>Save</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Settings</MenubarTrigger>
                <MenubarContent>
                    <MenubarSub>
                        <MenubarSubTrigger>Language</MenubarSubTrigger>
                        <MenubarSubContent>
                            {languages.length > 0 ? (
                                formatLanguages(languages)
                            ) : (
                                <MenubarItem disabled>Empty</MenubarItem>
                            )}
                        </MenubarSubContent>
                    </MenubarSub>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}

function formatLanguages(languages: language[]) {
    const elements = [];
    for (const lang of languages) {
        elements.push(
            <MenubarCheckboxItem onSelect={lang.select} checked={lang.isSelected} key={lang.displayName}>
                {lang.displayName}
            </MenubarCheckboxItem>,
        );
    }
    return elements;
}
