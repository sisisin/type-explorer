import { Node, PropertySignature, SourceFile, ts, Type } from 'ts-morph';
import { TreeNode } from '../types';

export function makeTree(src: SourceFile, pos: number) {
  const child = src.getFirstChild()?.getDescendantAtPos(pos);
  const propertySignature = child?.getParent()!;
  if (!Node.isPropertySignature(propertySignature)) {
    console.log('invalid type: ', child?.getType().getText());
    return;
  }
  const genId = (() => {
    let id = 0;
    return () => ++id;
  })();
  return makeTypeTree(genId, propertySignature);
}

function makeTypeTree(genId: () => number, node: PropertySignature): TreeNode | undefined {
  const typeNode = node.getTypeNode();

  if (Node.isTypeReferenceNode(typeNode!)) {
    return fromTypeReferenceNode(genId, node);
  } else if (Node.isUnionTypeNode(typeNode!)) {
    // todo
    return { id: genId(), ...getNames(node) };
  } else {
    return { id: genId(), ...getNames(node) };
  }
}
function getNames(node: PropertySignature): Omit<TreeNode, 'id'> {
  const variableName = node.getName();
  const typeNode = node.getTypeNode();
  const typeName = typeNode?.getText() ?? node.getType().getText();
  return { variableName, typeName };
}
function fromTypeReferenceNode(genId: () => number, node: PropertySignature) {
  const type = node.getType();
  const base = getNames(node);

  // Case of {node: Foo} and type Foo = [primitive type]
  if (isPrimitiveType(type)) {
    return {
      id: genId(),
      ...base,
      children: [
        {
          id: genId(),
          variableName: type.getText(),
          typeName: type.getText(),
        },
      ],
    };
  }
  const props = type.getProperties();
  const children: TreeNode[] = props
    .map((prop) => {
      const d = prop.getValueDeclaration();
      if (d && Node.isPropertySignature(d!)) {
        return makeTypeTree(genId, d);
      } else {
        return {
          id: genId(),
          variableName: prop.getName(),
          typeName: d?.getType().getText() ?? 'd is undefined(todo)',
        };
      }
    })
    .filter((n): n is NonNullable<typeof n> => n !== undefined);
  return {
    id: genId(),
    ...base,
    children,
  };
}

function isPrimitiveType(type: Type<ts.Type> | undefined) {
  if (type === undefined) return false;
  return (
    type.isAny() ||
    type.isBoolean() ||
    type.isBooleanLiteral() ||
    type.isLiteral() ||
    type.isNull() ||
    type.isNumber() ||
    type.isString() ||
    type.isStringLiteral() ||
    type.isUnknown()
  );
}
