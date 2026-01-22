import {editor, languages, Position} from "monaco-editor";

type ThemeExtension = Omit<editor.ITokenThemeRule, 'token'>
type CompletionStub = Omit<languages.CompletionItem, 'range'>

/**
 * A Language is a wrapper for <i>monaco-editor</i> language-extension-API.
 *
 * Useful links for language extension are:
 * <ul>
 *     <li><a href="https://microsoft.github.io/monaco-editor/monarch.html">monarch-tokenizer tutorial</a></li>
 *     <li>
 *         <a href="https://microsoft.github.io/monaco-editor/playground.html?source=v0.52.2#example-extending-language-services-custom-languages">
 *         Custom Languages
 *         </a>
 *     </li>
 * </ul>
 */
export class Language {
    id: string
    fileExtension: string
    themeId: string
    languageId: string
    base?: languages.IMonarchLanguage
    #tokenizer: {[name: string]: languages.IMonarchLanguageRule[]}
    #themeRules: editor.ITokenThemeRule[] = []
    #completionItems: CompletionStub[] = []

    /**
     * Constructs a new language
     * @param id The id of the language
     * @param fileExtension The file extension name of the language
     * @param base The optional basis for this language to be an extension of
     */
    constructor(id: string, fileExtension: string, base?: languages.IMonarchLanguage) {
        this.id = id
        this.fileExtension = fileExtension
        this.themeId = `${id}Theme`
        this.languageId = `${id}`
        this.base = base
        this.#tokenizer = base?.tokenizer || {}
    }

    /**
     * Registers this language as an extension to the given monaco instance.
     * This method should be called last, after the definition of the language
     * @param monaco The monaco instance
     */
    register(monaco: typeof import("monaco-editor")) {
        monaco.languages.register(this.#getMetadata())
        monaco.editor.defineTheme(this.themeId, this.#getTheme())
        monaco.languages.setMonarchTokensProvider(this.languageId, this.#getLanguage())
        monaco.languages.registerCompletionItemProvider(this.languageId, this.#getCompletions())
    }

    #getMetadata(): languages.ILanguageExtensionPoint {
        return {id: this.id}
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
        return {...this.base, tokenizer: this.#tokenizer}
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

    /**
     * Adds a new token to the language
     * @param category The category of the tokenizer to add this rule to, i.e. 'root'
     * @param rule The rule itself
     * @param theme An optional theme rule. Notice, that the field 'token' is not required.
     *              Instead, the token-name gets automatically extracted from the 'rule'
     */
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

    /**
     * Adds a contextless completion item to this language
     * @param completion The completionItem without the field 'range', which will get added
     *                   once the completion is called.
     */
    addSimpleCompletionItem(completion: CompletionStub) {
        this.#completionItems.push(completion)
    }

    getID() {
        return this.id.length == 0 ? this.id : this.id
    }
}