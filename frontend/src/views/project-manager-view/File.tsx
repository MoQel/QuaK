import { FileSelect, ParentRefresh } from "@/views/project-manager-view/ProjectManagerView.tsx";
import { FileCode } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu.tsx";
import { Delete } from "@/views/project-manager-view/Delete.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import { JSX, useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form.tsx";
import { File as IFile } from "@/views/project-manager-view/util/FileElement.tsx";
import { DialogCloseButtons, TextInput } from "@/views/project-manager-view/util/FormComponents.tsx";
import { ListingElement } from "@/views/project-manager-view/util/TreeComponents.tsx";
import { api } from "@/utils/api";

/**
 * Displays a {@link IFile File}
 * @param file The file-Element
 * @constructor
 */
export function File(file: IFile) {
    const { name, id } = file
    const [open, setOpen] = useState(false)
    const [dialogContent, setDialogContent] = useState(<Skeleton className="h-5 mt-5" />)
    const choose = useContext(FileSelect)

    const dialogTrigger = (content: Promise<JSX.Element>) => {
        setOpen(true)
        content.then(setDialogContent)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <ContextMenu>
                <ContextMenuTrigger onClick={() => choose(file)}>
                    <ListingElement text={name} icon={<FileCode />} />
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {FileEdit(id, dialogTrigger)}
                    <Delete endpoint={"/file/" + id} openDialog={dialogTrigger} />
                </ContextMenuContent>
            </ContextMenu>
            <DialogContent>
                {dialogContent}
            </DialogContent>
        </Dialog>
    )
}

function FileEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getDir = () => {
        return api.get<IFile>("/file/" + id)
            .then((obj) => {
                if (obj.type === "file") {
                    return obj
                } else {
                    throw "Not a file"
                }
            })
    }

    const reloadParent = useContext(ParentRefresh)
    const dialog = () => {
        trigger(getDir()
            .then(file => <>
                <DialogHeader>
                    <DialogTitle>Edit Directory</DialogTitle>
                    <DialogDescription>
                        Edit file with id <i>{id}</i>.
                    </DialogDescription>
                </DialogHeader>
                <EditForm file={file} reloadParent={reloadParent} />
            </>))
    }

    return (
        <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>
    )
}

function EditForm({ file, reloadParent }: { file: IFile, reloadParent: () => void }) {
    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Directory name must be at least 1 characters.",
        }).optional(),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: file.name,
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            type: file.type,
            ...values
        }

        api.patch("/file/" + file.id, body).then(reloadParent)
    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                        <TextInput placeholder="Enter a new name" label="Name" field={field} />
                    )}
                />
                <DialogCloseButtons submit="Save" />
            </form>
        </Form>
    )
}
