import {Card, CardContent} from "@/components/ui/card.tsx";
import {
    Dialog,
    DialogContent,
    DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Project} from "@/views/project-manager-view/Project.tsx";
import {Button} from "@/components/ui/button.tsx";
import {createContext, JSX, useEffect, useState} from "react";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/input.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {DialogCloseButtons} from "@/views/project-manager-view/CreateDialog.tsx";
import {sort} from "@/views/project-manager-view/FileElement.ts";

export const API_ENDPOINT = ""
export const ParentRefresh = createContext(() => {})

async function retrieveProjects() {
    const response = await fetch(API_ENDPOINT + "/project/", {
        method: "GET",
    })

    const projects = await response.json() as Project[]
    const elements = [];
    if (projects.length == 0) {
        elements.push(<Empty/>)
    } else {
        for (const project of sort(projects)) {
            elements.push(<Project name={project.name} id={project.id}/>)
        }
    }
    return elements
}

export function Empty() {
    return (<p className="text-center p-1 opacity-70 italic">Empty</p>)
}

export function ListingElement({text, icon}: {text: string, icon: JSX.Element}) {
    return (<div className="flex self-center entry">
        {<icon.type {...icon.props} className="mr-1 h-5 w-5 self-center"/>}
        {text}
    </div>)
}

export function ProjectManagerView() {
    const [content, setContent] = useState([<Skeleton className="h-4"/>])
    const [reloaded, r] = useState(false)
    const reload = () => r(!reloaded)

    useEffect(() => {
        retrieveProjects().then(setContent)
    }, [reloaded])

    return (
        <Card className="h-full">
            <CardContent className="overflow-auto">
                <div className="flex-col">
                    <ParentRefresh value={reload}>
                        {content}
                        <CreateProject reload={reload}/>
                    </ParentRefresh>
                </div>
            </CardContent>
        </Card>
    )
}

function CreateProject({reload}: {reload: () => void}) {
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

        fetch(API_ENDPOINT + "/project/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).then(reload)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full" variant="ghost">+</Button>
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
                        <DialogCloseButtons submit={"Save"}/>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}