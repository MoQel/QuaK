import {Editor} from "@monaco-editor/react";
import {useState} from "react";
import {LanguageSelector} from "@/components/ui/LanguageSelector.tsx";
import {toast} from "sonner";

function QLPEditor() {
    const [value, setValue] = useState('');
    const [language, setLanguage] = useState("python");

    const onSelect = (language : string) => {
        setLanguage(language);
        toast("Language " + language);
    }
    return <div className="h-full">
        <LanguageSelector language={language} onSelect={onSelect} />
        <Editor
            className="h-full"
            language={language}
            defaultValue="# Some Quantum Code"
            theme="vs-dark"
            value={value}
            onChange={(value) => setValue(value || '')}
        />
    </div>;
}

export default QLPEditor;