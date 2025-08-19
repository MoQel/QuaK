import {Editor, Monaco, loader} from "@monaco-editor/react";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Menu} from "@/views/text-editor-view/Menu.tsx";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";
import {Language} from "@/views/text-editor-view/model/Language.ts";
import {language as python} from "@/components/languages/python.ts";

interface File {
    id: string,
    mimeType: string,
}

const languages = [
    //Default language
    new Language("qrisp", python, "Qrisp"),
    new Language("python", python, "Python"),
]

/**
 * Component that displays a text-editor to edit the given file
 * @param file The metadata of the file to be edited
 * @constructor
 */
function QLPEditor({file}: {file: File}) {
    const [value, setValue] = useState("# Loading...");
    const [lang, setLang] = useState("python");
    const [theme, setTheme] = useState("vs-dark");

    const onMount = (monaco: Monaco) => {
        for (const language of languages) {
            language.register(monaco)
        }
        setLang(languages[0].languageId)
        setTheme(languages[0].themeId)
    }

    const onSave = () => {
        const edit = loader.__getMonacoInstance()?.editor.getEditors().at(0)
        if (edit === undefined) {
            toast("Editor undefined, not saving")
            return
        }
        fetch(`${API_ENDPOINT}/file/${file.id}/content`, {
            method: "PUT",
            body: edit.getValue()
        })
            .then(() => retrieveContent(file.id))
            .then(setValue)
            .then(() => toast("Saved successfully"))
    }

    useEffect(() => {
        retrieveContent(file.id).then(setValue)
    }, [file])

    const formatLanguages = (langs: Language[]) => {
        return langs.map(l => ({
            isSelected: (l.languageId === lang),
            select: () => {
                setLang(l.languageId);
                setTheme(l.themeId)
            },
            displayName: l.getName()
        }))
    }

    return <div className="h-full flex flex-col p-0">
        <Menu onSave={onSave} languages={formatLanguages(languages)}/>
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
    </div>;
}

function retrieveContent(id: string) {
    return fetch(`${API_ENDPOINT}/file/${id}/content`, {
        method: "GET"
    }).then(r => r.text())
}

export default QLPEditor;