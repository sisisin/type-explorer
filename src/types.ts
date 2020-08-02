export type TreeNode = {
  label: string;
  typeName: string | undefined;
  children?: TreeNode[];
};
