import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Project } from '@/views/project-manager-view/Project.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Context, createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Form, FormField } from '@/components/ui/form.tsx';
import { z, ZodObject, ZodRawShape } from 'zod';
import { DefaultValues, FieldPath, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { sort, getElementForFileElement } from '@/views/project-manager-view/util/FileElement.tsx';
import { DialogCloseButtons, TextInput } from '@/views/project-manager-view/util/FormComponents.tsx';
import { Plus, FilePlus, FolderPlus, LucideIcon } from 'lucide-react';
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

function ToolbarDialog({
    icon: Icon,
    title,
    parentId,
    reloadAll,
    children,
}: {
    icon: LucideIcon;
    title: string;
    parentId: string;
    reloadAll: () => void;
    children: (props: { parent: string; onClose: () => void }) => ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title={title} className="h-8 w-8 hover:bg-accent">
                    <Icon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <ParentRefresh value={reloadAll}>
                    {children({ parent: parentId, onClose: () => setOpen(false) })}
                </ParentRefresh>
            </DialogContent>
        </Dialog>
    );
}

function ProjectToolbar({ projectId, reload }: { projectId: string; reload: () => void }) {
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
            <ToolbarDialog icon={FilePlus} title="Create a new file" parentId={parentId} reloadAll={reloadAll}>
                {(props) => <CreateFileForm {...props} />}
            </ToolbarDialog>

            <ToolbarDialog icon={FolderPlus} title="Create a new Directory" parentId={parentId} reloadAll={reloadAll}>
                {(props) => <CreateDirectoryForm {...props} />}
            </ToolbarDialog>
        </div>
    );
}

interface FormFieldConfig<T extends ZodRawShape> {
    name: FieldPath<z.infer<ZodObject<T>>>;
    placeholder: string;
    label: string;
}

function CreateElementForm<T extends ZodRawShape>({
    parent,
    onClose,
    schema,
    defaults,
    apiEndpoint,
    errorMessage,
    fields,
    buildBody,
}: {
    parent: string;
    onClose: () => void;
    schema: ZodObject<T>;
    defaults: DefaultValues<z.infer<ZodObject<T>>>;
    apiEndpoint: string;
    errorMessage: string;
    fields: FormFieldConfig<T>[];
    buildBody?: (values: z.infer<ZodObject<T>>) => Record<string, unknown>;
}) {
    const reloadParent = useContext(ParentRefresh);

    const form = useForm<z.infer<ZodObject<T>>>({
        resolver: zodResolver(schema),
        defaultValues: defaults,
    });

    const onSubmit = (values: z.infer<ZodObject<T>>) => {
        const body = buildBody ? buildBody(values) : values;
        api.post(apiEndpoint, body, { headers: { 'parent-id': parent } })
            .then(() => {
                reloadParent();
                onClose();
            })
            .catch((err) => {
                toast.error(err.message || errorMessage);
            });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                {fields.map((fieldConfig) => (
                    <FormField
                        key={fieldConfig.name}
                        control={form.control}
                        name={fieldConfig.name}
                        render={({ field }) => (
                            <TextInput placeholder={fieldConfig.placeholder} label={fieldConfig.label} field={field} />
                        )}
                    />
                ))}
                <DialogCloseButtons />
            </form>
        </Form>
    );
}

const fileSchema = z.object({
    name: z.string().min(1, { message: 'Filename must be at least 1 characters.' }),
    contentType: z.string(),
});

const fileFields: FormFieldConfig<typeof fileSchema.shape>[] = [
    { name: 'name', placeholder: 'new_file.txt', label: 'Filename' },
    { name: 'contentType', placeholder: 'application/json', label: 'Content-Type' },
];

function CreateFileForm({ parent, onClose }: { parent: string; onClose: () => void }) {
    return (
        <CreateElementForm
            parent={parent}
            onClose={onClose}
            schema={fileSchema}
            defaults={{ name: 'untitled.txt', contentType: 'text/plain' }}
            apiEndpoint="/api/file/"
            errorMessage="Failed to create file"
            fields={fileFields}
        />
    );
}

const directorySchema = z.object({
    name: z.string().min(1, { message: 'Directory name must be at least 1 character.' }),
});

const directoryFields: FormFieldConfig<typeof directorySchema.shape>[] = [
    { name: 'name', placeholder: 'folder', label: 'Name of the directory' },
];

function CreateDirectoryForm({ parent, onClose }: { parent: string; onClose: () => void }) {
    return (
        <CreateElementForm
            parent={parent}
            onClose={onClose}
            schema={directorySchema}
            defaults={{ name: 'new_folder' }}
            apiEndpoint="/api/directory/"
            errorMessage="Failed to create directory"
            fields={directoryFields}
        />
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
