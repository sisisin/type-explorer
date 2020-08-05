import { Project } from 'ts-morph';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { provideTree } from './vscode/provideTree';
import { isNonNullable } from './utils';

function getProjects() {
  return (vscode.workspace.workspaceFolders ?? [])
    .map((f) => {
      const tsConfigFilePath = path.resolve(f.uri.fsPath, 'tsconfig.json');
      try {
        fs.readFileSync(tsConfigFilePath);
      } catch {
        return undefined;
      }
      return {
        workspaceFolder: f.uri.fsPath,
        project: new Project({ tsConfigFilePath }),
      };
    })
    .filter(isNonNullable);
}
export function activate(context: vscode.ExtensionContext) {
  let projects: {
    workspaceFolder: string;
    project: Project;
  }[] = getProjects();

  const d1 = vscode.workspace.onDidChangeConfiguration((e) => {
    projects = getProjects();
  });
  const d2 = vscode.workspace.onDidChangeWorkspaceFolders((e) => {
    projects = getProjects();
  });
  const d3 = vscode.window.onDidChangeTextEditorSelection((e) => {
    if (e.textEditor.selection.isEmpty) {
      provideTree(context, e.textEditor, projects);
    }
  });
  [d1, d2, d3].forEach((d) => context.subscriptions.push(d));
}

export function deactivate() {}
