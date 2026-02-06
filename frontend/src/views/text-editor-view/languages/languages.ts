import { openqasm3 } from '@/views/text-editor-view/languages/openqasm.ts';
import { Language } from '@/views/text-editor-view/model/Language.ts';

export const DEFAULT_LANG = 'plaintext';

export const languages = [
    new Language('plaintext', 'txt', 'Plaintext'),
    new Language('python', 'py', 'Python'),
    new Language('python', 'qrisp', 'Qrisp'),
    new Language('qasm', 'qasm', 'OpenQASM', openqasm3),
];
