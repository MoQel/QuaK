import { DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { FileElementContainer } from '@/views/project-manager-view/FileElementContainer.tsx';
import { DialogClose, ParentRefresh } from '@/views/project-manager-view/ProjectManagerContexts.ts';
import { JSX, useContext } from 'react';
import { ContextMenuItem } from '@/components/ui/context-menu.tsx';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getElementForFileElement, type Project, sort } from '@/views/project-manager-view/util/FileElement.tsx';
import { api } from '@/api/api.ts';
import { ProjectContentsResponse, ProjectRequest } from '@/api/dto/filesystem.ts';
import { EntityForm } from '@/views/project-manager-view/util/FormUtils.tsx';
import { toast } from 'sonner';

async function fetchProjectContent(id: string) {
    const project = await api.get<Project>('/api/project/' + id);
    const elements = [];
    for (const element of sort(project.contents)) {
        elements.push(getElementForFileElement(element));
    }
    return elements;
}

/**
 * Provides a new Project-display using {@link FileElementContainer}
 * @param name The name of the project
 * @param id The id of the project
 * @constructor
 */
export function Project({ name, id, initiallyOpen }: Readonly<{ name: string; id: string; initiallyOpen?: boolean }>) {
    const icon = (open: boolean) => (open ? <ChevronDown /> : <ChevronRight />);
    return (
        <FileElementContainer
            name={name}
            id={id}
            getContent={fetchProjectContent}
            edit={ProjectEdit}
            icon={icon}
            deletePath={'/api/project/' + id}
            initiallyOpen={initiallyOpen}
        />
    );
}

function ProjectEdit(id: string, trigger: (element: Promise<JSX.Element>) => void) {
    const getProject = () => {
        return api.get<ProjectContentsResponse>('/api/project/' + id);
    };

    const reloadParent = useContext(ParentRefresh);
    const dialog = () => {
        trigger(
            getProject().then((proj) => (
                <>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <EditForm project={proj} reloadParent={reloadParent} />
                </>
            )),
        );
    };

    return <ContextMenuItem onSelect={dialog}>Edit</ContextMenuItem>;
}

function EditForm({ project, reloadParent }: Readonly<{ project: Project; reloadParent: () => void }>) {
    const close = useContext(DialogClose);
    const onSubmit = (name: string) => {
        const body: ProjectRequest = { name };
        api.patch('/api/project/' + project.id, body)
            .then(() => {
                reloadParent();
                close();
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to rename project');
            });
    };

    return <EntityForm defaultName={project.name} onSubmit={onSubmit} label="Project Name" />;
}
