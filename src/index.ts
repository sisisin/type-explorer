import { Project } from 'ts-morph';
import path from 'path';

const p = new Project({
  tsConfigFilePath: path.resolve(__dirname, '../sample-project/tsconfig.json'),
});

const sources = p
  .getSourceFiles()
  .filter((f) => !(f.isDeclarationFile() || f.isInNodeModules() || f.isFromExternalLibrary()));
for (const src of sources) {
  console.log(src.getBaseName());
}
