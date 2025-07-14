import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {FormEvent, JSX, useContext} from "react";
import {ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {DialogCloseButtons} from "@/views/project-manager-view/CreateDialog.tsx";

export function Delete({path, trigger}: {path: string, trigger: (element: Promise<JSX.Element>) => void}) {
    const reload = useContext(ParentRefresh)

    const del = (event: FormEvent) => {
        event.preventDefault()
        fetch(path, {
            method: "DELETE"
        }).then(reload)
    }

    return (
        <ContextMenuItem variant="destructive" onSelect={() => trigger(Promise.resolve(
            <>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    This action will delete the selected element permanently.
                </DialogDescription>
                <form onSubmit={del}>
                    <DialogCloseButtons/>
                </form>
            </>
        ))}>
            Delete
        </ContextMenuItem>
    )
}