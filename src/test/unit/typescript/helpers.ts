import * as path from 'path';
import * as ts from 'typescript';
import { TreeNode, TreeNodeLike } from '../../../types';

export const fixtureProject = path.resolve(__dirname, 'fixtures');

export function getArgPart(
  p: ts.Program,
  target: string,
  identifier: string,
): { f: ts.SourceFile; pos: number } {
  const targetPath = path.resolve(fixtureProject, target);
  const f = p.getSourceFile(targetPath);
  if (f === undefined) throw new Error(`cannot find SourceFile: ${targetPath}`);
  return {
    f,
    pos: f.getText().indexOf(identifier),
  };
}

export function dropId(target: TreeNode | undefined): TreeNodeLike | undefined {
  if (target === undefined) return undefined;
  return drop(target);

  function drop(t: TreeNode): TreeNodeLike | undefined {
    if (t.id === undefined) {
      throw new Error(
        `Invalid TreeNode. TreeNode must have 'id' property. typeName: ${t.typeName}`,
      );
    }
    delete t.id;
    if (t.children) t.children.forEach((child) => drop(child));
    return t;
  }
}

export function createConfigFileHost(): ts.ParseConfigFileHost {
  return {
    useCaseSensitiveFileNames: true,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    onUnRecoverableConfigFileDiagnostic(diagnostic: ts.Diagnostic) {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  };
}

export function createProgram(searchPath: string, configName = 'tsconfig.json'): ts.Program {
  const configPath = ts.findConfigFile(searchPath, ts.sys.fileExists, configName);
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    createConfigFileHost(),
  );
  if (!parsedCommandLine) {
    throw new Error('invalid parsedCommandLine.');
  }
  if (parsedCommandLine.errors.length) {
    throw new Error('parsedCommandLine has errors.');
  }
  return ts.createProgram({
    rootNames: parsedCommandLine.fileNames,
    options: parsedCommandLine.options,
  });
}
