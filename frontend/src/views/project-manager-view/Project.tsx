import {
    DialogDescription,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog.tsx";
import { FileElementContainer } from "@/views/project-manager-view/FileElementContainer.tsx";
import { ParentRefresh } from "@/views/project-manager-view/ProjectManagerView.tsx";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { JSX, useContext } from "react";
import { ContextMenuItem } from "@/components/ui/context-menu.tsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getElementForFileElement, type Project, sort } from "@/views/project-manager-view/util/FileElement.tsx";
import { DialogCloseButtons } from "@/views/project-manager-view/util/FormComponents.tsx";
import { api } from "@/api/api.ts";
import {ProjectContentsResponse, ProjectRequest} from "@/api/dto/filesystem.ts";

async function fetchProjectContent(id: string) {
    const project = await api.get<Project>("/project/" + id);
    const elements = [];
    for (const element of sort(project.contents)) {
        elements.push(getElementForFileElement(element))
    }
    return elements
}

/**
 * Provides a new Project-display using {@link FileElementContainer}
 * @param name The name of the project
 * @param id The id of the project
 * @constructor
 */
export function Project({ name, id }: { name: string, id: string }) {
    const icon = (open: boolean) => open ? <ChevronDown /> : <ChevronRight />;
    return <FileElementContainer name={name} id={id} getContent={fetchProjectContent} edit={ProjectEdit} icon={icon} deletePath={"/project/" + id} />
}

function ProjectEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getProject = () => {
        return api.get<ProjectContentsResponse>("/project/" + id);
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
                <EditForm project={proj} reloadParent={reloadParent} />
            </>))
    }

    return (
        <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>
    )
}

function EditForm({ project, reloadParent }: { project: Project, reloadParent: () => void }) {
    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Project name must be at least 1 characters.",
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: project.name,
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body: ProjectRequest = {
            name: values.name
        }

        api.patch("/project/" + project.id, body).then(reloadParent)
    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem className="pb-2">
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter a new name" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <DialogCloseButtons submit={"Save"} />
            </form>
        </Form>
    )
}
