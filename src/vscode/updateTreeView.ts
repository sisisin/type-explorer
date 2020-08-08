import { Project } from 'ts-morph';
import * as vscode from 'vscode';
import { getPos } from '../file-utils/getPos';
import { makeTree } from '../typescript/makeTree';
import { TypeExplorerProvider } from './TypeExplorerProvider';

export async function updateTreeView(
  editor: vscode.TextEditor | undefined,
  provider: TypeExplorerProvider,
  projects: {
    workspaceFolder: string;
    project: Project;
  }[],
) {
  if (editor === undefined || !editor.selection.isEmpty) {
    return;
  }
  const targetFile = editor.document.uri.fsPath;

  const p = projects.find(({ workspaceFolder }) => targetFile.startsWith(workspaceFolder))?.project;
  if (p === undefined) return;
  const f = p.getSourceFile(targetFile)!;
  const pos = await getPos(targetFile, editor.selection.active);

  provider.refresh(makeTree(f, pos));
}
