import {FileElementContainer, getElementForFileElement} from "@/views/project-manager-view/FileElementContainer.tsx";
import {
    DialogClose,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {API_ENDPOINT, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {JSX, useContext} from "react";
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";

export function Directory({name, id}: {name: string, id: string}) {
    return <FileElementContainer name={name} id={id} getContent={getDirectoryContent} edit={DirectoryEdit}/>
}

interface Directory extends FileElementContainer { }

function DirectoryEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getDir = () => {
        return fetch(API_ENDPOINT + "/file/" + id, {
            method: "GET"
        }).then((result) => result.json())
          .then((obj) => {
              if (obj.type === "directory") {
                  return obj as Directory
              } else {
                  throw "Not a directory"
              }
          })
    }

    const reloadParent = useContext(ParentRefresh)
    const dialog = () => {
        trigger(getDir()
            .then(dir => <>
                <DialogHeader>
                    <DialogTitle>Edit Directory</DialogTitle>
                    <DialogDescription>
                        Edit directory with id <i>{id}</i>.
                    </DialogDescription>
                </DialogHeader>
                <EditForm dir={dir} reloadParent={reloadParent}/>
            </>))
    }

    return (
        <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>
    )
}

function EditForm({dir, reloadParent}: {dir: Directory, reloadParent: () => void}) {
    const formSchema = z.object({
        name: z.string().min(1, {
            message: "Directory name must be at least 1 characters.",
        }).optional(),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: dir.name,
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            type: dir.type,
            ...values
        }

        fetch(API_ENDPOINT + "/file/" + dir.id, {
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
                <DialogFooter>
                    <DialogClose asChild={true}>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild={true} >
                        <Button type="submit">Save</Button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </Form>
    )
}

async function getDirectoryContent(id : string) {
    const response = await fetch(API_ENDPOINT + "/file/" + id, {
        method: "GET",
    })

    const dir = await response.json() as Directory
    const elements = [];
    for (const element of dir.contents) {
        elements.push(getElementForFileElement(element))
    }
    return elements
}
