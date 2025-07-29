import {editor, languages} from "monaco-editor";
import {language as python} from "@/components/languages/python"

export class Language {
    #id: string
    themeId: string
    languageId: string

    constructor(id: string) {
        this.#id = id
        this.themeId = `${id}Theme`
        this.languageId = `${id}`
    }

    register(monaco: typeof import("monaco-editor")) {
        monaco.languages.register(this.getMetadata())
        monaco.editor.defineTheme(this.themeId, this.getTheme())
        monaco.languages.setMonarchTokensProvider(this.languageId, this.getLanguage(monaco))
        monaco.languages.registerCompletionItemProvider(this.languageId, this.getCompletions())
    }

    getMetadata(): languages.ILanguageExtensionPoint {
        return {id: this.#id}
    }

    getTheme(): editor.IStandaloneThemeData {
        return {
            base: "vs-dark",
            inherit: false,
            colors: {},
            rules: [],
        }
    }

    getLanguage(monaco: typeof import("monaco-editor")): languages.IMonarchLanguage {
        return python
    }

    getCompletions() {
        return {
            provideCompletionItems: (model, position) => {
                return {suggestions: []}
            }
        }
    }

}