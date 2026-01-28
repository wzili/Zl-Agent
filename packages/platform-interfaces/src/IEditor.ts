/**
 * Platform-agnostic editor interfaces
 *
 * These interfaces provide an abstraction layer over different editor implementations
 * (VSCode's editor/document APIs, headless editors, etc.)
 */

/**
 * Represents a position in a document (0-based)
 */
export interface IPosition {
	/** Line number (0-based) */
	line: number
	/** Character/column number (0-based) */
	character: number
}

/**
 * Represents a range in a document
 */
export interface IRange {
	/** Start position (inclusive) */
	start: IPosition
	/** End position (exclusive) */
	end: IPosition
}

/**
 * Represents a text edit operation
 */
export interface ITextEdit {
	/** Range to replace */
	range: IRange
	/** New text to insert */
	newText: string
}

/**
 * Severity levels for diagnostics
 */
export type DiagnosticSeverity = "error" | "warning" | "info" | "hint"

/**
 * Represents a diagnostic (error, warning, etc.)
 */
export interface IDiagnostic {
	/** Range where the diagnostic applies */
	range: IRange
	/** Diagnostic message */
	message: string
	/** Severity level */
	severity: DiagnosticSeverity
	/** Source of the diagnostic (e.g., 'typescript', 'eslint') */
	source?: string
	/** Diagnostic code */
	code?: string | number
}

/**
 * Represents a text document
 */
export interface IDocument {
	/** URI/identifier for the document */
	uri: string
	/** File system path */
	path: string
	/** Language identifier (e.g., 'typescript', 'javascript') */
	languageId: string
	/** Document version number */
	version: number
	/** Total number of lines */
	lineCount: number
	/** Whether the document has unsaved changes */
	isDirty: boolean

	/**
	 * Get text from the document
	 * @param range Optional range to get text from
	 * @returns Text content
	 */
	getText(range?: IRange): string

	/**
	 * Get a specific line from the document
	 * @param lineNumber Line number (0-based)
	 * @returns Line text
	 */
	getLine(lineNumber: number): string

	/**
	 * Convert an offset to a position
	 * @param offset Character offset
	 * @returns Position
	 */
	positionAt(offset: number): IPosition

	/**
	 * Convert a position to an offset
	 * @param position Position
	 * @returns Character offset
	 */
	offsetAt(position: IPosition): number
}

/**
 * Represents editor context (active selection and file)
 */
export interface IEditorContext {
	/** Path to the file */
	filePath: string
	/** Currently selected text */
	selectedText: string
	/** Start line of selection (0-based) */
	startLine: number
	/** End line of selection (0-based) */
	endLine: number
	/** Diagnostics for the file */
	diagnostics?: IDiagnostic[]
}

/**
 * Represents an open tab/editor
 */
export interface ITabInfo {
	/** Path to the file */
	path: string
	/** Display label */
	label: string
	/** Whether this tab is currently active */
	isActive: boolean
}

/**
 * Platform-agnostic editor interface
 *
 * Implementations should provide concrete implementations for different platforms:
 * - VSCode: Wrapping vscode.window and vscode.workspace text editor APIs
 * - Node.js: Using basic text document representations
 * - Web: Using Monaco Editor or similar
 */
export interface IEditor {
	// Document operations

	/**
	 * Open a document
	 * @param path Path to the document
	 * @returns Document instance
	 */
	openDocument(path: string): Promise<IDocument>

	/**
	 * Close a document
	 * @param path Path to the document
	 */
	closeDocument(path: string): Promise<void>

	/**
	 * Get all currently open documents
	 * @returns Array of open documents
	 */
	getOpenDocuments(): IDocument[]

	// Editor context

	/**
	 * Get the context of the active editor
	 * @returns Editor context or null if no active editor
	 */
	getActiveEditorContext(): IEditorContext | null

	/**
	 * Get all open tabs/editors
	 * @returns Array of tab information
	 */
	getOpenedTabs(): ITabInfo[]

	// Edit operations

	/**
	 * Apply text edits to a document
	 * @param path Path to the document
	 * @param edits Array of edits to apply
	 * @returns True if successful, false otherwise
	 */
	applyEdit(path: string, edits: ITextEdit[]): Promise<boolean>

	// Diff operations

	/**
	 * Show a diff between two files
	 * @param originalPath Path to original file
	 * @param modifiedPath Path to modified file
	 * @param title Optional title for the diff view
	 */
	showDiff(originalPath: string, modifiedPath: string, title?: string): Promise<void>

	// Diagnostics

	/**
	 * Get diagnostics for a file or all files
	 * @param path Optional path to get diagnostics for
	 * @returns Array of diagnostics
	 */
	getDiagnostics(path?: string): IDiagnostic[]
}
