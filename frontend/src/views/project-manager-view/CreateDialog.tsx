import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {z} from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";

export function CreateDialog({id}: {id: string}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-2 flex-none" variant="ghost">P</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Element</DialogTitle>
                    <DialogDescription>
                        Use the dropdown to select which type of Element to create
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="file">
                    <TabsList>
                        <TabsTrigger value="file">File</TabsTrigger>
                        <TabsTrigger value="directory">Directory</TabsTrigger>
                    </TabsList>
                    <TabsContent value="file"><CreateFile parent={id}/></TabsContent>
                    <TabsContent value="directory"><CreateDirectory parent={id}/></TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function CreateFile({parent}: {parent: string}) {
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
        })
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
        })
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
