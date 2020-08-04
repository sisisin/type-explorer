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
  expect(makeTree(f, 13)).toMatchSnapshot();
});

it('should make tree from PropertySignature', () => {
  expect(makeTree(f, 52)).toMatchSnapshot();
});

it('should make tree from Alias to primitive Type', () => {
  expect(makeTree(f, 164)).toMatchSnapshot();
});

it('should make tree from PropertySignature which references primitive Alias', () => {
  expect(makeTree(f, 122)).toMatchSnapshot();
});
