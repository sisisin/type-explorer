import * as ts from 'typescript';

function getKindName(node: ts.Node) {
  return ts.SyntaxKind[node?.kind];
}
export function getDescendantAtPos(node: ts.Node, pos: number) {
  let ret: ts.Node | undefined;

  while (true) {
    const next: ts.Node | undefined = getChildAtPos(ret || node, pos);
    if (next == null) return ret;
    ret = next;
  }
}
export function contain(node: ts.Node, pos: number) {
  return node.pos <= pos && pos < node.end;
}
export function getChildAtPos(node: ts.Node, pos: number) {
  if (contain(node, pos)) {
    for (const child of node.getChildren()) {
      if (contain(child, pos)) return child;
    }
  }
  return undefined;
}
