/**
 * VSCode implementation of IWorkspace interface
 */

import * as vscode from "vscode"
import type {
	IWorkspace,
	IWorkspaceFolder,
	IWorkspaceFoldersChangeEvent,
	IDisposable,
} from "@roo-code/platform-interfaces"

export class VSCodeWorkspace implements IWorkspace {
	private disposables: vscode.Disposable[] = []

	/**
	 * Get all workspace folders
	 */
	getWorkspaceFolders(): IWorkspaceFolder[] {
		const folders = vscode.workspace.workspaceFolders
		if (!folders) {
			return []
		}

		return folders.map((folder, index) => ({
			name: folder.name,
			path: folder.uri.fsPath,
			index,
		}))
	}

	/**
	 * Get the root path of the workspace
	 */
	getRootPath(): string | undefined {
		const folders = vscode.workspace.workspaceFolders
		if (!folders || folders.length === 0) {
			return undefined
		}

		// For single-folder workspace, return the folder path
		if (folders.length === 1) {
			return folders[0]?.uri.fsPath
		}

		// For multi-folder workspace, return undefined
		return undefined
	}

	/**
	 * Get all files in the workspace
	 */
	async getWorkspaceFiles(maxFiles?: number): Promise<string[]> {
		const files = await vscode.workspace.findFiles("**/*", "**/node_modules/**", maxFiles)
		return files.map((uri) => uri.fsPath)
	}

	/**
	 * Register a callback for workspace folder changes
	 */
	onDidChangeWorkspaceFolders(callback: (event: IWorkspaceFoldersChangeEvent) => void): IDisposable {
		const disposable = vscode.workspace.onDidChangeWorkspaceFolders((e) => {
			const event: IWorkspaceFoldersChangeEvent = {
				added: e.added.map((folder, index) => ({
					name: folder.name,
					path: folder.uri.fsPath,
					index,
				})),
				removed: e.removed.map((folder, index) => ({
					name: folder.name,
					path: folder.uri.fsPath,
					index,
				})),
			}
			callback(event)
		})

		this.disposables.push(disposable)

		return {
			dispose: () => {
				disposable.dispose()
				const index = this.disposables.indexOf(disposable)
				if (index >= 0) {
					this.disposables.splice(index, 1)
				}
			},
		}
	}

	/**
	 * Register a callback for file creation
	 */
	onDidCreateFile(callback: (path: string) => void): IDisposable {
		const watcher = vscode.workspace.createFileSystemWatcher("**/*")
		const disposable = watcher.onDidCreate((uri) => {
			callback(uri.fsPath)
		})

		this.disposables.push(disposable, watcher)

		return {
			dispose: () => {
				disposable.dispose()
				watcher.dispose()
				const index = this.disposables.indexOf(disposable)
				if (index >= 0) {
					this.disposables.splice(index, 1)
				}
			},
		}
	}

	/**
	 * Register a callback for file deletion
	 */
	onDidDeleteFile(callback: (path: string) => void): IDisposable {
		const watcher = vscode.workspace.createFileSystemWatcher("**/*")
		const disposable = watcher.onDidDelete((uri) => {
			callback(uri.fsPath)
		})

		this.disposables.push(disposable, watcher)

		return {
			dispose: () => {
				disposable.dispose()
				watcher.dispose()
				const index = this.disposables.indexOf(disposable)
				if (index >= 0) {
					this.disposables.splice(index, 1)
				}
			},
		}
	}

	/**
	 * Register a callback for file changes
	 */
	onDidChangeFile(callback: (path: string) => void): IDisposable {
		const watcher = vscode.workspace.createFileSystemWatcher("**/*")
		const disposable = watcher.onDidChange((uri) => {
			callback(uri.fsPath)
		})

		this.disposables.push(disposable, watcher)

		return {
			dispose: () => {
				disposable.dispose()
				watcher.dispose()
				const index = this.disposables.indexOf(disposable)
				if (index >= 0) {
					this.disposables.splice(index, 1)
				}
			},
		}
	}

	/**
	 * Dispose of all resources
	 */
	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose()
		}
		this.disposables = []
	}
}
