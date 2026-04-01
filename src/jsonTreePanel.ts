import * as vscode from 'vscode';
import * as json5 from 'json5';
import jsonata from 'jsonata';

export class JsonTreePanel {
    private panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private currentData: unknown = null;
    private documentUri: vscode.Uri | undefined;
    private disposeCallback: (() => void) | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        document: vscode.TextDocument
    ) {
        this.panel = vscode.window.createWebviewPanel(
            'tlcsdm.jsonTreeView',
            'JSON Tree Viewer',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media')
                ]
            }
        );

        this.panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'images', 'icon.png');

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.webview.onDidReceiveMessage(
            (message) => this.handleMessage(message),
            null,
            this.disposables
        );

        this.update(document);
    }

    public reveal() {
        this.panel.reveal(vscode.ViewColumn.Beside);
    }

    public update(document: vscode.TextDocument) {
        const text = document.getText();
        this.documentUri = document.uri;
        try {
            this.currentData = json5.parse(text);
            this.panel.webview.html = this.getHtmlContent();
            this.panel.webview.postMessage({
                type: 'setData',
                data: this.currentData,
                fileName: document.fileName
            });
        } catch (e) {
            this.panel.webview.postMessage({
                type: 'error',
                message: `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`
            });
        }
    }

    public onDidDispose(callback: () => void) {
        this.disposeCallback = callback;
    }

    public dispose() {
        if (this.disposeCallback) {
            this.disposeCallback();
        }
        this.panel.dispose();
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async handleMessage(message: { type: string; expression?: string; value?: string; path?: string[] }) {
        switch (message.type) {
            case 'jsonata': {
                if (!message.expression || !this.currentData) {
                    return;
                }
                try {
                    const expr = jsonata(message.expression);
                    const result = await expr.evaluate(this.currentData);
                    this.panel.webview.postMessage({
                        type: 'jsonataResult',
                        result: result !== undefined ? JSON.stringify(result, null, 2) : 'No result'
                    });
                } catch (e) {
                    this.panel.webview.postMessage({
                        type: 'jsonataResult',
                        result: `Error: ${e instanceof Error ? e.message : String(e)}`
                    });
                }
                break;
            }
            case 'copyValue': {
                if (message.value !== undefined) {
                    vscode.commands.executeCommand('tlcsdm.jsonTreeView.copyValue', message.value);
                }
                break;
            }
            case 'reload': {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    this.update(editor.document);
                }
                break;
            }
            case 'locateNode': {
                if (!message.path || !this.documentUri) {
                    return;
                }
                await this.locateNodeInFile(message.path);
                break;
            }
        }
    }

    private async locateNodeInFile(path: string[]): Promise<void> {
        if (!this.documentUri) {
            return;
        }
        try {
            const document = await vscode.workspace.openTextDocument(this.documentUri);
            const text = document.getText();
            const offset = findPathOffset(text, path);
            if (offset !== null) {
                const position = document.positionAt(offset);
                const editor = await vscode.window.showTextDocument(document, {
                    viewColumn: vscode.ViewColumn.One,
                    preserveFocus: false
                });
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        } catch (e) {
            vscode.window.showWarningMessage(
                `Failed to locate node: ${e instanceof Error ? e.message : String(e)}`
            );
        }
    }

    private getHtmlContent(): string {
        const nonce = getNonce();
        const styleUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css')
        );
        const scriptUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>JSON Tree Viewer</title>
</head>
<body>
    <div class="toolbar">
        <button id="expandAll" class="toolbar-btn">Expand All</button>
        <button id="collapseAll" class="toolbar-btn">Collapse All</button>
        <button id="reloadFile" class="toolbar-btn">Reload File</button>
    </div>
    <div id="tree-container"></div>
    <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Search..." />
        <button id="searchPrev" class="search-btn" title="Previous Match">↑</button>
        <button id="searchNext" class="search-btn" title="Next Match">↓</button>
        <span id="searchCount" class="search-count"></span>
    </div>
    <div class="jsonata-bar">
        <input type="text" id="jsonataInput" placeholder="JSONata Expression..." />
        <pre id="jsonataResult" class="jsonata-result">Result...</pre>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function findPathOffset(text: string, path: string[]): number | null {
    if (path.length === 0) {
        return 0;
    }

    let pos = 0;

    function skipLineComment(): void {
        pos += 2; // skip //
        while (pos < text.length && text[pos] !== '\n') {
            pos++;
        }
    }

    function skipBlockComment(): void {
        pos += 2; // skip /*
        while (pos < text.length - 1 && !(text[pos] === '*' && text[pos + 1] === '/')) {
            pos++;
        }
        if (pos < text.length - 1) {
            pos += 2; // skip */
        }
    }

    function skipWhitespaceAndComments(): void {
        while (pos < text.length) {
            if (/\s/.test(text[pos])) {
                pos++;
            } else if (text[pos] === '/' && pos + 1 < text.length && text[pos + 1] === '/') {
                skipLineComment();
            } else if (text[pos] === '/' && pos + 1 < text.length && text[pos + 1] === '*') {
                skipBlockComment();
            } else {
                break;
            }
        }
    }

    function readString(): string {
        const quote = text[pos];
        if (quote !== '"' && quote !== "'") {
            return '';
        }
        pos++; // skip opening quote
        let result = '';
        while (pos < text.length && text[pos] !== quote) {
            if (text[pos] === '\\') {
                pos++;
                if (pos < text.length) {
                    result += text[pos];
                }
            } else {
                result += text[pos];
            }
            pos++;
        }
        if (pos < text.length) {
            pos++; // skip closing quote
        }
        return result;
    }

    function readUnquotedKey(): string {
        let result = '';
        while (pos < text.length && /[a-zA-Z0-9_$]/.test(text[pos])) {
            result += text[pos];
            pos++;
        }
        return result;
    }

    function skipValue(): void {
        skipWhitespaceAndComments();
        if (pos >= text.length) {
            return;
        }
        const ch = text[pos];
        if (ch === '"' || ch === "'") {
            readString();
        } else if (ch === '{') {
            skipObject();
        } else if (ch === '[') {
            skipArray();
        } else {
            // number, boolean, null, or unquoted identifier
            while (pos < text.length && !/[\s,}\]:]/.test(text[pos])) {
                pos++;
            }
        }
    }

    function skipObject(): void {
        pos++; // skip {
        skipWhitespaceAndComments();
        while (pos < text.length && text[pos] !== '}') {
            if (text[pos] === ',') {
                pos++;
                skipWhitespaceAndComments();
                continue;
            }
            // read key
            if (text[pos] === '"' || text[pos] === "'") {
                readString();
            } else {
                readUnquotedKey();
            }
            skipWhitespaceAndComments();
            if (pos < text.length && text[pos] === ':') {
                pos++;
            }
            skipValue();
            skipWhitespaceAndComments();
        }
        if (pos < text.length) {
            pos++; // skip }
        }
    }

    function skipArray(): void {
        pos++; // skip [
        skipWhitespaceAndComments();
        while (pos < text.length && text[pos] !== ']') {
            if (text[pos] === ',') {
                pos++;
                skipWhitespaceAndComments();
                continue;
            }
            skipValue();
            skipWhitespaceAndComments();
        }
        if (pos < text.length) {
            pos++; // skip ]
        }
    }

    function findInValue(pathIndex: number): number | null {
        skipWhitespaceAndComments();
        if (pathIndex >= path.length || pos >= text.length) {
            return null;
        }

        if (text[pos] === '{') {
            return findInObject(pathIndex);
        } else if (text[pos] === '[') {
            return findInArray(pathIndex);
        }
        return null;
    }

    function findInObject(pathIndex: number): number | null {
        const targetKey = path[pathIndex];
        pos++; // skip {
        skipWhitespaceAndComments();

        while (pos < text.length && text[pos] !== '}') {
            if (text[pos] === ',') {
                pos++;
                skipWhitespaceAndComments();
                continue;
            }

            const keyStart = pos;
            let key: string;
            if (text[pos] === '"' || text[pos] === "'") {
                key = readString();
            } else {
                key = readUnquotedKey();
            }

            skipWhitespaceAndComments();
            if (pos < text.length && text[pos] === ':') {
                pos++;
            }
            skipWhitespaceAndComments();

            if (key === targetKey) {
                if (pathIndex === path.length - 1) {
                    return keyStart;
                }
                return findInValue(pathIndex + 1);
            } else {
                skipValue();
            }
            skipWhitespaceAndComments();
        }

        if (pos < text.length) {
            pos++; // skip }
        }
        return null;
    }

    function findInArray(pathIndex: number): number | null {
        const targetIndex = parseInt(path[pathIndex], 10);
        if (isNaN(targetIndex)) {
            return null;
        }

        pos++; // skip [
        skipWhitespaceAndComments();

        let currentIndex = 0;
        while (pos < text.length && text[pos] !== ']') {
            if (text[pos] === ',') {
                pos++;
                skipWhitespaceAndComments();
                currentIndex++;
                continue;
            }

            const valueStart = pos;
            if (currentIndex === targetIndex) {
                if (pathIndex === path.length - 1) {
                    return valueStart;
                }
                return findInValue(pathIndex + 1);
            }

            skipValue();
            skipWhitespaceAndComments();
        }

        if (pos < text.length) {
            pos++; // skip ]
        }
        return null;
    }

    return findInValue(0);
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
