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

  const project = projects.find(({ workspaceFolder }) => targetFile.startsWith(workspaceFolder))
    ?.project;
  if (project === undefined) return;
  const p = project.getProgram().compilerObject;
  const f = p.getSourceFile(targetFile)!;
  const pos = await getPos(targetFile, editor.selection.active);

  provider.refresh(makeTree(p, f, pos));
}
