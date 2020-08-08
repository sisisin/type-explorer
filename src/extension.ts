import * as fs from 'fs';
import * as path from 'path';
import { Project } from 'ts-morph';
import * as vscode from 'vscode';
import { isNonNullable } from './utils';
import { TypeExplorerProvider } from './vscode/TypeExplorerProvider';
import { updateTreeView } from './vscode/updateTreeView';

interface AppProject {
  workspaceFolder: string;
  project: Project;
}
function getProjects(editor: vscode.TextEditor | undefined) {
  // Sort by path desc for tsconfig detection
  const wf = [...(vscode.workspace.workspaceFolders ?? [])].sort((a, b) => {
    if (a.uri > b.uri) return -1;
    if (a.uri < b.uri) return 1;
    return 0;
  });
  const firstTargetPath = editor?.selection.isEmpty ? editor.document.uri.fsPath : undefined;
  const firstTarget = wf.find((folder) => firstTargetPath?.startsWith(folder.uri.fsPath));

  return [
    getFactory(firstTarget)?.(),
    wf.map(getFactory).filter(isNonNullable).map(toPromise),
  ] as const;

  function getFactory(f: vscode.WorkspaceFolder | undefined) {
    if (f === undefined) return undefined;
    const tsConfigFilePath = path.resolve(f.uri.fsPath, 'tsconfig.json');
    try {
      fs.readFileSync(tsConfigFilePath);
    } catch {
      return undefined;
    }
    return () => ({
      workspaceFolder: f.uri.fsPath,
      project: new Project({ tsConfigFilePath }),
    });
  }
  function toPromise<T extends unknown>(f: () => T): Promise<T> {
    return new Promise((done) => setTimeout(() => done(f()), 0));
  }
}
function setProjects(projects: AppProject[]) {
  const [p, rest] = getProjects(vscode.window.activeTextEditor);
  if (p) projects.push(p);
  Promise.all(rest).then((ps) => ps.forEach((p) => projects.push(p)));
}
function refreshProjects(projects: AppProject[]) {
  while (projects.length > 0) projects.pop();
  setProjects(projects);
}
export function activate(context: vscode.ExtensionContext) {
  const projects: AppProject[] = [];
  setProjects(projects);

  const typeExplorerProvider = new TypeExplorerProvider(undefined);

  const d1 = vscode.workspace.onDidChangeConfiguration((e) => {
    setProjects(projects);
  });
  const d2 = vscode.workspace.onDidChangeWorkspaceFolders((e) => {
    setProjects(projects);
  });
  const d3 = vscode.window.onDidChangeTextEditorSelection((e) => {
    updateTreeView(e.textEditor, typeExplorerProvider, projects);
  });
  const d4 = vscode.window.registerTreeDataProvider('typeExplorer', typeExplorerProvider);
  const d5 = vscode.window.createTreeView('typeExplorerView', {
    treeDataProvider: typeExplorerProvider,
  });
  const d6 = vscode.commands.registerCommand('typeExplorerView.refreshTypeScriptProject', () => {
    typeExplorerProvider.refresh(undefined);
    refreshProjects(projects);
    updateTreeView(vscode.window.activeTextEditor, typeExplorerProvider, projects);
  });

  [d1, d2, d3, d4, d5, d6].forEach((d) => context.subscriptions.push(d));

  updateTreeView(vscode.window.activeTextEditor, typeExplorerProvider, projects);
}

export function deactivate() {}
