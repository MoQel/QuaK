import {
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {z} from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {API_ENDPOINT, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {JSX, useContext} from "react";
import {
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger
} from "@/components/ui/context-menu";

export function CreateDialog({id, trigger}: {id: string, trigger: (element: Promise<JSX.Element>) => void}) {
    const dialog = (e: JSX.Element) => trigger(Promise.resolve(e))
    return (
        <ContextMenuSub>
            <ContextMenuSubTrigger>New...</ContextMenuSubTrigger>
            <ContextMenuSubContent>
                <ContextMenuItem onSelect={() => dialog(
                    <>
                        <DialogHeader>
                            <DialogTitle>Create a new file</DialogTitle>
                        </DialogHeader>
                        <CreateFile parent={id}/>
                    </>
                )}>
                    File
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => dialog(
                    <>
                        <DialogHeader>
                            <DialogTitle>Create a new Directory</DialogTitle>
                        </DialogHeader>
                        <CreateDirectory parent={id}/>
                    </>
                )}>
                    Directory
                </ContextMenuItem>
            </ContextMenuSubContent>
        </ContextMenuSub>
    )
}

function CreateFile({parent}: {parent: string}) {
    const reloadParent = useContext(ParentRefresh)

    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Filename must be at least 1 characters.",
        }),
        contentType: z.string(),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "new_file.txt",
            contentType: "application/json",
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            type: "file",
            createdOn: Math.round(Date.now().valueOf() / 1000),
            ...values
        }

        fetch(API_ENDPOINT + "/file/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'parent_id': parent
            },
            body: JSON.stringify(body),
        }).then(reloadParent)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                        <FormItem className="pb-2">
                            <FormLabel>Filename</FormLabel>
                            <FormControl>
                                <Input placeholder="new_file.txt" {...field}/>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contentType"
                    render={({field}) => (
                        <FormItem className="pb-2">
                            <FormLabel>Content-Type</FormLabel>
                            <FormControl>
                                <Input placeholder="application/json" {...field}/>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <DialogCloseButtons/>
            </form>
        </Form>
    )
}

export function DialogCloseButtons({cancel = "Cancel", submit = "Submit"}: {cancel?: string, submit?: string}) {
    return (<DialogFooter>
        <DialogClose asChild>
            <Button variant="outline">{cancel}</Button>
        </DialogClose>
        <DialogClose asChild>
            <Button type="submit">{submit}</Button>
        </DialogClose>
    </DialogFooter>)
}

function CreateDirectory({parent}: {parent: string}) {
    const reloadParent = useContext(ParentRefresh)
    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Name of the directory must be at least 1 characters.",
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "folder",
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            type: "directory",
            ...values
        }

        fetch(API_ENDPOINT + "/file/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'parent_id': parent
            },
            body: JSON.stringify(body),
        }).then(reloadParent)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                        <FormItem className="pb-2">
                            <FormLabel>Name of the directory</FormLabel>
                            <FormControl>
                                <Input placeholder="folder" {...field}/>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <DialogCloseButtons/>
            </form>
        </Form>
    )
}
