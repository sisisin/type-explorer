import { Project } from 'ts-morph';
import * as vscode from 'vscode';
import { findTsconfigFile } from '../file-utils/findTsconfigFile';
import { getPos } from '../file-utils/getPos';
import { makeTree } from '../typescript/makeTree';
import { TypeExplorerProvider } from '../vscode/TypeExplorerProvider';

export async function provideTree(context: vscode.ExtensionContext, editor: vscode.TextEditor) {
  const targetFile = editor.document.uri.fsPath;
  const p = new Project({
    tsConfigFilePath: await findTsconfigFile(targetFile),
  });
  const f = p.getSourceFile(targetFile)!;
  const pos = await getPos(targetFile, editor.selection.active);

  const typeTree = makeTree(f, pos);
  const provider = new TypeExplorerProvider(typeTree!);
  const treeDataDisposable = vscode.window.registerTreeDataProvider('typeExplorer', provider);
  context.subscriptions.push(treeDataDisposable);
  const treeViewDisposable = vscode.window.createTreeView('typeExplorerView', {
    treeDataProvider: provider,
  });
  context.subscriptions.push(treeViewDisposable);
}
