export type TreeNode = {
  id: number;
  variableName: string;
  typeName: string | undefined;
  children?: TreeNode[];
};
