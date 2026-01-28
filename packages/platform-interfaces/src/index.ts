/**
 * @roo-code/platform-interfaces
 *
 * Platform-agnostic interfaces for file system, terminal, editor, workspace, configuration, and storage operations.
 *
 * These interfaces enable the Zl-Agent core functionality to work across different platforms:
 * - VSCode Extension: Using VSCode APIs
 * - Node.js CLI: Using native Node.js modules
 * - Web Application: Using browser APIs or remote services
 *
 * @packageDocumentation
 */

// File System
export type {
	IFileInfo,
	IReadFileOptions,
	IWriteFileOptions,
	IGlobOptions,
	ISearchOptions,
	ISearchResult,
	IFileChangeEvent,
	IDisposable,
	IFileSystem,
} from "./IFileSystem.js"

// Terminal
export type { ITerminalOptions, IExecuteOptions, ITerminalProcess, ITerminal, ITerminalManager } from "./ITerminal.js"

// Editor
export type {
	IPosition,
	IRange,
	ITextEdit,
	DiagnosticSeverity,
	IDiagnostic,
	IDocument,
	IEditorContext,
	ITabInfo,
	IEditor,
} from "./IEditor.js"

// Workspace
export type { IWorkspaceFolder, IWorkspaceFoldersChangeEvent, IWorkspace } from "./IWorkspace.js"

// Configuration
export type { IConfigurationInspect, IConfigurationChangeEvent, IConfiguration } from "./IConfiguration.js"

// Storage
export type { IStorage, ISecretStorage, IStorageProvider } from "./IStorage.js"
