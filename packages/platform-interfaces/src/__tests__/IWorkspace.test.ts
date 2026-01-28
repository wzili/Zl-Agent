/**
 * IWorkspace interface contract tests
 */

import { describe, it, expect } from "vitest"
import type { IWorkspace, IWorkspaceFolder, IWorkspaceFoldersChangeEvent } from "../index.js"

describe("IWorkspace Contract", () => {
	it("should allow implementing IWorkspace with all required methods", () => {
		const folders: IWorkspaceFolder[] = [
			{ name: "project", path: "/path/to/project", index: 0 },
			{ name: "lib", path: "/path/to/lib", index: 1 },
		]

		const mockWorkspace: IWorkspace = {
			getWorkspaceFolders: () => folders,
			getRootPath: () => "/path/to/project",
			getWorkspaceFiles: async (_maxFiles) => ["/file1.ts", "/file2.ts"],
			onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
			onDidCreateFile: () => ({ dispose: () => {} }),
			onDidDeleteFile: () => ({ dispose: () => {} }),
			onDidChangeFile: () => ({ dispose: () => {} }),
		}

		const workspaceFolders = mockWorkspace.getWorkspaceFolders()
		expect(workspaceFolders).toHaveLength(2)
		expect(workspaceFolders[0]?.name).toBe("project")

		const rootPath = mockWorkspace.getRootPath()
		expect(rootPath).toBe("/path/to/project")
	})

	it("should verify workspace folder change events", () => {
		let eventFired = false

		const mockWorkspace: IWorkspace = {
			getWorkspaceFolders: () => [],
			getRootPath: () => undefined,
			getWorkspaceFiles: async () => [],
			onDidChangeWorkspaceFolders: (callback) => {
				const event: IWorkspaceFoldersChangeEvent = {
					added: [{ name: "new", path: "/new", index: 0 }],
					removed: [],
				}
				callback(event)
				eventFired = true
				return { dispose: () => {} }
			},
			onDidCreateFile: () => ({ dispose: () => {} }),
			onDidDeleteFile: () => ({ dispose: () => {} }),
			onDidChangeFile: () => ({ dispose: () => {} }),
		}

		mockWorkspace.onDidChangeWorkspaceFolders((event) => {
			expect(event.added).toHaveLength(1)
			expect(event.added[0]?.name).toBe("new")
		})

		expect(eventFired).toBe(true)
	})

	it("should verify file change events", () => {
		let createCalled = false
		let deleteCalled = false
		let changeCalled = false

		const mockWorkspace: IWorkspace = {
			getWorkspaceFolders: () => [],
			getRootPath: () => undefined,
			getWorkspaceFiles: async () => [],
			onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
			onDidCreateFile: (callback) => {
				callback("/new-file.ts")
				createCalled = true
				return { dispose: () => {} }
			},
			onDidDeleteFile: (callback) => {
				callback("/deleted-file.ts")
				deleteCalled = true
				return { dispose: () => {} }
			},
			onDidChangeFile: (callback) => {
				callback("/changed-file.ts")
				changeCalled = true
				return { dispose: () => {} }
			},
		}

		mockWorkspace.onDidCreateFile((path) => {
			expect(path).toBe("/new-file.ts")
		})

		mockWorkspace.onDidDeleteFile((path) => {
			expect(path).toBe("/deleted-file.ts")
		})

		mockWorkspace.onDidChangeFile((path) => {
			expect(path).toBe("/changed-file.ts")
		})

		expect(createCalled).toBe(true)
		expect(deleteCalled).toBe(true)
		expect(changeCalled).toBe(true)
	})

	it("should verify workspace file listing", async () => {
		const mockWorkspace: IWorkspace = {
			getWorkspaceFolders: () => [],
			getRootPath: () => "/project",
			getWorkspaceFiles: async (maxFiles) => {
				const allFiles = ["/file1.ts", "/file2.ts", "/file3.ts", "/file4.ts"]
				return maxFiles ? allFiles.slice(0, maxFiles) : allFiles
			},
			onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
			onDidCreateFile: () => ({ dispose: () => {} }),
			onDidDeleteFile: () => ({ dispose: () => {} }),
			onDidChangeFile: () => ({ dispose: () => {} }),
		}

		const allFiles = await mockWorkspace.getWorkspaceFiles()
		expect(allFiles).toHaveLength(4)

		const limitedFiles = await mockWorkspace.getWorkspaceFiles(2)
		expect(limitedFiles).toHaveLength(2)
	})
})
