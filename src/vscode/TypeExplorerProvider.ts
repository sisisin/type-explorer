import * as vscode from 'vscode';
import { TreeNode } from '../types';

function find(id: string, target: TreeNode[]): TreeNode | undefined {
  for (const t of target) {
    if (t.id.toString() === id) return t;
    if (t.children) {
      const result = find(id, t.children);
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
      return [new Type(this.treeNode, vscode.TreeItemCollapsibleState.Collapsed)];
    }
    const children = find(element.id, [this.treeNode])?.children ?? [];
    return children.map(
      (n) =>
        new Type(
          n,
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
  private readonly variableName: string;
  private readonly typeName: string | undefined;
  constructor(
    readonly node: TreeNode,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(node.typeName ?? '', collapsibleState);
    this.label = node.typeName ?? '';
    this.id = node.id.toString();
    this.variableName = node.variableName;
  }
  get description() {
    return this.variableName ?? '';
  }
  get tooltip() {
    return `${this.variableName}: ${this.typeName}`;
  }
}
