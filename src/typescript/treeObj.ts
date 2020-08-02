import { TreeNode } from '../types';

export const treeObj: TreeNode = {
  label: 'Foo',
  typeName: undefined,
  children: [
    {
      label: 'x',
      typeName: 'string',
    },
    {
      label: 'bar',
      typeName: 'Bar',
      children: [
        {
          label: 'a',
          typeName: 'string[] | string',
        },
        {
          label: 'baz',
          typeName: 'Baz',
          children: [{ label: 'number', typeName: undefined }],
        },
      ],
    },
  ],
};
