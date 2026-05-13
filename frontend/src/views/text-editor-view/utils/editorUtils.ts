import { editor } from 'monaco-editor';

export const savedVersionIds = new WeakMap<editor.ITextModel, number>();

export const getModelId = (model: editor.ITextModel): string => {
    if (!model?.uri) return '';

    let path = decodeURIComponent(model.uri.path);
    if (path.startsWith('/')) {
        path = path.substring(1);
    }

    const segments = path.split('/');
    return segments[1];
};
