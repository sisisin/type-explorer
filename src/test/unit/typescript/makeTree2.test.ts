import * as ts from 'typescript';
import { makeTree } from '../../../typescript/makeTree2';
import { createProgram, getArgPart } from './helpers';
import { TreeNode } from '../../../types';

let p: ts.Program;

beforeAll(() => {
  p = createProgram('./fixtures');
});
describe('Unsupported Node', () => {
  it('should return undefined that node is unsupported', () => {
    const { f, pos } = getArgPart(p, 'unsupported.ts', 'Unsupported__Namespace');
    expect(makeTree(p, f, pos)).toBeUndefined();
  });
});

describe('primitive typed TypeAliasDeclaration', () => {
  function getPrimitiveTreeNode(targetType: string, childType: string) {
    return {
      id: expect.any(Number),
      typeName: targetType,
      variableName: undefined,
      children: [
        {
          id: expect.any(Number),
          typeName: childType,
          variableName: undefined,
        },
      ],
    };
  }
  const parameters = [
    { identifier: 'AliasOfBoolean', childType: 'boolean' },
    { identifier: 'AliasOfString', childType: 'string' },
    { identifier: 'AliasOfNumber', childType: 'number' },
    { identifier: 'AliasOfSymbol', childType: 'symbol' },
  ];

  parameters.forEach(({ identifier, childType }) => {
    it(`should make tree from ${childType}`, () => {
      const tree = getPrimitiveTreeNode(identifier, childType);
      const { f, pos } = getArgPart(p, 'aliased-primitives.ts', identifier);
      expect(makeTree(p, f, pos)).toMatchObject(tree);
    });
  });
});

describe('Literal Object typed TypeAliasDeclaration', () => {
  it(`should make tree from PropertySignature`, () => {
    const tree: TreeNode = {
      id: expect.any(Number),
      typeName: 'string',
      variableName: 'foo',
    };
    const { f, pos } = getArgPart(p, 'property-signature.ts', 'foo');
    expect(makeTree(p, f, pos)).toMatchObject(tree);
  });

  it('should make tree from TypeAlias', () => {
    const tree: TreeNode = {
      id: expect.any(Number),
      typeName: 'FooObject',
      variableName: undefined,
      children: [
        {
          id: expect.any(Number),
          typeName: 'string',
          variableName: 'foo',
        },
        {
          id: expect.any(Number),
          typeName: 'AliasOfSomething',
          variableName: 'bar',
          children: [
            {
              id: expect.any(Number),
              typeName: 'AliasOfSomething',
              variableName: undefined,
              children: [
                {
                  id: expect.any(Number),
                  typeName: 'symbol',
                  variableName: undefined,
                },
              ],
            },
          ],
        },
      ],
    };
    const { f, pos } = getArgPart(p, 'property-signature.ts', 'FooObject');
    expect(makeTree(p, f, pos)).toMatchObject(tree);
  });
});

describe('Union typed TypeAliasDeclaration', () => {
  it('should make tree', () => {
    const tree: TreeNode = {
      id: expect.any(Number),
      typeName: 'U',
      variableName: undefined,
      children: [
        {
          id: expect.any(Number),
          typeName: 'Alias',
          variableName: undefined,
          children: [
            {
              id: expect.any(Number),
              typeName: 'string',
              variableName: undefined,
            },
          ],
        },
        {
          id: expect.any(Number),
          typeName: 'number',
          variableName: undefined,
        },
      ],
    };
    const { f, pos } = getArgPart(p, 'union.ts', 'U');
    const actual = makeTree(p, f, pos);
    expect(actual).toMatchObject(tree);
  });
});
