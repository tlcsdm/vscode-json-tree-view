import * as vscode from 'vscode';
import { JsonTreePanel } from './jsonTreePanel';

let currentPanel: JsonTreePanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    const openCommand = vscode.commands.registerCommand('tlcsdm.jsonTreeView.open', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found. Please open a JSON file first.');
            return;
        }

        const document = editor.document;
        if (!isJsonDocument(document)) {
            vscode.window.showWarningMessage('The active file is not a JSON file.');
            return;
        }

        if (currentPanel) {
            currentPanel.reveal();
            currentPanel.update(document);
        } else {
            currentPanel = new JsonTreePanel(context, document);
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            });
        }
    });

    const copyValueCommand = vscode.commands.registerCommand('tlcsdm.jsonTreeView.copyValue', (value: string) => {
        if (value !== undefined && value !== null) {
            const unescaped = unescapeJsonString(String(value));
            vscode.env.clipboard.writeText(unescaped);
            vscode.window.showInformationMessage('Value copied to clipboard.');
        }
    });

    const config = vscode.workspace.getConfiguration('tlcsdm.jsonTreeView');
    if (config.get<boolean>('autoRefresh', true)) {
        const onSaveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
            if (currentPanel && isJsonDocument(document)) {
                currentPanel.update(document);
            }
        });
        context.subscriptions.push(onSaveDisposable);
    }

    const onChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('tlcsdm.jsonTreeView')) {
            if (currentPanel) {
                const editor = vscode.window.activeTextEditor;
                if (editor && isJsonDocument(editor.document)) {
                    currentPanel.update(editor.document);
                }
            }
        }
    });

    context.subscriptions.push(openCommand, copyValueCommand, onChangeDisposable);
}

function isJsonDocument(document: vscode.TextDocument): boolean {
    return ['json', 'jsonc', 'json5'].includes(document.languageId);
}

function unescapeJsonString(value: string): string {
    // If the value looks like a JSON-encoded string (starts and ends with quotes), parse it directly
    if (value.startsWith('"') && value.endsWith('"')) {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    // Process all escape sequences in a single pass to avoid double-unescaping
    const escapeMap: Record<string, string> = {
        '\\n': '\n',
        '\\t': '\t',
        '\\r': '\r',
        '\\\\': '\\',
        '\\"': '"',
    };
    return value.replace(/\\n|\\t|\\r|\\\\|\\"/g, (match) => escapeMap[match] ?? match);
}

export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
}
