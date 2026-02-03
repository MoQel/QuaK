import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
// Import the shared styles
import { menuContentStyle, menuItemStyle, menuTriggerStyle } from "@/components/ui/utils"

function Menubar({
                     className,
                     ...props
                 }: React.ComponentProps<typeof MenubarPrimitive.Root>) {
    return (
        <MenubarPrimitive.Root
            data-slot="menubar"
            className={cn(
                "bg-bg-dark flex h-9 items-center gap-1 rounded-md border p-1",
                className
            )}
            {...props}
        />
    )
}

function MenubarMenu({
                         ...props
                     }: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
    return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
                          ...props
                      }: React.ComponentProps<typeof MenubarPrimitive.Group>) {
    return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
                           ...props
                       }: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
    return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
                               ...props
                           }: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
    return (
        <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
    )
}

function MenubarTrigger({
                            className,
                            ...props
                        }: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
    return (
        <MenubarPrimitive.Trigger
            data-slot="menubar-trigger"
            // Usage of shared trigger style
            className={cn(menuTriggerStyle, className)}
            {...props}
        />
    )
}

function MenubarContent({
                            className,
                            align = "start",
                            alignOffset = -4,
                            sideOffset = 8,
                            ...props
                        }: React.ComponentProps<typeof MenubarPrimitive.Content>) {
    return (
        <MenubarPortal>
            <MenubarPrimitive.Content
                data-slot="menubar-content"
                align={align}
                alignOffset={alignOffset}
                sideOffset={sideOffset}
                // Usage of shared content style + specific overrides (min-w-12rem)
                className={cn(
                    menuContentStyle,
                    "min-w-[12rem] origin-(--radix-menubar-content-transform-origin) p-0 cursor-pointer",
                    className
                )}
                {...props}
            />
        </MenubarPortal>
    )
}

function MenubarItem({
                         className,
                         inset,
                         variant = "default",
                         ...props
                     }: React.ComponentProps<typeof MenubarPrimitive.Item> & {
    inset?: boolean
    variant?: "default" | "destructive"
}) {
    return (
        <MenubarPrimitive.Item
            data-slot="menubar-item"
            data-inset={inset}
            data-variant={variant}
            // Usage of shared item style + variant logic
            className={cn(
                menuItemStyle,
                "bg-bg", // Specific background from your original file
                "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-text-muted",
                inset && "pl-8",
                className
            )}
            {...props}
        />
    )
}

function MenubarCheckboxItem({
                                 className,
                                 children,
                                 checked,
                                 ...props
                             }: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
    return (
        <MenubarPrimitive.CheckboxItem
            data-slot="menubar-checkbox-item"
            // Reusing item style helps keep checkboxes consistent with regular items
            className={cn(
                menuItemStyle,
                "pr-2 pl-8 border-b border-border last:border-b-0",
                className
            )}
            checked={checked}
            {...props}
        >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
            {children}
        </MenubarPrimitive.CheckboxItem>
    )
}

function MenubarRadioItem({
                              className,
                              children,
                              ...props
                          }: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
    return (
        <MenubarPrimitive.RadioItem
            data-slot="menubar-radio-item"
            // Reusing item style
            className={cn(
                menuItemStyle,
                "cursor-default pr-2 pl-8",
                className
            )}
            {...props}
        >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
            {children}
        </MenubarPrimitive.RadioItem>
    )
}

function MenubarLabel({
                          className,
                          inset,
                          ...props
                      }: React.ComponentProps<typeof MenubarPrimitive.Label> & {
    inset?: boolean
}) {
    return (
        <MenubarPrimitive.Label
            data-slot="menubar-label"
            data-inset={inset}
            className={cn(
                "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
                className
            )}
            {...props}
        />
    )
}

function MenubarSeparator({
                              className,
                              ...props
                          }: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
    return (
        <MenubarPrimitive.Separator
            data-slot="menubar-separator"
            className={cn("bg-border -mx-1 my-1 h-px", className)}
            {...props}
        />
    )
}

function MenubarShortcut({
                             className,
                             ...props
                         }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="menubar-shortcut"
            className={cn(
                "text-text-muted ml-auto text-xs tracking-widest",
                className
            )}
            {...props}
        />
    )
}

function MenubarSub({
                        ...props
                    }: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
    return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
                               className,
                               inset,
                               children,
                               ...props
                           }: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
}) {
    return (
        <MenubarPrimitive.SubTrigger
            data-slot="menubar-sub-trigger"
            data-inset={inset}
            // Reusing item style because triggers inside menus look like items
            className={cn(
                menuItemStyle,
                "data-[state=open]:bg-bg-light data-[state=open]:text-text",
                inset && "pl-8",
                className
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ml-auto h-4 w-4" />
        </MenubarPrimitive.SubTrigger>
    )
}

function MenubarSubContent({
                               className,
                               ...props
                           }: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
    return (
        <MenubarPrimitive.SubContent
            data-slot="menubar-sub-content"
            // Reusing content style, but keeping your original min-w and shadow-lg
            className={cn(
                menuContentStyle,
                "bg-bg min-w-[8rem] origin-(--radix-menubar-content-transform-origin) p-0 shadow-lg cursor-pointer",
                className
            )}
            {...props}
        />
    )
}

export {
    Menubar,
    MenubarPortal,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarGroup,
    MenubarSeparator,
    MenubarLabel,
    MenubarItem,
    MenubarShortcut,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
}