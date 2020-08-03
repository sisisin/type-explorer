import * as path from 'path';
import { Project, SourceFile } from 'ts-morph';
import { makeTree } from '../../../typescript/makeTree';

let p: Project;
let f: SourceFile;

beforeEach(() => {
  p = new Project({
    tsConfigFilePath: path.resolve(__dirname, './fixtures/tsconfig.json'),
  });
  f = p.getSourceFile(path.resolve(__dirname, './fixtures/object-type.ts'))!;
});
it('should make tree from TypeAliasDeclaration', () => {
  const result = makeTree(f, 13); // FooObject
  expect(result).toMatchSnapshot();
});

it('should make tree from PropertySignature', () => {
  const result = makeTree(f, 52);
  expect(result).toMatchSnapshot();
});
