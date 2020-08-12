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

  return from(
    { checker, genId: getIdGenerator(), root: treeNodeStartingPoint },
    treeNodeStartingPoint,
  );

  function isTreeNodeStartingPoint(node: ts.Node) {
    return (
      ts.isPropertySignature(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isVariableDeclaration(node) // note: it is unsupported `VariableDeclarationList`
    );
  }
  function findTreeNodeStartingPoint(node: ts.Node): ts.Node | undefined {
    if (ts.isSourceFile(node)) return undefined;
    else if (isTreeNodeStartingPoint(node)) return node;

    return findTreeNodeStartingPoint(node.parent);
  }
}

export interface Context {
  genId: () => number;
  checker: ts.TypeChecker;
  root: ts.Node;
}

function from(ctx: Context, node: ts.Node): TreeNode | undefined {
  const { genId, checker, root } = ctx;

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
  } else if (ts.isVariableDeclaration(node)) {
    return fromVariableDeclaration(ctx, node);
  } else if (ts.isTypeLiteralNode(node)) {
    return {
      id: genId(),
      typeName: 'Anonymous(Object Literal)',
      variableName: (root as ts.VariableDeclaration).name.getText(),
      ...makeChildren(ctx, node),
    };
  } else if (ts.isPropertyAssignment(node)) {
    return {
      id: genId(),
      typeName: checker.typeToString(checker.getTypeAtLocation(node)),
      variableName: node.name.getText(),
    };
  }

  return undefined;
}

function fromVariableDeclaration(ctx: Context, node: ts.VariableDeclaration) {
  const { genId, checker } = ctx;
  const type = checker.getTypeAtLocation(node);

  // case of `const foo: Foo = ...`
  if (node.type) {
    return {
      id: genId(),
      typeName: node.type.getText(),
      variableName: node.name.getText(),
      ...makeChildren(ctx, type.aliasSymbol?.getDeclarations()?.[0] as ChildrenNode),
    };
  }

  const nodeFromType = checker.typeToTypeNode(type);
  if (nodeFromType === undefined) return undefined;

  // case of `let x = 1; // => inferred a number type`
  if (isPrimitiveKeyword(nodeFromType)) {
    return {
      id: genId(),
      typeName: checker.typeToString(type),
      variableName: node.name.getText(),
    };
  }

  // case of `const obj = {...}`. Right side expression is TypeLiteral node.
  if (ts.isTypeLiteralNode(nodeFromType)) {
    const objliteral = node.getChildren().find((n) => ts.isObjectLiteralExpression(n))!;
    const syntaxList = objliteral.getChildren().find((n) => isSyntaxList(n))!;
    const propertyAssignments = syntaxList.getChildren().filter(ts.isPropertyAssignment);
    console.log(checker.typeToString(checker.getTypeAtLocation(propertyAssignments[0])));

    const childrenObj: Pick<TreeNode, 'children'> = {
      children: propertyAssignments.map((p) => from(ctx, p)).filter(isNonNullable),
    };
    return {
      id: genId(),
      typeName: 'Anonymous(Object Literal)',
      variableName: node.name.getText(),
      ...childrenObj,
    };
  }
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
  if (ts.isTypeLiteralNode(node)) {
    return node.members.map((m) => from(ctx, m)).filter(isNonNullable);
  }
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
