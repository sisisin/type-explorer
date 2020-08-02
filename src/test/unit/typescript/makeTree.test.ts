import { makeTree } from '../../../typescript/makeTree';
import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as assert from 'assert';
import { TreeNode } from '../../../types';

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
  assert.deepStrictEqual(result, { label: 'foo', typeName: 'number | number[]' });
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
  assert.deepStrictEqual(result, expected);
});
