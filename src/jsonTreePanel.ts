import * as vscode from 'vscode';
import * as json5 from 'json5';
import jsonata from 'jsonata';

export class JsonTreePanel {
    private panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private currentData: unknown = null;
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

    private async handleMessage(message: { type: string; expression?: string; value?: string }) {
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

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
