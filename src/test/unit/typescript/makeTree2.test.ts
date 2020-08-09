import * as ts from 'typescript';
import { makeTree } from '../../../typescript/makeTree2';
import { createProgram, getArgPart } from './helpers';

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
