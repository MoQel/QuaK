import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {FileElementContainer, getElementForFileElement} from "@/views/project-manager-view/FileElementContainer.tsx";
import {API_ENDPOINT, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {useContext, useState} from "react";
import {DialogCloseButtons} from "@/views/project-manager-view/CreateDialog.tsx";

export interface Project extends FileElementContainer {
}

async function getProjectContent(id : string) {
    const response = await fetch(API_ENDPOINT + "/project/" + id, {
        method: "GET",
    })

    const project = await response.json() as Project
    const elements = [];
    for (const element of project.contents) {
        elements.push(getElementForFileElement(element))
    }
    return elements
}

export function Project({name, id}: {name: string, id: string}) {
    return <FileElementContainer name={name} id={id} getContent={getProjectContent} edit={ProjectEdit}/>
}

function ProjectEdit({id}: {id: string}) {
    const [content, setContent] = useState(<Skeleton className="h-4" />)

    const getProject = () => {
        return fetch(API_ENDPOINT + "/project/" + id, {
            method: "GET"
        }).then((result) => result.json() as unknown as Project)
    }

    const onClick = () => {
        getProject().then(proj => setContent(<EditForm {...proj}/>))
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-2 flex-none" variant="ghost" onClick={onClick}>E</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Edit Project with id <i>{id}</i>
                    </DialogDescription>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    )
}

function EditForm(project: Project) {
    const reloadParent = useContext(ParentRefresh)
    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Project name must be at least 1 characters.",
        }).optional(),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: project.name,
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            ...values
        }

        fetch(API_ENDPOINT + "/project/" + project.id, {
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
                <DialogCloseButtons submit={"Save"}/>
            </form>
        </Form>
    )
}
