/*eslint no-unassigned-vars: "error"*/
import {editor, languages, Position} from "monaco-editor";

type ThemeExtension = Omit<editor.ITokenThemeRule, 'token'>
type CompletionStub = Omit<languages.CompletionItem, 'range'>

export class Language {
    #id: string
    themeId: string
    languageId: string
    #base?: languages.IMonarchLanguage
    #tokenizer: {[name: string]: languages.IMonarchLanguageRule[]}
    #themeRules: editor.ITokenThemeRule[] = []
    #completionItems: CompletionStub[] = []
    #name: string

    constructor(id: string, base?: languages.IMonarchLanguage, name?: string) {
        this.#id = id
        this.themeId = `${id}Theme`
        this.languageId = `${id}`
        this.#base = base
        this.#tokenizer = base?.tokenizer || {}
        this.#name = name === undefined ? "" : name
    }

    register(monaco: typeof import("monaco-editor")) {
        monaco.languages.register(this.#getMetadata())
        monaco.editor.defineTheme(this.themeId, this.#getTheme())
        monaco.languages.setMonarchTokensProvider(this.languageId, this.#getLanguage())
        monaco.languages.registerCompletionItemProvider(this.languageId, this.#getCompletions())
    }

    #getMetadata(): languages.ILanguageExtensionPoint {
        return {id: this.#id}
    }

    #getTheme(): editor.IStandaloneThemeData {
        return {
            base: "vs-dark",
            inherit: true,
            colors: {},
            rules: this.#themeRules,
        }
    }

    #getLanguage(): languages.IMonarchLanguage {
        const lang = {...this.#base, tokenizer: this.#tokenizer}
        console.log(lang, this.#base)
        return lang
    }

    #getCompletions() {
        return {
            provideCompletionItems: (model: editor.ITextModel, position: Position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };
                return {suggestions: this.#completionItems.map(obj => {return {...obj, range: range}})}
            }
        }
    }

    addTokenRule(category: string, rule: languages.IMonarchLanguageRule, theme?: ThemeExtension) {
        if (this.#tokenizer[category] === undefined) {
            this.#tokenizer[category] = []
        }
        this.#tokenizer[category].unshift(rule)

        if (theme !== undefined) {
            const processAction = (action: languages.IMonarchLanguageAction) => {
                if (Array.isArray(action)) {
                    for (const element of action) {
                        this.#addActionTheme(element, theme)
                    }
                } else {
                    this.#addActionTheme(action, theme)
                }
            }

            // We want to extract the actions from the rule
            if (Array.isArray(rule)) {
                const action: languages.IMonarchLanguageAction = rule[1] //Position is always the same
                processAction(action)
            } else {
                if (rule.action !== undefined)
                    processAction(rule.action)
            }
        }
    }

    #addActionTheme(action: string | languages.IExpandedMonarchLanguageAction, theme: ThemeExtension) {
        const name = typeof action === "string" ? action : action.token;
        if (name === undefined) return
        if (theme) {
            this.#themeRules.push({token: name, ...theme})
        }
    }

    addSimpleCompletionItem(completion: CompletionStub) {
        this.#completionItems.push(completion)
    }

    getName() {
        return this.#name.length == 0 ? this.#id : this.#name
    }
}