import { Node, PropertySignature, SourceFile, ts, Type } from 'ts-morph';
import { TreeNode } from '../types';

export function makeTree(src: SourceFile, pos: number) {
  const child = src.getFirstChild()?.getDescendantAtPos(pos);
  const propertySignature = child?.getParent()!;
  if (!Node.isPropertySignature(propertySignature)) {
    console.log('invalid type: ', child?.getType().getText());
    return;
  }
  return makeTypeTree(propertySignature);
}

function makeTypeTree(node: PropertySignature): TreeNode | undefined {
  const label = node.getName();
  const typeNode = node.getTypeNode();
  const typeName = typeNode?.getText();

  const base: TreeNode = { label, typeName };

  if (!Node.isTypeReferenceNode(typeNode!)) {
    return base;
  } else {
    const type = node.getType();
    // Case of {node: Foo} and type Foo = [primitive type]
    if (isPrimitiveType(type)) {
      return {
        ...base,
        children: [
          {
            label: type.getText(),
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
          return makeTypeTree(d);
        } else {
          return {
            label: prop.getName(),
            typeName: d?.getType().getText(),
          };
        }
      })
      .filter((n): n is NonNullable<typeof n> => n !== undefined);
    return {
      ...base,
      children,
    };
  }
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
