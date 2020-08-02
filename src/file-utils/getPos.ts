import * as fs from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(fs.readFile);

interface Position {
  line: number;
  character: number;
}
export async function getPos(filePath: string, { character, line }: Position) {
  const lines = (await readFileAsync(filePath)).toString().split('\n');
  const pos = lines
    .filter((_, i) => i <= line)
    .map((l, i) => {
      if (i < line) return l;
      return l.substr(0, character);
    })
    .join('\n').length;

  return pos;
}
