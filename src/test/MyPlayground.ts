import * as path from 'path';
import { Project } from 'ts-morph';
import { makeTree } from '../typescript/makeTree';
import { getDescendantAtPos } from '../typescript/util';
import * as ts from 'typescript';

const testProjectPath = path.resolve(__dirname, './unit/typescript/fixtures');
let filePath: string;
let pos: number;
setup();

async function main() {
  const p = new Project({ tsConfigFilePath: path.resolve(testProjectPath, 'tsconfig.json') });
  v(p);
}

main();

function v(p: Project) {
  const mf = p.getSourceFile(filePath);
  const mn = mf?.getDescendantAtPos(pos);
  console.log(mn?.getText());
  const mt = mn?.getType()!;

  const program = p.getProgram().compilerObject;
  const checker = program.getTypeChecker();
  const tf = program.getSourceFile(filePath)!;
  const node = findTreeNodeStartingPoint(getDescendantAtPos(tf, pos)!)!;
  const tt = checker.getTypeAtLocation(node);
  const decls = tt.getProperties()[0].getDeclarations()?.[0]!;
  checker.typeToString(checker.getTypeAtLocation(decls));

  const tr = makeTree(program, tf, pos);
  console.log(tr);
}

function setup() {
  filePath = path.resolve(testProjectPath, 'variable-declaration.ts');
  pos = 19;
  pos = 122; // c: AliasOfBoolean
  pos = 153;
  pos = 198; // baz: AliasOfString | string[];
  pos = 271; // interface I

  filePath = path.resolve(testProjectPath, 'variable-declaration.ts');
  pos = 98;
}

function isTreeNodeStartingPoint(node: ts.Node) {
  return ts.isIdentifier(node);
}
function findTreeNodeStartingPoint(node: ts.Node): ts.Node | undefined {
  if (ts.isSourceFile(node)) return undefined;
  else if (isTreeNodeStartingPoint(node)) return node;

  return findTreeNodeStartingPoint(node.parent);
}
