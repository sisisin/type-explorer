import * as path from 'path';
import { Project } from 'ts-morph';
import { makeTree } from '../typescript/makeTree';

async function main() {
  const testProjectPath = path.resolve(__dirname, './unit/typescript/fixtures');
  const p = new Project({
    tsConfigFilePath: path.resolve(testProjectPath, 'tsconfig.json'),
  });
  const program = p.getProgram().compilerObject;
  const f = program.getSourceFile(path.resolve(testProjectPath, 'object-type.ts'))!;

  let pos: number;
  pos = 19;
  pos = 122; // c: AliasOfBoolean
  pos = 153;
  pos = 198; // baz: AliasOfString | string[];
  pos = 271; // interface I
  const tree = makeTree(program, f, pos);
  console.log(JSON.stringify(tree, null, '  '));
}

main();
