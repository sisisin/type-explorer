import {
  Node,
  PropertySignature,
  SourceFile,
  ts,
  Type,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph';
import { TreeNode } from '../types';

export function makeTree(src: SourceFile, pos: number) {
  const child = src.getFirstChild()?.getDescendantAtPos(pos);
  const propertySignature = child?.getParent()!;
  if (!isTreeableNode(propertySignature)) {
    console.log('invalid type: ', child?.getType().getText());
    return;
  }
  const genId = (() => {
    let id = 0;
    return () => ++id;
  })();
  return makeTypeTree(genId, propertySignature);
}

function isTreeableNode(node: Node<ts.Node> | undefined): node is TreeableNode {
  if (node === undefined) return false;

  return Node.isPropertySignature(node) || Node.isTypeAliasDeclaration(node);
}

type TreeableNode = PropertySignature | TypeAliasDeclaration;
function makeTypeTree(genId: () => number, node: TreeableNode): TreeNode | undefined {
  const typeNode = node.getTypeNode();

  if (typeNode === undefined) {
    return { id: genId(), ...getNames(node) };
  }

  if (Node.isTypeAliasDeclaration(node)) {
    const children: TreeNode[] = !Node.isTypeElementMemberedNode(typeNode)
      ? []
      : typeNode
          .getProperties()
          .map((p) => makeTypeTree(genId, p))
          .filter(isNonNullable);
    return {
      id: genId(),
      variableName: undefined,
      typeName: node.getName(),
      children,
    };
  }

  if (Node.isTypeReferenceNode(typeNode)) {
    return fromTypeReferenceNode(genId, getNames(node), typeNode);
  } else if (Node.isUnionTypeNode(typeNode)) {
    const children: TreeNode[] = typeNode
      .getTypeNodes()
      .map((tn) => {
        const base: Pick<TreeNode, 'typeName' | 'variableName'> = {
          variableName: undefined,
          typeName: tn.getText(),
        };
        return fromTypeReferenceNode(genId, base, tn);
      })
      .filter(isNonNullable);
    return { id: genId(), ...getNames(node), children };
  } else {
    return { id: genId(), ...getNames(node) };
  }
}
function getNames(
  node: TreeableNode | undefined,
  typeNode = node?.getTypeNode(),
): Omit<TreeNode, 'id'> {
  return {
    variableName: node?.getName(),
    typeName:
      typeNode?.getText() ??
      node?.getType().getText() ??
      (() => {
        throw new Error(
          'Invalid arguments. `node` or `typeNode` must not be undefined at least one',
        );
      })(),
  };
}
function fromTypeReferenceNode(
  genId: () => number,
  names: Pick<TreeNode, 'typeName' | 'variableName'>,
  typeNode: TypeNode<ts.TypeNode>,
) {
  const type = typeNode.getType();
  const base = names;

  // Case of {node: Foo} and type Foo is a primitive-like
  if (isNotTreeableType(type)) {
    if (Node.isTypeReferenceNode(typeNode)) {
      return {
        id: genId(),
        ...base,
        children: [
          {
            id: genId(),
            variableName: undefined,
            typeName: type.getText(),
          },
        ],
      };
    } else {
      return {
        id: genId(),
        ...base,
      };
    }
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
    .filter(isNonNullable);
  return {
    id: genId(),
    ...base,
    children,
  };
}
function isNonNullable<T extends unknown>(v: T): v is NonNullable<T> {
  return v != null;
}
function isNotTreeableType(type: Type<ts.Type> | undefined): boolean {
  return type?.isArray() ? isNotTreeableType(type.getArrayElementType()) : isPrimitiveType(type);

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
}
