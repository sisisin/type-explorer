import { Project, SourceFile, ts, Type, PropertySignature, Node } from 'ts-morph';
import * as path from 'path';
import { makeTree } from '../typescript/makeTree';

async function main() {
  const testProjectPath = path.resolve(__dirname, './unit/typescript/fixtures');
  const p = new Project({
    tsConfigFilePath: path.resolve(testProjectPath, 'tsconfig.json'),
  });
  const f = p.getSourceFile(path.resolve(testProjectPath, 'object-type.ts'))!;

  let pos: number;
  pos = 19;
  pos = 122; // c: AliasOfBoolean
  pos = 153;
  pos = 198; // baz: AliasOfString | string[];

  const tree = makeTree(f, pos);
  console.log(JSON.stringify(tree, null, '  '));
}

main();
