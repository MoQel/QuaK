import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from "@/components/ui/menubar.tsx";

type saver = () => void;

export function Menu({onSave}: {onSave: saver}) {
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
                    <MenubarItem>Help</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}