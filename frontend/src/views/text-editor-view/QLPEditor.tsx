import {Editor, Monaco, loader} from "@monaco-editor/react";
import {RefObject, useEffect, useRef, useState} from "react";
import {File} from "@/views/project-manager-view/util/FileElement.tsx"
import {toast} from "sonner";
import {Menu} from "@/views/text-editor-view/Menu.tsx";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {Language} from "@/views/text-editor-view/model/Language.ts";
import {qrisp} from "@/components/languages/qrisp.ts";
import {openqasm} from "@/components/languages/openqasm.ts";

const DEFAULT_VALUE = "No File Selected";
const DEFAULT_LANG = "plaintext";
const THEME = "vs-dark";

const languages = [
    new Language("plaintext", "txt"),
    new Language("python", "py"),
    new Language("qrisp", "qrisp", qrisp),
    new Language("qasm", "qasm", openqasm),
]

function QLPEditor({file}: {file: File | undefined}) {
    const [value, setValue] = useState(DEFAULT_VALUE);
    const [lang, setLang] = useState(DEFAULT_LANG);
    const [readOnly, setReadOnly] = useState<boolean>(true);
    const contentId: RefObject<string | undefined> = useRef(undefined);

    const onMount = (monaco: Monaco) => {
        for (const language of languages) {
            if (language.base !== undefined) language.register(monaco);
        }
    };

    const onSave = (id: string | undefined) => {
        if (!id) return Promise.resolve();
        const edit = loader.__getMonacoInstance()?.editor.getEditors().at(0);
        if (!edit) {
            toast("Editor undefined, not saving");
            return Promise.resolve();
        }
        return fetch(`${API_ENDPOINT}/file/${id}/content`, {
            method: "PUT",
            body: edit.getValue(),
        })
            .then(() => retrieveContent(id))
            .then(setValue)
            .then(() => toast("Saved successfully"));
    };

    useEffect(() => {
        if (!file?.id) {
            contentId.current = undefined;
            setValue(DEFAULT_VALUE);
            setLang(DEFAULT_LANG);
            setReadOnly(true);
            return;
        }

        (async () => {
            const prev = contentId.current;

            // Save previous file before switching
            if (prev && prev !== file.id) {
                await onSave(prev);
            }

            // Set new content
            const content: string = await retrieveContent(file.id);
            setValue(content);

            // Set new language
            const ext: string = await retrieveFileExtension(file.id);
            setLang(getLanguageOrDefaultByExtension(ext));

            // Enable writing
            setReadOnly(false);

            // Update reference
            contentId.current = file.id;
        })();
    }, [file]);

    const formatLanguages = (langs: Language[]) => {
        return langs.map(l => ({
            isSelected: l.languageId === lang,
            select: () => {
                setLang(l.languageId);
                toast("Language " + l.getID().toUpperCase());
            },
            displayName: l.getID().toUpperCase(),
        }));
    };

    function getLanguageOrDefaultByExtension(ext: string): string {
        const match = languages.find(l => l.fileExtension === ext);
        return match ? match.id : DEFAULT_LANG; // Default
    }

    function retrieveFileExtension(id: string): Promise<string> {
        return fetch(`${API_ENDPOINT}/file/${id}`, {method: "GET"})
            .then(r => r.json())
            .then((fileElement) => {
                const filename = fileElement.name;
                if (!filename?.includes(".")) {
                    return "txt"; // fallback
                }
                return filename.substring(filename.lastIndexOf(".") + 1);
            });
    }

    function retrieveContent(id: string): Promise<string> {
        return fetch(`${API_ENDPOINT}/file/${id}/content`, {
            method: "GET"
        }).then(r => r.text())
    }

    return (
        <div className="h-full flex flex-col p-0">
            <Menu onSave={() => onSave(file?.id)} languages={formatLanguages(languages)}/>
            <div className="h-full">
                <Editor
                    language={lang}
                    theme={THEME}
                    value={value}
                    onChange={(value) => setValue(value || '')}
                    options={{
                        minimap: {enabled: false},
                        wordWrap: 'on',
                        readOnly: readOnly,
                    }}
                    beforeMount={onMount}
                />
            </div>
        </div>
    );
}

export default QLPEditor;