import { Card, CardContent } from '@/components/ui/card.tsx';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Project } from '@/views/project-manager-view/Project.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Context, createContext, useEffect, useState } from 'react';
import { Form, FormField } from '@/components/ui/form.tsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { sort } from '@/views/project-manager-view/util/FileElement.tsx';
import {
    DialogCloseButtons,
    TextInput,
} from '@/views/project-manager-view/util/FormComponents.tsx';
import { Plus } from 'lucide-react';
import { Empty } from '@/views/project-manager-view/util/TreeComponents.tsx';
import { File } from '@/views/project-manager-view/util/FileElement.tsx';
import { api } from '@/api/api.ts';
import { ProjectDetailsResponse, ProjectRequest } from '@/api/dto/filesystem.ts';

export const ParentRefresh = createContext(() => {});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FileSelect: Context<(file: File) => void> = createContext((_) => {});

/**
 * Displays a tree-view of the projects inside a {@link Card}
 * @constructor
 */
export function ProjectManagerView({ onFileSelect }: { onFileSelect: (file: File) => void }) {
    const [content, setContent] = useState([<Skeleton className="h-4" key="LOADING" />]);
    const [reloaded, r] = useState(false);
    const reload = () => r(!reloaded);

    useEffect(() => {
        fetchProjects().then(setContent);
    }, [reloaded]);

    return (
        <Card className="h-full">
            <CardContent className="overflow-auto">
                <div className="flex-col">
                    <FileSelect value={onFileSelect}>
                        <ParentRefresh value={reload}>
                            {content}
                            <CreateProject reload={reload} key="NEW" />
                        </ParentRefresh>
                    </FileSelect>
                </div>
            </CardContent>
        </Card>
    );
}

async function fetchProjects() {
    try {
        const projects = await api.get<ProjectDetailsResponse[]>('/api/project/');
        const elements = [];
        if (projects.length == 0) {
            elements.push(<Empty key="empty" />);
        } else {
            for (const project of sort(projects)) {
                elements.push(<Project name={project.name} id={project.id} key={project.id} />);
            }
        }
        return elements;
    } catch (e) {
        console.error('Failed to fetch projects', e);
        return [<Empty key="error" />];
    }
}

function CreateProject({ reload }: { reload: () => void }) {
    const formSchema = z.object({
        name: z.string().min(1, {
            message: 'Name of the project must be at least 1 characters.',
        }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: 'New Project',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body: ProjectRequest = {
            name: values.name,
        };

        api.post('/api/project/', body).then(reload);
    };

    return (
        <Dialog>
            <DialogTrigger asChild className="create-project">
                <Button className="w-full" variant="ghost">
                    <Plus />
                </Button>
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
                            render={({ field }) => (
                                <TextInput
                                    placeholder="New Project"
                                    label="Name of the Project"
                                    field={field}
                                />
                            )}
                        />
                        <DialogCloseButtons submit={'Save'} />
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
