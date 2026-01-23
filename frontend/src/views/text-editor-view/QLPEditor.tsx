import { Editor, loader, Monaco } from "@monaco-editor/react";
import { RefObject, useEffect, useRef, useState } from "react";
import { File } from "@/views/project-manager-view/util/FileElement.tsx"
import { toast } from "sonner";
import { Menu } from "@/views/text-editor-view/Menu.tsx";
import { Language } from "@/views/text-editor-view/model/Language.ts";
import { qrisp } from "@/components/languages/qrisp.ts";
import { openqasm } from "@/components/languages/openqasm.ts";
import { api } from "@/api/api.ts";
import { useTheme } from "@/theme";
import { FileContentRequest, FileContentResponse, FileDetailsResponse } from "@/api/dto/filesystem.ts";

import { Base64 } from 'js-base64';

const DEFAULT_VALUE = "No File Selected";
const DEFAULT_LANG = "plaintext";



const languages = [
    new Language("plaintext", "txt"),
    new Language("python", "py"),
    new Language("qrisp", "qrisp", qrisp),
    new Language("qasm", "qasm", openqasm),
]

function QLPEditor({ file }: { file: File | undefined }) {
    const [value, setValue] = useState(DEFAULT_VALUE);
    const [lang, setLang] = useState(DEFAULT_LANG);
    const [readOnly, setReadOnly] = useState<boolean>(true);
    const contentId: RefObject<string | undefined> = useRef(undefined);
    const { theme } = useTheme();
    const monacoTheme = theme === "dark" ? "vs-dark" : "vs-light";

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

        const encodedContent = Base64.encode(edit.getValue());

        // TODO: Make use of ContentType
        const body: FileContentRequest = {
            content: encodedContent,
            contentType: "text/plain"
        }

        return api.put(`/api/file/${id}/content`, body)
            .then(() => retrieveContent(id))
            .then((newContent) => {
                if (newContent === null) {
                    toast.error("Error reloading content after save");
                } else {
                    setValue(newContent);
                    toast("Saved successfully");
                }
            });
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
            const content = await retrieveContent(file.id);
            if (content === null) {
                toast.error(`Couldn't load file ${file.name}`);
                setValue("Error loading file.");
            } else {
                setValue(content);
            }

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

    // TODO: extract file extension from contentType
    function retrieveFileExtension(id: string): Promise<string> {
        return api.get<FileDetailsResponse>(`/api/file/${id}`)
            .then((fileElement) => {
                const filename = fileElement.name;
                if (!filename?.includes(".")) {
                    return "txt"; // fallback
                }
                return filename.substring(filename.lastIndexOf(".") + 1);
            });
    }

    async function retrieveContent(id: string): Promise<string | null> {
        try {
            const response = await api.get<FileContentResponse>(`/api/file/${id}/content`);
            return Base64.decode(response.content);
        } catch (error) {
            console.error(`Failed to retrieve content for file ${id}`, error);
            return null;
        }
    }

    return (
        <div className="h-full flex flex-col p-0">
            <Menu onSave={() => onSave(file?.id)} languages={formatLanguages(languages)} />
            <div className="h-full">
                <Editor
                    language={lang}
                    theme={monacoTheme}
                    value={value}
                    onChange={(value) => setValue(value || '')}
                    options={{
                        minimap: { enabled: false },
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