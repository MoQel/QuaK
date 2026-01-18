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
import { Undo, Redo, Save, FileCode } from 'lucide-react'; // Reuse your existing icons

export const IdeMenubar = () => {
    const { theme, toggleTheme } = useTheme();

    const isDark = theme === "dark";
    const [visiblePanels, setVisiblePanels] = useState({
        file: true,
        circuit: true,
        code: false,
        results: false,
        inspector: false,
        library: true,
    });

    const togglePanel = (key: keyof typeof visiblePanels) => {
        setVisiblePanels(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        // This div creates the strip/background for the bar
        <div className="border-b px-6 py-2 bg-background flex items-center">

            <Menubar className="border-none">


                {/* --- MENU 2: EDIT --- */}
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
                            {/* 1. The Trigger (What you hover over) */}
                            <MenubarSubTrigger inset>Theme </MenubarSubTrigger>

                            {/* 2. The Content (What pops out) */}
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
                            {/* 1. The Trigger (What you hover over) */}
                            <MenubarSubTrigger inset>Panels </MenubarSubTrigger>

                            {/* 2. The Content (What pops out) */}
                            <MenubarSubContent>
                                <MenubarCheckboxItem
                                    checked={visiblePanels.file}
                                    onCheckedChange={() => togglePanel('file')}
                                >
                                    File Browser
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.circuit}
                                    onCheckedChange={() => togglePanel('circuit')}
                                >
                                    Circuit Editor
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.code}
                                    onCheckedChange={() => togglePanel('code')}
                                >
                                    Code Editor
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.results}
                                    onCheckedChange={() => togglePanel('results')}
                                >
                                    Results Panel
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.inspector}
                                    onCheckedChange={() => togglePanel('inspector')}
                                >
                                    Inspector
                                </MenubarCheckboxItem>

                                <MenubarCheckboxItem
                                    checked={visiblePanels.library}
                                    onCheckedChange={() => togglePanel('library')}
                                >
                                    Library
                                </MenubarCheckboxItem>
                            </MenubarSubContent>
                        </MenubarSub>
                        {/* NESTED MENU ENDS HERE */}
                        <MenubarSeparator />
                        <MenubarItem> Reset </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                {/* --- MENU 1: Help --- */}
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