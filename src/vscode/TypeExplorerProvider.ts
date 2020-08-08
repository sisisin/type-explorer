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
  constructor(private treeNode: TreeNode | undefined) {
    // this.treeNode = treeObj;
  }
  _onDidChangeTreeData = new vscode.EventEmitter<Type | undefined>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh(treeNode: TreeNode | undefined) {
    this.treeNode = treeNode;
    this._onDidChangeTreeData.fire(undefined);
  }
  getTreeItem(element: Type): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: Type | undefined): vscode.ProviderResult<Type[]> {
    if (this.treeNode === undefined) {
      return;
    }
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
  readonly id: string;
  readonly label: string;
  private readonly variableName: string | undefined;
  constructor(
    readonly node: TreeNode,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(node.typeName, collapsibleState);
    this.label = node.typeName;
    this.id = node.id.toString();
    this.variableName = node.variableName;
  }
  get description() {
    return this.variableName ?? '';
  }
  get tooltip() {
    return `${this.variableName}: ${this.label}`;
  }
}
