import {ListingElement} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {FileCode} from "lucide-react";

export function File({name, id}: {name: string, id: string}) {
    return (
        <ListingElement text={name} icon={<FileCode/>}/>
    )
}