import * as ts from 'typescript';
import { TreeNodeLike } from '../../../types';
import { makeTree } from '../../../typescript/makeTree';
import { createProgram, dropId, getArgPart } from './helpers';

let p: ts.Program;

beforeAll(() => {
  p = createProgram('./fixtures');
});

describe('VariableDeclaration', () => {
  describe('number declaration', () => {
    const tree: TreeNodeLike = {
      typeName: 'number',
      variableName: 'numberDeclaration',
    };
    it('should make tree from Number Declaration', () => {
      const { f, pos } = getArgPart(p, 'variable-declaration.ts', 'numberDeclaration');
      const actual = makeTree(p, f, pos);
      expect(dropId(actual)).toStrictEqual(tree);
    });
  });
  describe('object literal with TypeReference annotation', () => {
    const tree: TreeNodeLike = {
      typeName: 'FooObject',
      variableName: 'fooObject',
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
    it('should make tree from object literal with TypeReference', () => {
      const { f, pos } = getArgPart(p, 'variable-declaration.ts', 'fooObject');
      const actual = makeTree(p, f, pos);
      expect(dropId(actual)).toStrictEqual(tree);
    });
  });

  describe('from object literal', () => {
    const tree: TreeNodeLike = {
      typeName: 'Anonymous(Object Literal)',
      variableName: 'fooLike',
      children: [
        {
          typeName: 'string',
          variableName: 'foo',
        },
        {
          typeName: 'symbol',
          variableName: 'bar',
        },
      ],
    };
    it('should make tree from object literal', () => {
      const { f, pos } = getArgPart(p, 'variable-declaration.ts', 'fooLike');
      const actual = makeTree(p, f, pos);
      expect(dropId(actual)).toStrictEqual(tree);
    });
  });
  describe('call expression', () => {
    describe('returned primitive type', () => {
      const tree: TreeNodeLike = {
        typeName: 'string',
        variableName: 'called',
      };
      it('should make tree from call expression result', () => {
        const { f, pos } = getArgPart(p, 'variable-declaration.ts', 'called');
        const actual = makeTree(p, f, pos);
        expect(dropId(actual)).toStrictEqual(tree);
      });
    });
    describe('returned declared type', () => {
      const tree: TreeNodeLike = {
        typeName: 'FooObject',
        variableName: 'gotFooObject',
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
      it('should make tree from declared type', () => {
        const { f, pos } = getArgPart(p, 'variable-declaration.ts', 'gotFooObject');
        const actual = makeTree(p, f, pos);
        expect(dropId(actual)).toStrictEqual(tree);
      });
    });
  });
});
