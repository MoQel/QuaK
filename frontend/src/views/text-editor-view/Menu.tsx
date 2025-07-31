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
} from "@/components/ui/menubar.tsx";

type saver = () => void;
type language = {select: () => void, displayName: string, isSelected: boolean};

export function Menu({onSave, languages}: {onSave: saver, languages: language[]}) {
    return (
        <Menubar className="rounded-none">
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
                            {
                                languages.length > 0
                                    ? formatLannguages(languages)
                                    : <MenubarItem disabled>Empty</MenubarItem>
                            }
                        </MenubarSubContent>
                    </MenubarSub>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}

function formatLannguages(languages: language[]) {
    const elements = []
    for (const lang of languages) {
        elements.push(
            <MenubarCheckboxItem onSelect={lang.select} checked={lang.isSelected}>
                {lang.displayName}
            </MenubarCheckboxItem>
        )
    }
    return elements
}