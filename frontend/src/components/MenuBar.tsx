import React, { useState } from 'react';
import { useTheme } from "@/theme";

import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarCheckboxItem,
} from '@/components/ui/menubar';
import { Undo, Redo } from 'lucide-react';

interface IdeMenubarProps {
    visiblePanels: {
        file: boolean;
        circuit: boolean;
        code: boolean,
        results: boolean,
        inspector: boolean,
        library: boolean,
    };
    togglePanel: (key: any) => void;
    resetLayout: () => void;
}


export const IdeMenubar = ({ visiblePanels, togglePanel, resetLayout } : IdeMenubarProps) => {
    const { theme, toggleTheme } = useTheme();

    const isDark = theme === "dark";
    const keepMenuOpen = (event: Event) => {
        event.preventDefault();
    };

    return (
        <div className="border-b px-6 py-2 flex items-center">

            <Menubar className="border-none">


                <MenubarMenu>
                    <MenubarTrigger className="text-base px-4 py-2 cursor-pointer data-[state=open]:bg-accent">Edit</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            <Undo className="w-4 h-4 mr-2" />
                            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem>
                            <Redo className="w-4 h-4 mr-2" />
                            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem>
                            <Undo className="w-4 h-4 mr-2" />
                            Select All <MenubarShortcut>⌘Z</MenubarShortcut>
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger className="text-base px-4 py-2 cursor-pointer data-[state=open]:bg-accent">View</MenubarTrigger>
                    <MenubarContent>

                        <MenubarSub>
                            <MenubarSubTrigger inset>Theme </MenubarSubTrigger>

                            <MenubarSubContent>
                                <MenubarCheckboxItem
                                    checked={isDark}
                                    onCheckedChange={() => toggleTheme()}>
                                    Dark
                                </MenubarCheckboxItem>
                                <MenubarCheckboxItem
                                    checked={!isDark}
                                    onCheckedChange={() => toggleTheme()}>
                                    Light
                                </MenubarCheckboxItem>
                            </MenubarSubContent>
                        </MenubarSub>
                        <MenubarSub>
                            <MenubarSubTrigger inset>Panels </MenubarSubTrigger>

                            <MenubarSubContent>
                                <MenubarCheckboxItem
                                    checked={visiblePanels.file}
                                    onCheckedChange={() => togglePanel('file')}
                                    onSelect={keepMenuOpen}
                                >
                                    File Browser
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.circuit}
                                    onCheckedChange={() => togglePanel('circuit')}
                                    onSelect={keepMenuOpen}
                                >
                                    Circuit Editor
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.code}
                                    onCheckedChange={() => togglePanel('code')}
                                    onSelect={keepMenuOpen}
                                >
                                    Code Editor
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.results}
                                    onCheckedChange={() => togglePanel('results')}
                                    onSelect={keepMenuOpen}
                                >
                                    Results Panel
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.inspector}
                                    onCheckedChange={() => togglePanel('inspector')}
                                    onSelect={keepMenuOpen}
                                >
                                    Inspector
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.library}
                                    onCheckedChange={() => togglePanel('library')}
                                    onSelect={keepMenuOpen}
                                >
                                    Library
                                </MenubarCheckboxItem>
                            </MenubarSubContent>
                        </MenubarSub>
                        <MenubarSeparator />
                        <MenubarItem onClick={resetLayout} className="justify-center font-medium"> Reset Panels</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger className="text-base px-4 py-2 cursor-pointer data-[state=open]:bg-accent">Help</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>Guided Tour </MenubarItem>
                        <MenubarItem>Shortcuts</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>About us</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

            </Menubar>
        </div>
    );
};