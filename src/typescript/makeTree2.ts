import * as ts from 'typescript';
import { TreeNode } from '../types';
import { getDescendantAtPos } from './util';
import { isNonNullable } from '../utils';

function getIdGenerator() {
  let id = 0;
  return () => ++id;
}

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

  return makeTypeTree({ checker, genId: getIdGenerator() }, treeNodeStartingPoint);
}

export interface Context {
  genId: () => number;
  checker: ts.TypeChecker;
}

function makeTypeTree(ctx: Context, node: ts.Node): TreeNode | undefined {
  if (ts.isTypeAliasDeclaration(node)) {
    return fromTypeAliasDeclaration(ctx, node);
  } else if (isPrimitiveKeyword(node)) {
    return fromPrimitiveType(ctx, node);
  } else if (ts.isPropertySignature(node)) {
    return fromPropertySignature(ctx, node);
  } else if (ts.isTypeReferenceNode(node)) {
    return fromTypeReferenceNode(ctx, node);
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
  return makeTypeTree(ctx, declNode);
}
function fromPropertySignature(ctx: Context, node: ts.PropertySignature) {
  const { genId } = ctx;
  const typeName = node.type?.getText() ?? assert('TypeNode must not be undefined');

  return withChildren(ctx, node, { id: genId(), typeName, variableName: node.name.getText() });
}

function assert(msg: string): string {
  throw new Error(msg);
}

function fromTypeAliasDeclaration(ctx: Context, node: ts.TypeAliasDeclaration) {
  const { genId } = ctx;

  return withChildren(ctx, node, {
    id: genId(),
    typeName: node.name.getText(), // type Some = ... <- `Some` can access `node.name`
    variableName: undefined,
  });
}
function fromPrimitiveType(ctx: Context, node: ts.Node) {
  const { genId } = ctx;
  return {
    id: genId(),
    typeName: node.getText(),
    variableName: undefined,
  };
}

function withChildren(
  ctx: Context,
  node: ChildrenNode,
  base: Omit<TreeNode, 'children'>,
): TreeNode {
  const children = makeChildren(ctx, node);

  if (children.length > 0) {
    return {
      ...base,
      children,
    };
  } else {
    return base;
  }
}
type ChildrenNode = ts.TypeAliasDeclaration | ts.PropertySignature;
function makeChildren(ctx: Context, node: ChildrenNode): TreeNode[] {
  const declarationBody = findDeclarationBody(node);
  if (declarationBody === undefined) return [];
  if (isPrimitiveKeyword(declarationBody)) {
    return [makeTypeTree(ctx, declarationBody)].filter(isNonNullable);
  } else if (ts.isTypeLiteralNode(declarationBody)) {
    return declarationBody.members.map((m) => makeTypeTree(ctx, m)).filter(isNonNullable);
  } else if (ts.isTypeReferenceNode(declarationBody)) {
    return [makeTypeTree(ctx, declarationBody)].filter(isNonNullable);
  } else if (ts.isUnionTypeNode(declarationBody)) {
    const syntaxList = declarationBody.getChildren()[0];

    return findDeclarationNodes(syntaxList)
      .map((body) => makeTypeTree(ctx, body))
      .filter(isNonNullable);
  }
  return [];
}

function isPrimitiveKeyword(node: ts.Node) {
  switch (node.kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.SymbolKeyword:
      return true;

    default:
      return false;
  }
}

function isTreeNodeStartingPoint(node: ts.Node): node is TreeNodeStartingPoint {
  return ts.isPropertySignature(node) || ts.isTypeAliasDeclaration(node);
}
type TreeNodeStartingPoint = ts.PropertySignature | ts.TypeAliasDeclaration;

function findTreeNodeStartingPoint(node: ts.Node): TreeNodeStartingPoint | undefined {
  if (ts.isSourceFile(node)) return undefined;
  else if (isTreeNodeStartingPoint(node)) return node;

  return findTreeNodeStartingPoint(node.parent);
}

function findDeclarationBody(node: ts.Node): ts.Node | undefined {
  return node.getChildren().find((child) => {
    return (
      isPrimitiveKeyword(child) ||
      ts.isTypeLiteralNode(child) ||
      ts.isTypeReferenceNode(child) ||
      ts.isUnionTypeNode(child)
    );
  });
}

function findDeclarationNodes(node: ts.Node): ts.Node[] {
  return node.getChildren().filter((child) => {
    return (
      isPrimitiveKeyword(child) ||
      ts.isTypeLiteralNode(child) ||
      ts.isTypeReferenceNode(child) ||
      ts.isUnionTypeNode(child)
    );
  });
}
