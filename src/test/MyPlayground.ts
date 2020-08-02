import { Project, SourceFile, ts, Type, PropertySignature, Node } from 'ts-morph';
import * as path from 'path';
import { makeTree } from '../typescript/makeTree';

const p = new Project({
  tsConfigFilePath: path.resolve(__dirname, '../../sample-project/tsconfig.json'),
});

const targetFile = path.resolve(__dirname, '../../sample-project/types.ts');
const f = p.getSourceFile(targetFile);
// printTargeType(f!, 55); // baz
// printTargeType(f!, 134); // bar
// printTargeType(f!, 55);

async function main() {
  const testProjectPath = path.resolve(__dirname, './unit/typescript/fixtures');
  const p = new Project({
    tsConfigFilePath: path.resolve(testProjectPath, 'tsconfig.json'),
  });
  const f = p.getSourceFile(path.resolve(testProjectPath, 'object-type.ts'))!;
  const tree = makeTree(f, 27);
  console.log(tree);
}

main();
