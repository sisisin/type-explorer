import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(fs.readFile);

export async function findTsconfigFile(startPath: string): Promise<string> {
  const dirname = path.dirname(startPath);

  const maybeTsconfig = path.resolve(dirname, 'tsconfig.json');
  try {
    await readFileAsync(maybeTsconfig);
    return maybeTsconfig;
  } catch (e) {
    if (dirname === '/') {
      throw new Error('Can not find tsconfig.json');
    } else {
      return findTsconfigFile(dirname);
    }
  }
}
