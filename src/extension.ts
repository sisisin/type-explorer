import * as vscode from 'vscode';
import { provideTree } from './vscode/provideTree';

export function activate(context: vscode.ExtensionContext) {
  const provideTreeSubs = vscode.window.onDidChangeTextEditorSelection((e) => {
    if (e.textEditor.selection.isEmpty) {
      provideTree(context, e.textEditor);
    }
  });
  context.subscriptions.push(provideTreeSubs);
}

export function deactivate() {}
