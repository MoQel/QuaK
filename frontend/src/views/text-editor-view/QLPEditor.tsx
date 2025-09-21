import {Editor, Monaco, loader} from "@monaco-editor/react";
import {RefObject, useEffect, useRef, useState} from "react";
import {File} from "@/views/project-manager-view/util/FileElement.tsx"
import {toast} from "sonner";
import {Menu} from "@/views/text-editor-view/Menu.tsx";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {Language} from "@/views/text-editor-view/model/Language.ts";
import {language as python} from "@/components/languages/python.ts";

const languages = [
    //Default language
    new Language("qrisp", python, "Qrisp"),
    new Language("python", python, "Python"),
]

function QLPEditor({file}: {file: File | undefined}) {
    const [value, setValue] = useState("# No File Selected");
    const [lang, setLang] = useState("python");
    const [theme, setTheme] = useState("vs-dark");
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
        if (contentId.current && contentId.current !== file?.id) {
            onSave(contentId.current);
            if (file?.id) {
                onSave(contentId.current).then(() => retrieveContent(file.id)).then(setValue);
            }
        } else if (file?.id) {
            retrieveContent(file.id).then(setValue);
        }
        contentId.current = file?.id;
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
                    defaultLanguage="python"
                    language={lang}
                    theme={theme}
                    value={value}
                    onChange={(value) => setValue(value || '')}
                    options={{
                        minimap: {enabled: false},
                        wordWrap: 'on',
                    }}
                    beforeMount={onMount}
                />
            </div>
        </div>
    );
}

}

function retrieveContent(id: string) {
    return fetch(`${API_ENDPOINT}/file/${id}/content`, {
        method: "GET"
    }).then(r => r.text())
}

export default QLPEditor;