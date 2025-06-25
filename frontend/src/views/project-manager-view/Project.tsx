import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "@/components/ui/collapsible.tsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";

export function Project({name, id}: {name: string, id: string}) {
    const [isHover, setIsHover] = useState(false);

    return (
        <Collapsible>
            <div className="flex">
                <CollapsibleTrigger
                    className="flex-auto"
                    onMouseEnter={() => setIsHover(true)}
                    onMouseLeave={() => setIsHover(false)}
                    style={isHover ? {textDecoration: 'underline', textAlign: "start"} : {textAlign: "start"}}
                >
                    {name}
                </CollapsibleTrigger>
                <ProjectEdit id={id}/>
            </div>
            <CollapsibleContent>
                <div className="pl-4">
                    {/* TODO: Implement filling of content */}
                    Content
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

function ProjectEdit({id}: {id: string}) {
    //TODO: Implement the edit-functionality
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-2 flex-none" variant="ghost">E</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        This is a description.
                    </DialogDescription>
                </DialogHeader>
                I'm a body of id {id}.
            </DialogContent>
        </Dialog>
    )
}