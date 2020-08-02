import { Project, SourceFile, ts, Type, PropertySignature, Node } from 'ts-morph';
import * as path from 'path';

const p = new Project({
  tsConfigFilePath: path.resolve(__dirname, '../../sample-project/tsconfig.json'),
});

const targetFile = path.resolve(__dirname, '../../sample-project/types.ts');
const f = p.getSourceFile(targetFile);
// printTargeType(f!, 55); // baz
printTargeType(f!, 134); // bar
// printTargeType(f!, 55);

function printTargeType(src: SourceFile, pos: number) {
  const child = src.getFirstChild()?.getDescendantAtPos(pos);
  const propertySignature = child?.getParent()!;
  if (!Node.isPropertySignature(propertySignature)) {
    console.log('invalid type: ', child?.getType().getText());
    return;
  }
  const tree = makeTypeTree(propertySignature);
  console.log(JSON.stringify(tree, null, '  '));
}

type TreeNode = {
  label: string;
  typeName: string | undefined;
  children?: TreeNode[];
};
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
