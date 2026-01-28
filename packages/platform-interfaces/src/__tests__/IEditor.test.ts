/**
 * IEditor interface contract tests
 */

import { describe, it, expect } from "vitest"
import type { IEditor, IDocument, ITextEdit, IDiagnostic } from "../index.js"

describe("IEditor Contract", () => {
	it("should allow implementing IEditor with all required methods", async () => {
		const mockEditor: IEditor = {
			openDocument: async (path) => ({
				uri: `file://${path}`,
				path,
				languageId: "typescript",
				version: 1,
				lineCount: 10,
				isDirty: false,
				getText: () => "content",
				getLine: (_line) => "line text",
				positionAt: (offset) => ({ line: 0, character: offset }),
				offsetAt: (pos) => pos.character,
			}),
			closeDocument: async () => {},
			getOpenDocuments: () => [],
			getActiveEditorContext: () => ({
				filePath: "/test.ts",
				selectedText: "test",
				startLine: 0,
				endLine: 1,
				diagnostics: [],
			}),
			getOpenedTabs: () => [{ path: "/test.ts", label: "test.ts", isActive: true }],
			applyEdit: async () => true,
			showDiff: async () => {},
			getDiagnostics: () => [],
		}

		const doc = await mockEditor.openDocument("/test.ts")
		expect(doc.path).toBe("/test.ts")
		expect(doc.languageId).toBe("typescript")

		const context = mockEditor.getActiveEditorContext()
		expect(context?.filePath).toBe("/test.ts")

		const tabs = mockEditor.getOpenedTabs()
		expect(tabs).toHaveLength(1)
	})

	it("should verify text edit operations", async () => {
		let editApplied = false

		const mockEditor: IEditor = {
			openDocument: async () => ({}) as IDocument,
			closeDocument: async () => {},
			getOpenDocuments: () => [],
			getActiveEditorContext: () => null,
			getOpenedTabs: () => [],
			applyEdit: async (path, edits) => {
				editApplied = true
				expect(edits).toHaveLength(1)
				expect(edits[0]?.newText).toBe("const")
				return true
			},
			showDiff: async () => {},
			getDiagnostics: () => [],
		}

		const edits: ITextEdit[] = [
			{
				range: {
					start: { line: 0, character: 0 },
					end: { line: 0, character: 3 },
				},
				newText: "const",
			},
		]

		const result = await mockEditor.applyEdit("/test.ts", edits)
		expect(result).toBe(true)
		expect(editApplied).toBe(true)
	})

	it("should verify diagnostics", () => {
		const diagnostics: IDiagnostic[] = [
			{
				range: {
					start: { line: 5, character: 10 },
					end: { line: 5, character: 15 },
				},
				message: "Variable not used",
				severity: "warning",
				source: "typescript",
				code: 6133,
			},
		]

		const mockEditor: IEditor = {
			openDocument: async () => ({}) as IDocument,
			closeDocument: async () => {},
			getOpenDocuments: () => [],
			getActiveEditorContext: () => null,
			getOpenedTabs: () => [],
			applyEdit: async () => true,
			showDiff: async () => {},
			getDiagnostics: (path) => (path === "/test.ts" ? diagnostics : []),
		}

		const diags = mockEditor.getDiagnostics("/test.ts")
		expect(diags).toHaveLength(1)
		expect(diags[0]?.severity).toBe("warning")
	})
})
