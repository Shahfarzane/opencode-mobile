import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { createOpenCodeManager, type OpenCodeManager } from './opencode';

let chatViewProvider: ChatViewProvider | undefined;
let openCodeManager: OpenCodeManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
  // Create OpenCode manager first
  openCodeManager = createOpenCodeManager(context);

  // Create chat view provider with manager reference
  // The webview will show a loading state until OpenCode is ready
  chatViewProvider = new ChatViewProvider(context, context.extensionUri, openCodeManager);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatViewProvider.viewType,
      chatViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openchamber.restartApi', async () => {
      try {
        await openCodeManager?.restart();
        vscode.window.showInformationMessage('OpenChamber: API connection restarted');
      } catch (e) {
        vscode.window.showErrorMessage(`OpenChamber: Failed to restart API - ${e}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme((theme) => {
      chatViewProvider?.updateTheme(theme.kind);
    })
  );

  // Theme changes can update the `workbench.colorTheme` setting slightly after the
  // `activeColorTheme` event. Listen for config changes too so we can re-resolve
  // the contributed theme JSON and update Shiki themes in the webview.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration('workbench.colorTheme') ||
        event.affectsConfiguration('workbench.preferredLightColorTheme') ||
        event.affectsConfiguration('workbench.preferredDarkColorTheme')
      ) {
        chatViewProvider?.updateTheme(vscode.window.activeColorTheme.kind);
      }
    })
  );

  // Subscribe to status changes - this broadcasts to webview
  context.subscriptions.push(
    openCodeManager.onStatusChange((status, error) => {
      chatViewProvider?.updateConnectionStatus(status, error);
    })
  );

  // Start OpenCode API and wait for it to be ready
  // The webview will show loading state during this time
  await openCodeManager.start();
}

export async function deactivate() {
  await openCodeManager?.stop();
  openCodeManager = undefined;
  chatViewProvider = undefined;
}
