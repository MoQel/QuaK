import React, { useState } from 'react';

import { Button } from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { api } from '@/api/api.ts';
import type { ProjectDetailsResponse, ProjectRequest } from '@/api/dto/filesystem.ts';
import { EntityForm } from '@/views/project-manager-view/util/FormUtils.tsx';
import { toast } from 'sonner';

export type ProjectRef = {
    id: string;
    name: string;
};

type RenameOptions = {
    onRenamed?: (updated: ProjectDetailsResponse) => void | Promise<void>;
};

type DeleteOptions = {
    onDeleted?: () => void | Promise<void>;
};

/**
 * Reusable modal dialogs for project rename/delete.
 * Kept intentionally identical to the HomePage dialogs to avoid re-implementing UX.
 */
export function useProjectActionsDialog() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);

    const openDialog = (content: React.ReactNode) => {
        setDialogContent(content);
        setDialogOpen(true);
    };

    const closeDialog = () => setDialogOpen(false);

    const openRenameProjectDialog = (project: ProjectRef, options?: RenameOptions) => {
        openDialog(
            <>
                <DialogHeader>
                    <DialogTitle>Rename Project</DialogTitle>
                    <DialogDescription>Choose a new name for “{project.name}”.</DialogDescription>
                </DialogHeader>
                <EntityForm
                    defaultName={project.name}
                    label="Project Name"
                    onSubmit={(name) => {
                        const body: ProjectRequest = { name };
                        api.patch<ProjectDetailsResponse>(`/api/project/${project.id}`, body)
                            .then(async (updated) => {
                                closeDialog();
                                await options?.onRenamed?.(updated);
                            })
                            .catch((err) => {
                                toast.error(err?.message || 'Failed to rename project');
                            });
                    }}
                />
            </>,
        );
    };

    const openDeleteProjectDialog = (project: ProjectRef, options?: DeleteOptions) => {
        openDialog(
            <>
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                        This will permanently delete “{project.name}”. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        api.delete(`/api/project/${project.id}`)
                            .then(async () => {
                                closeDialog();
                                await options?.onDeleted?.();
                            })
                            .catch((err) => {
                                toast.error(err?.message || 'Failed to delete project');
                            });
                    }}
                >
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive">
                            Delete
                        </Button>
                    </DialogFooter>
                </form>
            </>,
        );
    };

    const dialog = (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>{dialogContent}</DialogContent>
        </Dialog>
    );

    return {
        dialog,
        openRenameProjectDialog,
        openDeleteProjectDialog,
        closeDialog,
    };
}
