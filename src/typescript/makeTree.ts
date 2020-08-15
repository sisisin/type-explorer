import * as ts from 'typescript';
import { TreeNode } from '../types';
import { assert, getIdGenerator, isNonNullable, getOrThrow } from '../utils';
import { getDescendantAtPos, isPrimitiveKeyword } from './utils';

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
      ts.isPropertyAssignment(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isVariableDeclaration(node) || // note: it is unsupported `VariableDeclarationList`
      ts.isFunctionDeclaration(node)
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
  const { genId, checker } = ctx;

  if (ts.isTypeAliasDeclaration(node)) {
    return {
      id: genId(),
      typeName: getOrThrow(ts.getNameOfDeclaration(node)?.getText()),
      variableName: undefined,
      ...makeChildren(ctx, node.type),
    };
  } else if (isPrimitiveKeyword(node)) {
    return {
      id: genId(),
      typeName: node.getText(),
      variableName: undefined,
    };
  } else if (ts.isPropertySignature(node)) {
    return {
      id: genId(),
      typeName: node.type?.getText() ?? assert('TypeNode must not be undefined'),
      variableName: ts.getNameOfDeclaration(node)?.getText(),
      ...makeChildren(ctx, node.type),
    };
  } else if (ts.isTypeReferenceNode(node)) {
    return fromTypeReferenceNode(ctx, node);
  } else if (ts.isArrayTypeNode(node)) {
    return {
      id: genId(),
      typeName: node.getText(),
      variableName: undefined,
      ...makeChildren(ctx, node.elementType),
    };
  } else if (ts.isInterfaceDeclaration(node)) {
    return {
      id: genId(),
      typeName: getOrThrow(ts.getNameOfDeclaration(node)?.getText()),
      variableName: undefined,
      ...makeChildren(ctx, node),
    };
  } else if (ts.isVariableDeclaration(node)) {
    return fromVariableDeclaration(ctx, node);
  } else if (ts.isPropertyAssignment(node)) {
    return {
      id: genId(),
      typeName: checker.typeToString(checker.getTypeAtLocation(node)),
      variableName: ts.getNameOfDeclaration(node)?.getText(),
      ...makeChildren(ctx, node.initializer),
    };
  } else if (ts.isFunctionDeclaration(node)) {
    if (node.type) {
      return {
        id: genId(),
        typeName: node.type.getText(),
        variableName: node.name?.getText() ?? 'Anonymous Function',
      };
    }
  }

  return undefined;
}

function fromVariableDeclaration(ctx: Context, node: ts.VariableDeclaration): TreeNode | undefined {
  const { genId, checker } = ctx;
  const type = checker.getTypeAtLocation(node);
  const typeNode = node.type ?? checker.typeToTypeNode(type);
  if (typeNode === undefined) return undefined;

  // case of `let x = 1; // => inferred a number type`
  if (isPrimitiveKeyword(typeNode)) {
    return {
      id: genId(),
      typeName: checker.typeToString(type),
      variableName: ts.getNameOfDeclaration(node)?.getText(),
    };
  }
  // case of `const obj = {...}`. Right side expression is TypeLiteral node.
  else if (ts.isTypeLiteralNode(typeNode)) {
    const obj = getOrThrow(
      node.forEachChild((n) => (ts.isObjectLiteralExpression(n) ? n : undefined)),
    );

    return {
      id: genId(),
      typeName: 'Anonymous(Object Literal)',
      variableName: ts.getNameOfDeclaration(node)?.getText(),
      ...makeChildren(ctx, obj),
    };

    /**
     * case of
     * - `const x = something()` and `something` result type is TypeReference
     * - `const foo: Foo = ...`
     */
  } else if (ts.isTypeReferenceNode(typeNode)) {
    const reference = type.aliasSymbol?.getDeclarations()?.[0]!;
    // get rid of declaration result because duplicate tree node between TypeReference and Declaration
    const tree = from(ctx, reference);

    return {
      id: genId(),
      typeName: getOrThrow(ts.getNameOfDeclaration(reference)?.getText()),
      variableName: ts.getNameOfDeclaration(node)?.getText(),
      ...(tree?.children ? { children: tree.children } : {}),
    };
  }
  return undefined;
}
function fromTypeReferenceNode(ctx: Context, node: ts.TypeReferenceNode) {
  // todo: improve get node
  const { checker } = ctx;
  const symbol = checker.getSymbolAtLocation(node.typeName);
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
    return node.types.map((t) => from(ctx, t)).filter(isNonNullable);
  } else if (ts.isArrayTypeNode(node)) {
    return [from(ctx, node)].filter(isNonNullable);
  } else if (ts.isTypeLiteralNode(node)) {
    return node.members.map((m) => from(ctx, m)).filter(isNonNullable);
  } else if (ts.isObjectLiteralExpression(node)) {
    return node.properties.map((p) => from(ctx, p)).filter(isNonNullable);
  } else if (ts.isInterfaceDeclaration(node)) {
    return node.members.map((m) => from(ctx, m)).filter(isNonNullable);
  }

  return [];
}
