import * as vscode from 'vscode';
import { TreeNode } from '../types';

function find(label: string, target: TreeNode[]): TreeNode | undefined {
  for (const t of target) {
    if (t.variableName === label) return t;
    if (t.children) {
      const result = find(label, t.children);
      if (result) return result;
    }
  }
  return undefined;
}
export class TypeExplorerProvider implements vscode.TreeDataProvider<Type> {
  constructor(private treeNode: TreeNode) {
    // this.treeNode = treeObj;
  }
  // onDidChangeTreeData?: vscode.Event<void | Type | null | undefined> | undefined;
  getTreeItem(element: Type): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: Type | undefined): vscode.ProviderResult<Type[]> {
    if (element === undefined) {
      return [
        new Type(
          this.treeNode.variableName,
          this.treeNode.typeName,
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
      ];
    }
    const children = find(element.id, [this.treeNode])?.children ?? [];
    return children.map(
      (n) =>
        new Type(
          n.variableName,
          n.typeName,
          (n.children ?? []).length > 0
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
        ),
    );
  }
}

class Type extends vscode.TreeItem {
  readonly label: string;
  readonly id: string;
  constructor(
    private readonly variableName: string,
    private readonly typeName: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(variableName, collapsibleState);
    this.label = typeName ?? '';
    this.id = variableName;
  }
  get description() {
    return this.variableName ?? '';
  }
  get tooltip() {
    return `${this.variableName}: ${this.typeName}`;
  }
}
