import * as vscode from 'vscode';
import { TreeNode } from '../types';

function find(label: string, target: TreeNode[]): TreeNode | undefined {
  for (const t of target) {
    if (t.label === label) return t;
    if (t.children) return find(label, t.children);
  }
  return undefined;
}
export class TypeExplorerProvider implements vscode.TreeDataProvider<Type> {
  constructor(private treeNode: TreeNode) {}
  // onDidChangeTreeData?: vscode.Event<void | Type | null | undefined> | undefined;
  getTreeItem(element: Type): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: Type | undefined): vscode.ProviderResult<Type[]> {
    if (element === undefined) {
      return [
        new Type(
          this.treeNode.label,
          this.treeNode.typeName,
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
      ];
    }
    const children = find(element.label, [this.treeNode])?.children ?? [];
    return children.map(
      (n) =>
        new Type(
          n.label,
          n.typeName,
          n.children
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
        ),
    );
  }
}

class Type extends vscode.TreeItem {
  readonly label: string;
  constructor(
    private readonly variableName: string,
    private readonly typeName: string | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(variableName, collapsibleState);
    this.label = variableName;
  }
  get description() {
    return this.typeName ?? '';
  }
  get tooltip() {
    return `${this.variableName}: ${this.typeName}`;
  }
}
