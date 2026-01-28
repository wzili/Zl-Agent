/**
 * Basic tests to verify interface exports
 */

import { describe, it, expect } from "vitest"
import type {
	IFileSystem,
	ITerminalManager,
	ITerminal,
	IEditor,
	IDocument,
	IWorkspace,
	IConfiguration,
	IStorageProvider,
	IStorage,
	ISecretStorage,
} from "../index.js"

describe("Platform Interfaces", () => {
	describe("Type exports", () => {
		it("should export IFileSystem interface", () => {
			// Type-only test - verifies the interface exists and can be imported
			type _Test = IFileSystem
			expect(true).toBe(true)
		})

		it("should export ITerminalManager interface", () => {
			type _Test = ITerminalManager
			expect(true).toBe(true)
		})

		it("should export IEditor interface", () => {
			type _Test = IEditor
			expect(true).toBe(true)
		})

		it("should export IWorkspace interface", () => {
			type _Test = IWorkspace
			expect(true).toBe(true)
		})

		it("should export IConfiguration interface", () => {
			type _Test = IConfiguration
			expect(true).toBe(true)
		})

		it("should export IStorageProvider interface", () => {
			type _Test = IStorageProvider
			expect(true).toBe(true)
		})
	})

	describe("Interface structure", () => {
		it("should define IFileSystem with required methods", () => {
			// This is a compile-time check - if the interface is missing methods, TS will error
			const mockFileSystem: Partial<IFileSystem> = {
				readFile: async () => "",
				writeFile: async () => {},
				exists: async () => true,
			}
			expect(mockFileSystem).toBeDefined()
		})

		it("should define ITerminalManager with required methods", () => {
			const mockTerminalManager: Partial<ITerminalManager> = {
				createTerminal: async () => ({}) as ITerminal,
				getAllTerminals: () => [],
			}
			expect(mockTerminalManager).toBeDefined()
		})

		it("should define IEditor with required methods", () => {
			const mockEditor: Partial<IEditor> = {
				openDocument: async () => ({}) as IDocument,
				getOpenDocuments: () => [],
			}
			expect(mockEditor).toBeDefined()
		})

		it("should define IWorkspace with required methods", () => {
			const mockWorkspace: Partial<IWorkspace> = {
				getWorkspaceFolders: () => [],
				getRootPath: () => undefined,
			}
			expect(mockWorkspace).toBeDefined()
		})

		it("should define IConfiguration with required methods", () => {
			const mockConfiguration: Partial<IConfiguration> = {
				get: <T>(section: string, defaultValue?: T): T => defaultValue as T,
				update: async () => {},
				has: () => false,
			}
			expect(mockConfiguration).toBeDefined()
		})

		it("should define IStorageProvider with required properties", () => {
			const mockStorageProvider: Partial<IStorageProvider> = {
				globalState: {} as IStorage,
				workspaceState: {} as IStorage,
				secrets: {} as ISecretStorage,
			}
			expect(mockStorageProvider).toBeDefined()
		})
	})
})
