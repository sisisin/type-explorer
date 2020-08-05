import { Project } from 'ts-morph';
import * as vscode from 'vscode';
import { getPos } from '../file-utils/getPos';
import { makeTree } from '../typescript/makeTree';
import { TypeExplorerProvider } from '../vscode/TypeExplorerProvider';

export async function provideTree(
  context: vscode.ExtensionContext,
  editor: vscode.TextEditor,
  projects: {
    workspaceFolder: string;
    project: Project;
  }[],
) {
  const targetFile = editor.document.uri.fsPath;

  const p = projects.find(({ workspaceFolder }) => targetFile.startsWith(workspaceFolder))?.project;
  if (p === undefined) return;
  const f = p.getSourceFile(targetFile)!;
  const pos = await getPos(targetFile, editor.selection.active);

  const typeTree = makeTree(f, pos);
  if (typeTree === undefined) return;
  const provider = new TypeExplorerProvider(typeTree);
  const treeDataDisposable = vscode.window.registerTreeDataProvider('typeExplorer', provider);
  context.subscriptions.push(treeDataDisposable);
  const treeViewDisposable = vscode.window.createTreeView('typeExplorerView', {
    treeDataProvider: provider,
  });
  context.subscriptions.push(treeViewDisposable);
}
