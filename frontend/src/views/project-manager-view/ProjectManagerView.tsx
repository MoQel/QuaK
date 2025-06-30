import {Card, CardContent} from "@/components/ui/card.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Project} from "@/views/project-manager-view/Project.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useState} from "react";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/input.tsx";

export function ProjectManagerView() {
    return (
        <Card className="h-full">
            <CardContent>
                <div className="flex-col h-8">
                    <Project name="Test" id="p1"/>
                    <CreateProject/>
                </div>
            </CardContent>
        </Card>
    )
}

function CreateProject() {
    const [open, setOpen] = useState(false)
    console.log(open)

    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Name of the project must be at least 1 characters.",
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "New Project",
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            ...values
        }

        fetch("/project/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full" variant="ghost" onClick={() => setOpen(true)}>+</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new Project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem className="pb-4">
                                    <FormLabel>Name of the Project</FormLabel>
                                    <FormControl>
                                        <Input placeholder="New Project" {...field}/>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose>
                                <Button type="submit">Save changes</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}