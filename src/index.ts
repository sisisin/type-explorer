import { Project, SourceFile, TypeGuards, ts, Type, PropertySignature } from 'ts-morph';
import path from 'path';

const p = new Project({
  tsConfigFilePath: path.resolve(__dirname, '../sample-project/tsconfig.json'),
});

const targetFile = path.resolve(__dirname, '../sample-project/types.ts');
const f = p.getSourceFile(targetFile);
printTargeType(f!, 134);

function printTargeType(src: SourceFile, pos: number) {
  const child = src.getFirstChild()?.getDescendantAtPos(pos);
  const propertySignature = child?.getParent()!;
  if (!TypeGuards.isPropertySignature(propertySignature)) {
    console.log('invalid type: ', child?.getType().getText());
    return;
  }

  const type = propertySignature.getType();
  const obj = makeTypeObject(type);
  console.log(obj);
}

function makeTypeObject(type: Type<ts.Type>) {
  if (isPrimitiveType(type)) {
    return type.getText();
  }
  const o: Record<string, any> = {};
  const properties = type.getProperties();
  for (const prop of properties) {
    const decls = prop.getDeclarations();
    o[prop.getName()] = decls
      .map((decl) => {
        if (TypeGuards.isPropertySignature(decl)) {
          const t = decl.getTypeNode()?.getType();
          const s = t?.getAliasSymbol()?.getDeclarations()?.[0].getType();
          if (s) {
            return makeTypeObject(s);
          } else {
            return t?.getText();
          }
        } else {
          undefined;
        }
      })
      .filter((n) => n !== undefined)
      .join(',');
  }

  return o;
}

function isPrimitiveType(type: Type<ts.Type>) {
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
