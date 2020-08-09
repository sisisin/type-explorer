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

interface Context {
  genId: () => number;
  checker: ts.TypeChecker;
}
function makeTypeTree(ctx: Context, node: ts.Node): TreeNode | undefined {
  const { checker, genId } = ctx;

  if (ts.isTypeAliasDeclaration(node)) {
    const base = {
      id: genId(),
      typeName: node.name.getText(), // type Some = ... <- `Some` can access `node.name`
      variableName: undefined,
    };
    const declarationBody = findDeclarationBody(node);
    if (declarationBody) {
      return {
        ...base,
        children: [makeTypeTree(ctx, declarationBody)].filter(isNonNullable),
      };
    } else {
      return base;
    }
  } else if (isPrimitiveKeyword(node)) {
    return {
      id: genId(),
      typeName: node.getText(),
      variableName: undefined,
    };
  }
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
    return isPrimitiveKeyword(child);
  });
}
