import { qrisp } from '@/views/text-editor-view/languages/qrisp.ts';
import { openqasm } from '@/views/text-editor-view/languages/openqasm.ts';
import { Language } from '@/views/text-editor-view/model/Language.ts';

export const DEFAULT_LANG = 'plaintext';

export const languages = [
    new Language('plaintext', 'txt'),
    new Language('python', 'py'),
    new Language('qrisp', 'qrisp', qrisp),
    new Language('qasm', 'qasm', openqasm),
];
