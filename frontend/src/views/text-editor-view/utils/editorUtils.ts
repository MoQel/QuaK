import { editor } from 'monaco-editor';

export const savedVersionIds = new WeakMap<editor.ITextModel, number>();

export const getModelId = (model: editor.ITextModel): string => {
    if (!model?.uri) return '';

    const path = decodeURIComponent(model.uri.path);

    const segment = path.split('/').find(Boolean);
    return segment || '';
};
