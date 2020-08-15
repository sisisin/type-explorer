import * as ts from 'typescript';
import { TreeNodeLike } from '../../../types';
import { makeTree } from '../../../typescript/makeTree';
import { createProgram, dropId, getArgPart } from './helpers';

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
      typeName: targetType,
      variableName: undefined,
      children: [
        {
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
    { identifier: 'AliasOfNull', childType: 'null' },
    { identifier: 'AliasOfUndefined', childType: 'undefined' },
    { identifier: 'AliasOfAny', childType: 'any' },
    { identifier: 'AliasOfUnknown', childType: 'unknown' },
    { identifier: 'AliasOfBigInt', childType: 'bigint' },
    { identifier: 'AliasOfObject', childType: 'object' },
    { identifier: 'AliasOfVoid', childType: 'void' },
    { identifier: 'AliasOfNever', childType: 'never' },
    { identifier: 'AliasOfStringLiteral', childType: "'a_string_literal'" },
  ];

  parameters.forEach(({ identifier, childType }) => {
    it(`should make tree from ${childType}`, () => {
      const tree = getPrimitiveTreeNode(identifier, childType);
      const { f, pos } = getArgPart(p, 'aliased-primitives.ts', identifier);
      const actual = makeTree(p, f, pos);
      expect(dropId(actual)).toStrictEqual(tree);
    });
  });
  it('should make tree from exported type', () => {
    const tree = getPrimitiveTreeNode('ExportedType', 'unknown');
    const { f, pos } = getArgPart(p, 'exported-type.ts', 'ExportedType');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
});

describe('Literal Object typed TypeAliasDeclaration', () => {
  it(`should make tree from PropertySignature`, () => {
    const tree: TreeNodeLike = {
      typeName: 'string',
      variableName: 'foo',
      children: [
        {
          typeName: 'string',
          variableName: undefined,
        },
      ],
    };
    const { f, pos } = getArgPart(p, 'property-signature.ts', 'foo');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });

  it('should make tree from TypeAlias', () => {
    const tree: TreeNodeLike = {
      typeName: 'FooObject',
      variableName: undefined,
      children: [
        {
          typeName: 'string',
          variableName: 'foo',
          children: [
            {
              typeName: 'string',
              variableName: undefined,
            },
          ],
        },
        {
          typeName: 'AliasOfSomething',
          variableName: 'bar',
          children: [
            {
              typeName: 'AliasOfSomething',
              variableName: undefined,
              children: [
                {
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
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
});

describe('Union typed TypeAliasDeclaration', () => {
  it('should make tree which has Union Attributes', () => {
    const tree: TreeNodeLike = {
      typeName: 'U',
      variableName: undefined,
      children: [
        {
          typeName: 'Alias',
          variableName: undefined,
          children: [
            {
              typeName: 'string',
              variableName: undefined,
            },
          ],
        },
        {
          typeName: 'number',
          variableName: undefined,
        },
      ],
    };
    const { f, pos } = getArgPart(p, 'union.ts', 'U');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
});
describe('Array typed TypeAliasDeclaration', () => {
  it('should make tree which has Array type', () => {
    const tree: TreeNodeLike = {
      typeName: 'AliasOfArray',
      variableName: undefined,
      children: [
        {
          typeName: 'AliasOfBoolean[]',
          variableName: undefined,
          children: [
            {
              typeName: 'AliasOfBoolean',
              variableName: undefined,
              children: [{ typeName: 'boolean', variableName: undefined }],
            },
          ],
        },
      ],
    };
    const { f, pos } = getArgPart(p, 'aliased-array.ts', 'AliasOfArray');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
});

describe('InterfaceDeclaration', () => {
  const tree: TreeNodeLike = {
    typeName: 'FooInterface',
    variableName: undefined,
    children: [
      {
        typeName: 'string',
        variableName: 'foo',
        children: [
          {
            typeName: 'string',
            variableName: undefined,
          },
        ],
      },
    ],
  };
  it('should make tree from basic interface', () => {
    const { f, pos } = getArgPart(p, 'interface.ts', 'FooInterface');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
});

describe('FunctionDeclaration', () => {
  it('should make tree with explicitly return type', () => {
    const tree: TreeNodeLike = {
      variableName: 'something',
      typeName: 'string',
    };
    const { f, pos } = getArgPart(p, 'function.ts', 'something');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
  it('should make tree with implicitly return type', () => {
    pending(
      "unsupported inferred return type because I can't understand to get return type from node",
    );
    const tree: TreeNodeLike = {
      variableName: 'somethingInferred',
      typeName: 'boolean',
    };
    const { f, pos } = getArgPart(p, 'function.ts', 'somethingInferred');
    const actual = makeTree(p, f, pos);
    expect(dropId(actual)).toStrictEqual(tree);
  });
});
