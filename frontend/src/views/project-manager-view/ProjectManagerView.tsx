import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Project } from '@/views/project-manager-view/Project.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Context, createContext, useContext, useEffect, useState } from 'react';
import { Form, FormField } from '@/components/ui/form.tsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { sort, getElementForFileElement } from '@/views/project-manager-view/util/FileElement.tsx';
import { DialogCloseButtons, TextInput } from '@/views/project-manager-view/util/FormComponents.tsx';
import { Plus, FilePlus, FolderPlus } from 'lucide-react';
import { Empty } from '@/views/project-manager-view/util/TreeComponents.tsx';
import { File } from '@/views/project-manager-view/util/FileElement.tsx';
import { api } from '@/api/api.ts';
import { ProjectDetailsResponse, ProjectRequest, ProjectContentsResponse } from '@/api/dto/filesystem.ts';
import { toast } from 'sonner';

export const ParentRefresh = createContext(() => {});
export const DialogClose = createContext(() => {});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FileSelect: Context<(file: File) => void> = createContext((_) => {});

export interface SelectedFolderState {
    id: string | null;
    setId: (id: string | null) => void;
    reloadTrigger: number;
    triggerReload: () => void;
}
export const SelectedFolder = createContext<SelectedFolderState>({
    id: null,
    setId: () => {},
    reloadTrigger: 0,
    triggerReload: () => {},
});

/**
 * Displays a tree-view of the projects inside a {@link Card}
 * @constructor
 */
export function ProjectManagerView({
    onFileSelect,
    projectId,
}: {
    onFileSelect: (file: File) => void;
    projectId?: string;
}) {
    const [content, setContent] = useState([<Skeleton className="h-4" key="LOADING" />]);
    const [reloaded, r] = useState(false);
    const reload = () => r(!reloaded);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedFolderReloadTrigger, setSelectedFolderReloadTrigger] = useState(0);
    const triggerSelectedFolderReload = () => setSelectedFolderReloadTrigger((prev) => prev + 1);

    useEffect(() => {
        fetchProjects(projectId).then(setContent);
    }, [reloaded, projectId]);

    return (
        <Card className="h-full border-0 rounded-none bg-background shadow-none p-0 gap-0">
            <SelectedFolder
                value={{
                    id: selectedFolderId,
                    setId: setSelectedFolderId,
                    reloadTrigger: selectedFolderReloadTrigger,
                    triggerReload: triggerSelectedFolderReload,
                }}
            >
                <div className="flex flex-col h-full">
                    {projectId && <ProjectToolbar projectId={projectId} reload={reload} />}
                    <CardContent className="overflow-auto p-0 flex-1 min-h-0">
                        <div
                            className="p-4 pt-2 min-h-full"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setSelectedFolderId(null);
                            }}
                        >
                            <FileSelect value={onFileSelect}>
                                <ParentRefresh value={reload}>
                                    {content}
                                    {!projectId && <CreateProject reload={reload} key="NEW" />}
                                </ParentRefresh>
                            </FileSelect>
                        </div>
                    </CardContent>
                </div>
            </SelectedFolder>
        </Card>
    );
}

async function fetchProjects(projectId?: string) {
    try {
        if (projectId) {
            const project = await api.get<ProjectContentsResponse>(`/api/project/${projectId}`);
            const elements = [];
            if (project.contents && project.contents.length > 0) {
                for (const element of sort(project.contents)) {
                    elements.push(getElementForFileElement(element));
                }
            } else {
                elements.push(<Empty key="empty" />);
            }
            return elements;
        }

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

function ProjectToolbar({ projectId, reload }: { projectId: string; reload: () => void }) {
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const { id: selectedFolderId, triggerReload } = useContext(SelectedFolder);

    // Use the selected folder as parent if one is highlighted, otherwise fall back to projectId
    const parentId = selectedFolderId ?? projectId;

    // Wraps the original reload to also reload the selected folder's contents
    const reloadAll = () => {
        reload();
        if (selectedFolderId) {
            triggerReload();
        }
    };

    return (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/20">
            <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="New File" className="h-8 w-8 hover:bg-accent">
                        <FilePlus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a new file</DialogTitle>
                    </DialogHeader>
                    <ParentRefresh value={reloadAll}>
                        <CreateFileForm parent={parentId} onClose={() => setFileDialogOpen(false)} />
                    </ParentRefresh>
                </DialogContent>
            </Dialog>

            <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="New Folder" className="h-8 w-8 hover:bg-accent">
                        <FolderPlus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a new Directory</DialogTitle>
                    </DialogHeader>
                    <ParentRefresh value={reloadAll}>
                        <CreateDirectoryForm parent={parentId} onClose={() => setFolderDialogOpen(false)} />
                    </ParentRefresh>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CreateFileForm({ parent, onClose }: { parent: string; onClose: () => void }) {
    const reloadParent = useContext(ParentRefresh);

    const formSchema = z.object({
        name: z.string().min(1, { message: 'Filename must be at least 1 characters.' }),
        contentType: z.string(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: 'untitled.txt',
            contentType: 'text/plain',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = {
            name: values.name,
            contentType: values.contentType,
        };
        api.post('/api/file/', body, { headers: { 'parent-id': parent } })
            .then(() => {
                reloadParent();
                onClose();
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to create file');
            });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => <TextInput placeholder="new_file.txt" label="Filename" field={field} />}
                />
                <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                        <TextInput placeholder="application/json" label="Content-Type" field={field} />
                    )}
                />
                <DialogCloseButtons />
            </form>
        </Form>
    );
}

function CreateDirectoryForm({ parent, onClose }: { parent: string; onClose: () => void }) {
    const reloadParent = useContext(ParentRefresh);

    const formSchema = z.object({
        name: z.string().min(1, { message: 'Directory name must be at least 1 character.' }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: 'new_folder',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const body = { name: values.name };
        api.post('/api/directory/', body, { headers: { 'parent-id': parent } })
            .then(() => {
                reloadParent();
                onClose();
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to create directory');
            });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <TextInput placeholder="folder" label="Name of the directory" field={field} />
                    )}
                />
                <DialogCloseButtons />
            </form>
        </Form>
    );
}

export function CreateProject({
    reload,
    onSuccess,
    children,
}: {
    reload?: () => void;
    onSuccess?: (project: ProjectDetailsResponse) => void;
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
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

        api.post<ProjectDetailsResponse>('/api/project/', body)
            .then((project) => {
                setOpen(false);
                if (onSuccess) {
                    onSuccess(project);
                }
                if (reload) {
                    reload();
                }
            })
            .catch((err) => {
                toast.error(err.message || 'Failed to create project');
            });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className="create-project">
                {children || (
                    <Button className="w-full" variant="ghost">
                        <Plus />
                    </Button>
                )}
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
                                <TextInput placeholder="New Project" label="Name of the Project" field={field} />
                            )}
                        />
                        <DialogCloseButtons submit={'Save'} />
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
