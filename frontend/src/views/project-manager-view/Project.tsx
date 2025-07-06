import {
    DialogDescription,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog.tsx";
import {FileElementContainer, getElementForFileElement} from "@/views/project-manager-view/FileElementContainer.tsx";
import {API_ENDPOINT, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {JSX, useContext} from "react";
import {DialogCloseButtons} from "@/views/project-manager-view/CreateDialog.tsx";
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {ChevronDown, ChevronRight} from "lucide-react";
import {sort} from "@/views/project-manager-view/FileElement.ts";

export interface Project extends FileElementContainer {
}

async function getProjectContent(id : string) {
    const response = await fetch(API_ENDPOINT + "/project/" + id, {
        method: "GET",
    })

    const project = await response.json() as Project
    const elements = [];
    for (const element of sort(project.contents)) {
        elements.push(getElementForFileElement(element))
    }
    return elements
}

export function Project({name, id}: {name: string, id: string}) {
    const icon = (open: boolean) => open ? <ChevronDown/> : <ChevronRight/>;
    return <FileElementContainer name={name} id={id} getContent={getProjectContent} edit={ProjectEdit} icon={icon}/>
}

function ProjectEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getProject = () => {
        return fetch(API_ENDPOINT + "/project/" + id, {
            method: "GET"
        }).then((result) => result.json() as unknown as Project)
    }

    const reloadParent = useContext(ParentRefresh)
    const dialog = () => {
        trigger(getProject()
            .then(proj => <>
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Edit Project with id <i>{id}</i>
                    </DialogDescription>
                </DialogHeader>
                <EditForm project={proj} reloadParent={reloadParent}/>
            </>))
    }

    return (
        <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>
    )
}

function EditForm({project, reloadParent}: {project: Project, reloadParent: () => void}) {
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
