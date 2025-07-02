import {FileElementContainer, getElementForFileElement} from "@/views/project-manager-view/FileElementContainer.tsx";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {API_ENDPOINT, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useContext, useState} from "react";
import {Skeleton} from "@/components/ui/skeleton.tsx";

export function Directory({name, id}: {name: string, id: string}) {
    return <FileElementContainer name={name} id={id} getContent={getDirectoryContent} edit={DirectoryEdit}/>
}

interface Directory extends FileElementContainer { }

function DirectoryEdit({id}: {id: string}) {
    const [content, setContent] = useState(<Skeleton className="h-4" />)

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

    const onClick = () => {
        getDir().then((dir) => setContent(<EditForm {...dir}/>))
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-2 flex-none" variant="ghost" onClick={onClick}>E</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Directory</DialogTitle>
                    <DialogDescription>
                        Edit directory with id <i>{id}</i>.
                    </DialogDescription>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    )
}

function EditForm(dir: Directory) {
    const reloadParent = useContext(ParentRefresh)

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

interface Directory extends FileElementContainer {
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
