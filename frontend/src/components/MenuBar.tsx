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
            <MenubarTrigger className="text-base px-4 py-2 cursor-pointer data-[state=open]:bg-accent">
                View
            </MenubarTrigger>
            <MenubarContent>
                <MenubarSub>
                    <MenubarSubTrigger inset>Theme</MenubarSubTrigger>
                    <MenubarSubContent>
                        <MenubarCheckboxItem checked={isDark} onCheckedChange={toggleTheme}>
                            Dark
                        </MenubarCheckboxItem>
                        <MenubarCheckboxItem checked={!isDark} onCheckedChange={toggleTheme}>
                            Light
                        </MenubarCheckboxItem>
                    </MenubarSubContent>
                </MenubarSub>

                <MenubarSub>
                    <MenubarSubTrigger inset>Panels</MenubarSubTrigger>
                    <MenubarSubContent>
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
            <MenubarTrigger className="text-base px-4 py-2 cursor-pointer data-[state=open]:bg-accent">
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
        <div className="border-b px-6 py-2 flex items-center">
            <Menubar className="border-none">
                <ViewMenu {...props} />
                <HelpMenu />
            </Menubar>
        </div>
    );
};