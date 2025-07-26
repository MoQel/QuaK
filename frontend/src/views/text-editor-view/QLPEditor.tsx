import {Editor, Monaco, useMonaco} from "@monaco-editor/react";
import {editor} from "monaco-editor"
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Menu} from "@/views/text-editor-view/Menu.tsx";
import {API_ENDPOINT} from "@/views/project-manager-view/ProjectManagerView.tsx";

interface File {
    id: string,
    mimeType: string,
}

function QLPEditor({file}: {file: File}) {
    const [value, setValue] = useState("# Loading...");
    toast(value)

    const onMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        console.log(editor, monaco)
    }

    const monaco = useMonaco();

    const onSave = () => {
        return fetch(`${API_ENDPOINT}/file/${file.id}/content`, {
            method: "PUT",
            body: monaco?.editor.getEditors().at(0)?.getValue()
        }).then(() => retrieveContent(file.id)).then(setValue)
    }

    useEffect(() => {
        retrieveContent(file.id).then(setValue)
    }, [file])

    return <div className="h-full flex flex-col p-0">
        <Menu onSave={onSave}/>
        <div className="h-full">
            <Editor
                defaultLanguage="python"
                theme="vs-dark"
                value={value}
                onChange={(value) => setValue(value || '')}
                options={{
                    minimap: {enabled: false},
                    wordWrap: 'on',
                }}
                onMount={onMount}
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