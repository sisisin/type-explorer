export type TreeNode = {
  id: number;
  variableName: string | undefined;
  typeName: string;
  children?: TreeNode[];
};

export type TreeNodeLike = {
  variableName: string | undefined;
  typeName: string;
  children?: TreeNodeLike[];
};
