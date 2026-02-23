import { editor } from 'monaco-editor';

export const savedVersionIds = new WeakMap<editor.ITextModel, number>();

export const getModelId = (model: editor.ITextModel): string => {
    let fileId = decodeURIComponent(model.uri.path);
    if (fileId.startsWith('/')) {
        fileId = fileId.substring(1);
    }
    return fileId;
};
