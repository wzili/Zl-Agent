/**
 * Platform-agnostic workspace interfaces
 *
 * These interfaces provide an abstraction layer over different workspace implementations
 * (VSCode's workspace API, file-based workspaces, etc.)
 */

import type { IDisposable } from "./IFileSystem.js"

/**
 * Represents a workspace folder
 */
export interface IWorkspaceFolder {
	/** Name of the workspace folder */
	name: string
	/** Full path to the workspace folder */
	path: string
	/** Index in the workspace folders array */
	index: number
}

/**
 * Event fired when workspace folders change
 */
export interface IWorkspaceFoldersChangeEvent {
	/** Workspace folders that were added */
	added: IWorkspaceFolder[]
	/** Workspace folders that were removed */
	removed: IWorkspaceFolder[]
}

/**
 * Platform-agnostic workspace interface
 *
 * Implementations should provide concrete implementations for different platforms:
 * - VSCode: Wrapping vscode.workspace
 * - Node.js: Using directory-based workspace
 * - Web: Using virtual workspace
 */
export interface IWorkspace {
	// Workspace folders

	/**
	 * Get all workspace folders
	 * @returns Array of workspace folders
	 */
	getWorkspaceFolders(): IWorkspaceFolder[]

	/**
	 * Get the root path of the workspace
	 * For single-folder workspaces, returns the folder path
	 * For multi-folder workspaces, returns undefined
	 * @returns Root path or undefined
	 */
	getRootPath(): string | undefined

	// File tracking

	/**
	 * Get all files in the workspace
	 * @param maxFiles Maximum number of files to return
	 * @returns Array of file paths
	 */
	getWorkspaceFiles(maxFiles?: number): Promise<string[]>

	// Change events

	/**
	 * Register a callback for workspace folder changes
	 * @param callback Function to call when workspace folders change
	 * @returns Disposable to unregister the callback
	 */
	onDidChangeWorkspaceFolders(callback: (event: IWorkspaceFoldersChangeEvent) => void): IDisposable

	/**
	 * Register a callback for file creation
	 * @param callback Function to call when a file is created
	 * @returns Disposable to unregister the callback
	 */
	onDidCreateFile(callback: (path: string) => void): IDisposable

	/**
	 * Register a callback for file deletion
	 * @param callback Function to call when a file is deleted
	 * @returns Disposable to unregister the callback
	 */
	onDidDeleteFile(callback: (path: string) => void): IDisposable

	/**
	 * Register a callback for file changes
	 * @param callback Function to call when a file is changed
	 * @returns Disposable to unregister the callback
	 */
	onDidChangeFile(callback: (path: string) => void): IDisposable
}
