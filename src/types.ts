export type TreeNode = {
  id: number;
  variableName: string | undefined;
  typeName: string;
  children?: TreeNode[];
};
