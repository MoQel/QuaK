import { openqasm3 } from '@/views/text-editor-view/languages/openqasm.ts';
import { Language } from '@/views/text-editor-view/model/Language.ts';

export const DEFAULT_LANG = 'plaintext';

export const languages = [
    new Language('plaintext', 'txt', 'Plaintext', 'plaintext'),
    new Language('python', 'py', 'Python', 'python'),
    new Language('qrisp', 'qrisp', 'Qrisp', 'python'),
    new Language('qasm', 'qasm', 'OpenQASM 3.0', 'qasm', openqasm3),
];
