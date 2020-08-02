import { TreeNode } from '../types';

export const treeObj: TreeNode = {
  id: 1,
  variableName: 'Foo',
  typeName: undefined,
  children: [
    {
      id: 2,
      variableName: 'x',
      typeName: 'string',
    },
    {
      id: 3,
      variableName: 'bar',
      typeName: 'Bar',
      children: [
        {
          id: 4,
          variableName: 'a',
          typeName: 'string[] | string',
          children: [
            { id: 5, variableName: 'string[]', typeName: 'string[]' },
            { id: 6, variableName: 'string', typeName: 'string' },
          ],
        },
        {
          id: 7,
          variableName: 'baz',
          typeName: 'Baz',
          children: [{ id: 8, variableName: 'number', typeName: undefined }],
        },
      ],
    },
  ],
};
