/**
 * VSCode implementation of IEditor interface
 */

import * as vscode from "vscode"
import type {
	IEditor,
	IDocument,
	IEditorContext,
	ITabInfo,
	ITextEdit,
	IDiagnostic,
	DiagnosticSeverity,
} from "@roo-code/platform-interfaces"

/**
 * Adapter class to wrap VSCode TextDocument as IDocument
 */
class VSCodeDocumentAdapter implements IDocument {
	constructor(private doc: vscode.TextDocument) {}

	get uri(): string {
		return this.doc.uri.toString()
	}

	get path(): string {
		return this.doc.uri.fsPath
	}

	get languageId(): string {
		return this.doc.languageId
	}

	get version(): number {
		return this.doc.version
	}

	get lineCount(): number {
		return this.doc.lineCount
	}

	get isDirty(): boolean {
		return this.doc.isDirty
	}

	getText(range?: { start: { line: number; character: number }; end: { line: number; character: number } }): string {
		if (!range) {
			return this.doc.getText()
		}

		const vscodeRange = new vscode.Range(
			new vscode.Position(range.start.line, range.start.character),
			new vscode.Position(range.end.line, range.end.character),
		)

		return this.doc.getText(vscodeRange)
	}

	getLine(lineNumber: number): string {
		if (lineNumber < 0 || lineNumber >= this.doc.lineCount) {
			return ""
		}
		return this.doc.lineAt(lineNumber).text
	}

	positionAt(offset: number): { line: number; character: number } {
		const pos = this.doc.positionAt(offset)
		return { line: pos.line, character: pos.character }
	}

	offsetAt(position: { line: number; character: number }): number {
		const pos = new vscode.Position(position.line, position.character)
		return this.doc.offsetAt(pos)
	}
}

export class VSCodeEditor implements IEditor {
	private documentCache = new WeakMap<vscode.TextDocument, IDocument>()

	/**
	 * Open a document
	 */
	async openDocument(path: string): Promise<IDocument> {
		const uri = vscode.Uri.file(path)
		const doc = await vscode.workspace.openTextDocument(uri)

		// Check cache
		let cached = this.documentCache.get(doc)
		if (!cached) {
			cached = new VSCodeDocumentAdapter(doc)
			this.documentCache.set(doc, cached)
		}

		return cached
	}

	/**
	 * Close a document
	 */
	async closeDocument(path: string): Promise<void> {
		const uri = vscode.Uri.file(path)

		// Find and close the editor showing this document
		// @ts-expect-error - tabGroups requires VSCode 1.58+
		for (const tabGroup of vscode.window.tabGroups.all) {
			for (const tab of tabGroup.tabs) {
				// @ts-expect-error - TabInputText requires VSCode 1.58+
				if (tab.input instanceof vscode.TabInputText && tab.input.uri.fsPath === uri.fsPath) {
					// @ts-expect-error - tabGroups.close requires VSCode 1.58+
					await vscode.window.tabGroups.close(tab)
				}
			}
		}
	}

	/**
	 * Get all currently open documents
	 */
	getOpenDocuments(): IDocument[] {
		return vscode.workspace.textDocuments.map((doc) => {
			let cached = this.documentCache.get(doc)
			if (!cached) {
				cached = new VSCodeDocumentAdapter(doc)
				this.documentCache.set(doc, cached)
			}
			return cached
		})
	}

	/**
	 * Get the context of the active editor
	 */
	getActiveEditorContext(): IEditorContext | null {
		const editor = vscode.window.activeTextEditor
		if (!editor) {
			return null
		}

		const document = editor.document
		const selection = editor.selection
		const selectedText = document.getText(selection)

		// If no selection, get current line
		let effectiveRange = selection
		let text = selectedText

		if (!selectedText) {
			const currentLine = document.lineAt(selection.start.line)
			if (!currentLine.text.trim()) {
				return null
			}

			// Expand to include adjacent lines
			const startLineIndex = Math.max(0, currentLine.lineNumber - 1)
			const endLineIndex = Math.min(document.lineCount - 1, currentLine.lineNumber + 1)

			effectiveRange = new vscode.Range(
				new vscode.Position(startLineIndex, 0),
				new vscode.Position(endLineIndex, document.lineAt(endLineIndex).text.length),
			) as typeof effectiveRange

			text = document.getText(effectiveRange)
		}

		// Get diagnostics that intersect with the effective range
		const diagnostics = vscode.languages
			.getDiagnostics(document.uri)
			.filter((d) => this.rangesIntersect(effectiveRange, d.range))
			.map((d) => this.convertDiagnostic(d))

		return {
			filePath: document.uri.fsPath,
			selectedText: text,
			startLine: effectiveRange.start.line, // 0-based
			endLine: effectiveRange.end.line, // 0-based
			diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
		}
	}

