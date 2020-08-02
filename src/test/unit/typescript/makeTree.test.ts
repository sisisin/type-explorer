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
  expect(result).toStrictEqual({ label: 'foo', typeName: 'number | number[]' });
});

it('should make nested tree', () => {
  const result = makeTree(f, 52);
  const expected: TreeNode = {
    label: 'bar',
    typeName: 'BarObject',
    children: [
      { label: 'a', typeName: 'number' },
      { label: 'b', typeName: 'string' },
      {
        label: 'c',
        typeName: 'AliasOfBoolean',
        children: [{ label: 'boolean', typeName: 'boolean' }],
      },
    ],
  };
  expect(result).toStrictEqual(expected);
});
