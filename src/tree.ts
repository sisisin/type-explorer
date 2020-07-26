import * as vscode from 'vscode';

export class TypeExplorerProvider implements vscode.TreeDataProvider<Type> {
  // onDidChangeTreeData?: vscode.Event<void | Type | null | undefined> | undefined;
  getTreeItem(element: Type): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: Type | undefined): vscode.ProviderResult<Type[]> {
    return [
      new Type('Foo', vscode.TreeItemCollapsibleState.Collapsed),
      new Type('Bar', vscode.TreeItemCollapsibleState.Collapsed)
    ];
  }

}

class Type extends vscode.TreeItem {
  constructor(public readonly label: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}