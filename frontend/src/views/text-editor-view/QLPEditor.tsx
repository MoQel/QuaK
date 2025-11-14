import {Editor, Monaco, loader} from "@monaco-editor/react";
import {RefObject, useEffect, useRef, useState} from "react";
import {File} from "@/views/project-manager-view/util/FileElement.tsx"
import {toast} from "sonner";
import {Menu} from "@/views/text-editor-view/Menu.tsx";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {Language} from "@/views/text-editor-view/model/Language.ts";
import {python} from "@/components/languages/python.ts";
import {openqasm} from "@/components/languages/openqasm.ts";

const DEFAULT_VALUE = "No File Selected";
const DEFAULT_LANG = "txt";

const languages = [
    //Default language
    new Language("txt",undefined, "Text"),
    new Language("py", python, "Python"),
    new Language("qasm", openqasm, "QASM"),
]

function QLPEditor({file}: {file: File | undefined}) {
    const [value, setValue] = useState(DEFAULT_VALUE);
    const [lang, setLang] = useState(DEFAULT_LANG);
    const [theme, setTheme] = useState("vs-dark");
    const [readOnly, setReadOnly] = useState<boolean>(true);
    const contentId: RefObject<string | undefined> = useRef(undefined);

    const onMount = (monaco: Monaco) => {
        for (const language of languages) {
            language.register(monaco);
        }
        setLang(languages[0].languageId);
        setTheme(languages[0].themeId);
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
                setTheme(l.themeId);
                toast("Language " + l.getName());
            },
            displayName: l.getName(),
        }));
    };

    return (
        <div className="h-full flex flex-col p-0">
            <Menu onSave={() => onSave(file?.id)} languages={formatLanguages(languages)}/>
            <div className="h-full">
                <Editor
                    defaultLanguage="txt"
                    language={lang}
                    theme={theme}
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

function getLanguageOrDefaultByExtension(ext: string): string {
    const match = languages.find(l => l.id === ext);
    return match ? match.id : "txt"; // Default
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

export default QLPEditor;