import * as ts from 'typescript';

function getKindName(node: ts.Node) {
  return ts.SyntaxKind[node?.kind];
}
export function contain(node: ts.Node, pos: number) {
  return node.pos <= pos && pos < node.end;
}
export function getDescendantAtPos(node: ts.Node, pos: number) {
  let ret: ts.Node | undefined;

  while (true) {
    const next: ts.Node | undefined = getChildAtPos(ret || node, pos);
    if (next == null) return ret;
    ret = next;
  }
}
export function getChildAtPos(node: ts.Node, pos: number) {
  if (contain(node, pos)) {
    for (const child of node.getChildren()) {
      if (contain(child, pos)) return child;
    }
  }
  return undefined;
}
export function forEachChildArray(node: ts.Node): ts.Node[] {
  const nodes: ts.Node[] = [];
  node.forEachChild((n) => nodes.push(n));
  return nodes;
}
export function isPrimitiveKeyword(node: ts.Node) {
  switch (node.kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.SymbolKeyword:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.UndefinedKeyword:
    case ts.SyntaxKind.AnyKeyword:
    case ts.SyntaxKind.UnknownKeyword:
    case ts.SyntaxKind.BigIntKeyword:
    case ts.SyntaxKind.ObjectKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.VoidKeyword:
    case ts.SyntaxKind.NeverKeyword:
    case ts.SyntaxKind.LiteralType:
      return true;

    default:
      return false;
  }
}

function isTypeDefinitionNode(node: ts.Node) {
  return (
    isPrimitiveKeyword(node) ||
    ts.isTypeLiteralNode(node) ||
    ts.isTypeReferenceNode(node) ||
    ts.isUnionTypeNode(node) ||
    ts.isArrayTypeNode(node) ||
    ts.isPropertySignature(node)
  );
}

export function isSyntaxList(node: ts.Node): node is ts.SyntaxList {
  return node.kind === ts.SyntaxKind.SyntaxList;
}

/**
 * Find type definition node among children nodes
 * @example
 * type Foo = { foo: Bar }  // => returned `{ foo: Bar }`
 * @param node A type definition node
 */
export function findDeclarationNode(node: ts.Node): ts.Node | undefined {
  return node.getChildren().find(isTypeDefinitionNode);
}

export function findDeclarationNodes(node: ts.Node): ts.Node[] {
  return node.getChildren().filter(isTypeDefinitionNode);
}
