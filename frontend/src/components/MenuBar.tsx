import React from 'react';
import { useTheme } from "@/theme";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarCheckboxItem,
} from '@/components/ui/menubar';

type VisiblePanelsState = {
    file: boolean;
    circuit: boolean;
    code: boolean;
    results: boolean;
    inspector: boolean;
    library: boolean;
};

interface IdeMenubarProps {
    visiblePanels: VisiblePanelsState;
    togglePanel: (key: keyof VisiblePanelsState) => void;
    resetLayout: () => void;
}

const ViewMenu = ({ visiblePanels, togglePanel, resetLayout }: IdeMenubarProps) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const keepMenuOpen = (event: Event) => {
        event.preventDefault();
    };

    return (
        <MenubarMenu>
            <MenubarTrigger className="text-sm px-3 py-1 h-7 cursor-pointer data-[state=open]: rounded-sm">
                View
            </MenubarTrigger>
            <MenubarContent>
                <MenubarSub>
                    <MenubarSubTrigger inset>Theme</MenubarSubTrigger>
                    <MenubarSubContent >
                        <MenubarCheckboxItem checked={isDark} onCheckedChange={toggleTheme}>
                            Dark
                        </MenubarCheckboxItem>
                        <MenubarCheckboxItem checked={!isDark} onCheckedChange={toggleTheme}>
                            Light
                        </MenubarCheckboxItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />

                <MenubarSub>
                    <MenubarSubTrigger inset>Panels</MenubarSubTrigger>
                    <MenubarSubContent >
                        {(Object.keys(visiblePanels) as Array<keyof VisiblePanelsState>).map((key) => (
                            <MenubarCheckboxItem
                                key={key}
                                checked={visiblePanels[key]}
                                onCheckedChange={() => togglePanel(key)}
                                onSelect={keepMenuOpen}
                                className="capitalize"
                            >
                                {key}
                            </MenubarCheckboxItem>
                        ))}
                    </MenubarSubContent>
                </MenubarSub>

                <MenubarSeparator />
                <MenubarItem onClick={resetLayout} className="justify-center font-medium">
                    Reset Panels
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

const HelpMenu = () => {
    return (
        <MenubarMenu>
            <MenubarTrigger className="text-sm px-3 py-1 h-7 cursor-pointer data-[state=open]:bg-accent rounded-sm">
                Help
            </MenubarTrigger>
            <MenubarContent>
                <MenubarItem>Guided Tour</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>About us</MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export const IdeMenubar = (props: IdeMenubarProps) => {
    return (
        <Menubar className="border-none bg-transparent p-0 ml-2">
            <ViewMenu {...props} />
            <HelpMenu />
        </Menubar>
    );
};