	/**
	 * Get all open tabs/editors
	 */
	getOpenedTabs(): ITabInfo[] {
		const tabs: ITabInfo[] = []

		// @ts-expect-error - tabGroups requires VSCode 1.58+
		for (const tabGroup of vscode.window.tabGroups.all) {
			for (const tab of tabGroup.tabs) {
				// @ts-expect-error - TabInputText requires VSCode 1.58+
				if (tab.input instanceof vscode.TabInputText) {
					tabs.push({
						path: tab.input.uri.fsPath,
						label: tab.label,
						isActive: tab.isActive,
					})
				}
			}
		}

		return tabs
	}

	/**
	 * Apply text edits to a document
	 */
	async applyEdit(path: string, edits: ITextEdit[]): Promise<boolean> {
		const uri = vscode.Uri.file(path)
		await vscode.workspace.openTextDocument(uri)

		const workspaceEdit = new vscode.WorkspaceEdit()

		for (const edit of edits) {
			const range = new vscode.Range(
				new vscode.Position(edit.range.start.line, edit.range.start.character),
				new vscode.Position(edit.range.end.line, edit.range.end.character),
			)

			workspaceEdit.replace(uri, range, edit.newText)
		}

		return await vscode.workspace.applyEdit(workspaceEdit)
	}

	/**
	 * Show a diff between two files
	 */
	async showDiff(originalPath: string, modifiedPath: string, title?: string): Promise<void> {
		const originalUri = vscode.Uri.file(originalPath)
		const modifiedUri = vscode.Uri.file(modifiedPath)

		await vscode.commands.executeCommand("vscode.diff", originalUri, modifiedUri, title || "Diff")
	}

	/**
	 * Get diagnostics for a file or all files
	 */
	getDiagnostics(path?: string): IDiagnostic[] {
		if (path) {
			const uri = vscode.Uri.file(path)
			const diagnostics = vscode.languages.getDiagnostics(uri)
			return diagnostics.map((d) => this.convertDiagnostic(d))
		}

		// Get all diagnostics
		const allDiagnostics: IDiagnostic[] = []
		const diagnosticsMap = vscode.languages.getDiagnostics()

		for (const [, diagnostics] of diagnosticsMap) {
			for (const diagnostic of diagnostics) {
				allDiagnostics.push(this.convertDiagnostic(diagnostic))
			}
		}

		return allDiagnostics
	}

	/**
	 * Helper: Check if two ranges intersect
	 */
	private rangesIntersect(range1: vscode.Range, range2: vscode.Range): boolean {
		if (
			range1.end.line < range2.start.line ||
			(range1.end.line === range2.start.line && range1.end.character <= range2.start.character)
		) {
			return false
		}
		if (
			range2.end.line < range1.start.line ||
			(range2.end.line === range1.start.line && range2.end.character <= range1.start.character)
		) {
			return false
		}
		return true
	}

	/**
	 * Helper: Convert VSCode diagnostic to platform-agnostic format
	 */
	private convertDiagnostic(diagnostic: vscode.Diagnostic): IDiagnostic {
		const severityMap: Record<vscode.DiagnosticSeverity, DiagnosticSeverity> = {
			[vscode.DiagnosticSeverity.Error]: "error",
			[vscode.DiagnosticSeverity.Warning]: "warning",
			[vscode.DiagnosticSeverity.Information]: "info",
			[vscode.DiagnosticSeverity.Hint]: "hint",
		}

		return {
			range: {
				start: { line: diagnostic.range.start.line, character: diagnostic.range.start.character },
				end: { line: diagnostic.range.end.line, character: diagnostic.range.end.character },
			},
			message: diagnostic.message,
			severity: severityMap[diagnostic.severity],
			source: diagnostic.source,
			code:
				typeof diagnostic.code === "object" && diagnostic.code && "value" in diagnostic.code
					? (diagnostic.code as { value: string | number }).value
					: diagnostic.code,
		}
	}
}
