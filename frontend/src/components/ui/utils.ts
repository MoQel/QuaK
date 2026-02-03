import {cn} from "@/lib/utils.ts";

export const menuTriggerStyle = cn(
    "flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none cursor-pointer",
    "focus:bg-bg-light focus:text-text",
    "data-[state=open]:bg-bg-light data-[state=open]:text-text",
    "hover:bg-bg hover:text-text"
)

// CONTENT: Used for MenubarContent, DropdownMenuContent, SubContent
export const menuContentStyle = cn(
    "z-50 overflow-hidden rounded-md border p-1 shadow-md",
    "bg-bg text-text",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
)

// ITEMS: Used for MenubarItem, DropdownMenuItem, etc.
export const menuItemStyle = cn(
    "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden",
    "hover:bg-bg-light hover:text-text",
    "focus:bg-bg-light focus:text-text",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
)

