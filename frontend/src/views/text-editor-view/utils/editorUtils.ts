import { editor } from 'monaco-editor';

export const savedVersionIds = new WeakMap<editor.ITextModel, number>();

export const getModelId = (model: editor.ITextModel): string => {
    if (!model?.uri) return '';

    const path = decodeURIComponent(model.uri.path);

    // Extract the file ID from the first path segment: "/{fileId}/{fileName}". The first non-empty segment is the fileId
    const segment = path.split('/').find(Boolean);
    return segment || '';
};
