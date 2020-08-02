import * as path from 'path';
import { Project, SourceFile } from 'ts-morph';
import { TreeNode } from '../../../types';
import { makeTree } from '../../../typescript/makeTree';

let p: Project;
let f: SourceFile;

beforeEach(() => {
  p = new Project({
    tsConfigFilePath: path.resolve(__dirname, './fixtures/tsconfig.json'),
  });
  f = p.getSourceFile(path.resolve(__dirname, './fixtures/object-type.ts'))!;
});
it('should make tree', () => {
  const result = makeTree(f, 27);
  expect(result).toMatchObject({ variableName: 'foo', typeName: 'number | number[]' });
});

it('should make nested tree', () => {
  const result = makeTree(f, 52);
  const expected = {
    variableName: 'bar',
    typeName: 'BarObject',
    children: [
      { variableName: 'a', typeName: 'number' },
      { variableName: 'b', typeName: 'string' },
      {
        variableName: 'c',
        typeName: 'AliasOfBoolean',
        children: [{ variableName: 'boolean', typeName: 'boolean' }],
      },
    ],
  };
  expect(result).toMatchObject(expected);
});
