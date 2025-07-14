import {API_ENDPOINT, ListingElement, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {FileCode} from "lucide-react";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/ui/context-menu.tsx";
import {Delete} from "@/views/project-manager-view/Delete.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {JSX, useContext, useState} from "react";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {FileElement} from "@/views/project-manager-view/FileElement.ts";
import {DialogCloseButtons} from "@/views/project-manager-view/CreateDialog.tsx";

export function File({name, id}: {name: string, id: string}) {
    const [open, setOpen] = useState(false)
    const [dialogContent, setDialogContent] = useState(<Skeleton className="h-5 mt-5" />)

    const dialogTrigger = (content: Promise<JSX.Element>) => {
        setOpen(true)
        content.then(setDialogContent)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <ContextMenu>
                <ContextMenuTrigger>
                    <ListingElement text={name} icon={<FileCode/>}/>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {FileEdit(id, dialogTrigger)}
                    <Delete path={API_ENDPOINT + "/file/" + id} trigger={dialogTrigger}/>
                </ContextMenuContent>
            </ContextMenu>
            <DialogContent>
                {dialogContent}
            </DialogContent>
        </Dialog>
    )
}

interface File extends FileElement {}

function FileEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getDir = () => {
        return fetch(API_ENDPOINT + "/file/" + id, {
            method: "GET"
        }).then((result) => result.json())
            .then((obj) => {
                if (obj.type === "file") {
                    return obj as File
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
                <EditForm file={file} reloadParent={reloadParent}/>
            </>))
    }

    return (
        <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>
    )
}

function EditForm({file, reloadParent}: {file: File, reloadParent: () => void}) {
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

        fetch(API_ENDPOINT + "/file/" + file.id, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).then(reloadParent)
    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    name="name"
                    control={form.control}
                    render={({field}) => (
                        <FormItem className="pb-2">
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter a new name" {...field}/>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <DialogCloseButtons submit="Save"/>
            </form>
        </Form>
    )
}
