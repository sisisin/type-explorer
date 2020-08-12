import * as ts from 'typescript';
import { TreeNode } from '../types';
import {
  getDescendantAtPos,
  isPrimitiveKeyword,
  findDeclarationNodes,
  findDeclarationNode,
  isSyntaxList,
} from './utils';
import { isNonNullable, assert, getIdGenerator } from '../utils';

export function makeTree(program: ts.Program, src: ts.SourceFile, pos: number) {
  const checker = program.getTypeChecker();
  const node = getDescendantAtPos(src, pos);
  if (node === undefined) {
    console.log(`cannot find Node that pos is ${pos}`);
    return;
  }
  const treeNodeStartingPoint = findTreeNodeStartingPoint(node);
  if (treeNodeStartingPoint === undefined) {
    console.log(`Invalid Node: '${node.getText()}' kind: '${ts.SyntaxKind[node.kind]}'`);
    return;
  }

  return from({ checker, genId: getIdGenerator() }, treeNodeStartingPoint);

  type TreeNodeStartingPoint = ts.PropertySignature | ts.TypeAliasDeclaration;
  function isTreeNodeStartingPoint(node: ts.Node): node is TreeNodeStartingPoint {
    return (
      ts.isPropertySignature(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node)
    );
  }
  function findTreeNodeStartingPoint(node: ts.Node): TreeNodeStartingPoint | undefined {
    if (ts.isSourceFile(node)) return undefined;
    else if (isTreeNodeStartingPoint(node)) return node;

    return findTreeNodeStartingPoint(node.parent);
  }
}

export interface Context {
  genId: () => number;
  checker: ts.TypeChecker;
}

function from(ctx: Context, node: ts.Node): TreeNode | undefined {
  const { genId } = ctx;
  if (ts.isTypeAliasDeclaration(node)) {
    const declarationBody = findDeclarationNode(node);

    return {
      id: genId(),
      typeName: node.name.getText(),
      variableName: undefined,
      ...makeChildren(ctx, declarationBody),
    };
  } else if (isPrimitiveKeyword(node)) {
    return {
      id: genId(),
      typeName: node.getText(),
      variableName: undefined,
    };
  } else if (ts.isPropertySignature(node)) {
    const declarationBody = findDeclarationNode(node);
    return {
      id: genId(),
      typeName: node.type?.getText() ?? assert('TypeNode must not be undefined'),
      variableName: node.name.getText(),
      ...makeChildren(ctx, declarationBody),
    };
  } else if (ts.isTypeReferenceNode(node)) {
    return fromTypeReferenceNode(ctx, node);
  } else if (ts.isArrayTypeNode(node)) {
    const declarationBody = findDeclarationNode(node);
    const { genId } = ctx;
    return {
      id: genId(),
      typeName: node.getText(),
      variableName: undefined,
      ...makeChildren(ctx, declarationBody),
    };
  } else if (ts.isInterfaceDeclaration(node)) {
    const syntaxList = node.getChildren().find(isSyntaxList);
    if (syntaxList === undefined) throw new Error(`${node.name.getText()} has not SyntaxList`);
    const children = findDeclarationNodes(syntaxList)
      .map((body) => from(ctx, body))
      .filter(isNonNullable);
    const childrenObj: Pick<TreeNode, 'children'> = {
      children: children.length > 0 ? children : undefined,
    };
    return {
      id: genId(),
      typeName: node.name.getText(),
      variableName: undefined,
      ...childrenObj,
    };
  }

  return undefined;
}

function fromTypeReferenceNode(ctx: Context, node: ts.TypeReferenceNode) {
  // todo: improve get node
  const { checker } = ctx;
  const identifier = node.getChildren()[0];
  const symbol = checker.getSymbolAtLocation(identifier);
  const declNode = symbol?.getDeclarations()?.[0];
  if (declNode === undefined) return undefined;
  return from(ctx, declNode);
}

function makeChildren(ctx: Context, node: ts.Node | undefined): Pick<TreeNode, 'children'> {
  const children = makeChildrenList(ctx, node);
  return children.length > 0 ? { children } : {};
}

function makeChildrenList(ctx: Context, node: ts.Node | undefined): TreeNode[] {
  if (node === undefined) return [];
  if (isPrimitiveKeyword(node)) {
    return [from(ctx, node)].filter(isNonNullable);
  } else if (ts.isTypeLiteralNode(node)) {
    return node.members.map((m) => from(ctx, m)).filter(isNonNullable);
  } else if (ts.isTypeReferenceNode(node)) {
    return [from(ctx, node)].filter(isNonNullable);
  } else if (ts.isUnionTypeNode(node)) {
    const syntaxList = node.getChildren()[0];
    if (isSyntaxList(syntaxList)) {
      return findDeclarationNodes(syntaxList)
        .map((body) => from(ctx, body))
        .filter(isNonNullable);
    }
  } else if (ts.isArrayTypeNode(node)) {
    return [from(ctx, node)].filter(isNonNullable);
  } else if (isSyntaxList(node)) {
    return findDeclarationNodes(node)
      .map((body) => from(ctx, body))
      .filter(isNonNullable);
  }
  return [];
}
