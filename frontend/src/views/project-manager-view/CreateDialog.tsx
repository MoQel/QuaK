import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {z} from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";

export function CreateDialog({id}: {id: string}) {
    const [type, setType] = useState("file");

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
                <Select onValueChange={setType} defaultValue={type}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="directory">Directory</SelectItem>
                    </SelectContent>
                </Select>
                {type === "file" ? <CreateFile parent={id}/> : <CreateDirectory parent={id}/>}
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
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
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
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}
