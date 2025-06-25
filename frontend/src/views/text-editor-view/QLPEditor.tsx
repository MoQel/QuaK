import {Editor} from "@monaco-editor/react";
import {useState} from "react";
import {LanguageSelector} from "@/views/text-editor-view/LanguageSelector.tsx";
import {toast} from "sonner";

function QLPEditor() {
    const [value, setValue] = useState('');
    const [language, setLanguage] = useState("python");

    const onSelect = (language : string) => {
        setLanguage(language);
        toast("Language " + language);
    }
    return <div className="h-full flex flex-col">
        <div className="shrink-0">
            <LanguageSelector language={language} onSelect={onSelect}/>
        </div>
        <div className="h-full">
            <Editor
                language={language}
                defaultValue="# Some Quantum Code"
                theme="vs-dark"
                value={value}
                onChange={(value) => setValue(value || '')}
                options={{
                    minimap: {enabled: false},
                    wordWrap: 'on',
                }}
                height="100%"
            />
        </div>
    </div>;
}

export default QLPEditor;