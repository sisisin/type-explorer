import { Project, SourceFile, ts, Type, PropertySignature, Node } from 'ts-morph';
import * as path from 'path';
import { makeTree } from '../typescript/makeTree';

async function main() {
  const testProjectPath = path.resolve(__dirname, './unit/typescript/fixtures');
  const p = new Project({
    tsConfigFilePath: path.resolve(testProjectPath, 'tsconfig.json'),
  });
  const f = p.getSourceFile(path.resolve(testProjectPath, 'object-type.ts'))!;
  const tree = makeTree(f, 16);
  console.log(JSON.stringify(tree, null, '  '));
}

main();
