/**
 * IFileSystem interface contract tests
 *
 * These tests verify that the IFileSystem interface is properly defined
 * and can be implemented by different platform implementations.
 */

import { describe, it, expect } from "vitest"
import type {
	IFileSystem,
	IFileInfo,
	IReadFileOptions,
	IWriteFileOptions,
	IGlobOptions,
	ISearchOptions,
	ISearchResult,
	IFileChangeEvent,
	IDisposable,
} from "../index.js"

describe("IFileSystem Contract", () => {
	describe("Type definitions", () => {
		it("should define IFileInfo type correctly", () => {
			const fileInfo: IFileInfo = {
				path: "/test/file.txt",
				name: "file.txt",
				type: "file",
				size: 1024,
				modifiedTime: new Date(),
				createdTime: new Date(),
			}
			expect(fileInfo.path).toBe("/test/file.txt")
			expect(fileInfo.type).toBe("file")
		})

		it("should define IReadFileOptions type correctly", () => {
			const options: IReadFileOptions = {
				encoding: "utf8",
				maxLines: 100,
				startLine: 0,
				endLine: 50,
			}
			expect(options.encoding).toBe("utf8")
		})

		it("should define IWriteFileOptions type correctly", () => {
			const options: IWriteFileOptions = {
				createDirectories: true,
				overwrite: true,
			}
			expect(options.createDirectories).toBe(true)
		})

		it("should define IGlobOptions type correctly", () => {
			const options: IGlobOptions = {
				cwd: "/test",
				ignore: ["node_modules/**"],
				dot: false,
				maxDepth: 5,
				followSymlinks: false,
			}
			expect(options.cwd).toBe("/test")
		})

		it("should define ISearchOptions type correctly", () => {
			const options: ISearchOptions = {
				filePattern: "*.ts",
				caseSensitive: true,
				useRegex: false,
				maxResults: 100,
				contextLines: 3,
			}
			expect(options.filePattern).toBe("*.ts")
		})

		it("should define ISearchResult type correctly", () => {
			const result: ISearchResult = {
				path: "/test/file.ts",
				line: 10,
				column: 5,
				matchText: "function",
				lineText: "function test() {",
				beforeContext: ["// Before"],
				afterContext: ["// After"],
			}
			expect(result.path).toBe("/test/file.ts")
		})

		it("should define IFileChangeEvent type correctly", () => {
			const event: IFileChangeEvent = {
				type: "created",
				path: "/test/newfile.txt",
			}
			expect(event.type).toBe("created")
		})

		it("should define IDisposable type correctly", () => {
			const disposable: IDisposable = {
				dispose: () => {
					// cleanup
				},
			}
			expect(disposable.dispose).toBeDefined()
		})
	})

	describe("Interface implementation", () => {
		it("should allow implementing IFileSystem with all required methods", () => {
			class MockFileSystem implements IFileSystem {
				async readFile(path: string, _options?: IReadFileOptions): Promise<string | Buffer> {
					return `Content of ${path}`
				}

				async readDirectory(_path: string): Promise<IFileInfo[]> {
					return []
				}

				async stat(path: string): Promise<IFileInfo> {
					return {
						path,
						name: "test.txt",
						type: "file",
						size: 0,
					}
				}

				async exists(_path: string): Promise<boolean> {
					return true
				}

				async writeFile(_path: string, _content: string | Buffer, _options?: IWriteFileOptions): Promise<void> {
					// Mock implementation
				}

				async createDirectory(_path: string, _recursive?: boolean): Promise<void> {
					// Mock implementation
				}

				async delete(_path: string, _recursive?: boolean): Promise<void> {
					// Mock implementation
				}

				async rename(_oldPath: string, _newPath: string): Promise<void> {
					// Mock implementation
				}

				async copy(_source: string, _destination: string): Promise<void> {
					// Mock implementation
				}

				watch(_path: string, _callback: (event: IFileChangeEvent) => void): IDisposable {
					return { dispose: () => {} }
				}

				async glob(_pattern: string, _options?: IGlobOptions): Promise<string[]> {
					return []
				}

				async search(_pattern: string, _options?: ISearchOptions): Promise<ISearchResult[]> {
					return []
				}
			}

			const fs = new MockFileSystem()
			expect(fs).toBeDefined()
			expect(fs.readFile).toBeDefined()
			expect(fs.writeFile).toBeDefined()
			expect(fs.exists).toBeDefined()
		})

		it("should verify read operations contract", async () => {
			const mockFs: IFileSystem = {
				readFile: async (_path: string) => "test content",
				readDirectory: async (_path: string) => [{ path: "/test/file.txt", name: "file.txt", type: "file" }],
				stat: async (path: string) => ({
					path,
					name: "test.txt",
					type: "file",
					size: 100,
				}),
				exists: async (_path: string) => true,
				writeFile: async () => {},
				createDirectory: async () => {},
				delete: async () => {},
				rename: async () => {},
				copy: async () => {},
				watch: () => ({ dispose: () => {} }),
				glob: async () => [],
				search: async () => [],
			}

			const content = await mockFs.readFile("/test.txt")
			expect(content).toBe("test content")

			const files = await mockFs.readDirectory("/")
			expect(files).toHaveLength(1)

			const exists = await mockFs.exists("/test.txt")
			expect(exists).toBe(true)
		})

		it("should verify write operations contract", async () => {
			let written = false
			let created = false

			const mockFs: IFileSystem = {
				readFile: async () => "",
				readDirectory: async () => [],
				stat: async (path) => ({ path, name: "", type: "file" }),
				exists: async () => true,
				writeFile: async (_path, _content, _options) => {
					written = true
				},
				createDirectory: async (_path, _recursive) => {
					created = true
				},
				delete: async () => {},
				rename: async () => {},
				copy: async () => {},
				watch: () => ({ dispose: () => {} }),
				glob: async () => [],
				search: async () => [],
			}

			await mockFs.writeFile("/test.txt", "content")
			expect(written).toBe(true)

			await mockFs.createDirectory("/test/dir", true)
			expect(created).toBe(true)
		})

		it("should verify watch operations contract", () => {
			let callbackCalled = false
			let disposed = false

			const mockFs: IFileSystem = {
				readFile: async () => "",
				readDirectory: async () => [],
				stat: async (path) => ({ path, name: "", type: "file" }),
				exists: async () => true,
				writeFile: async () => {},
				createDirectory: async () => {},
				delete: async () => {},
				rename: async () => {},
				copy: async () => {},
				watch: (path, callback) => {
					// Simulate a file change
					callback({ type: "changed", path })
					callbackCalled = true

					return {
						dispose: () => {
							disposed = true
						},
					}
				},
				glob: async () => [],
				search: async () => [],
			}

			const disposable = mockFs.watch("/test", (event) => {
				expect(event.type).toBe("changed")
			})

			expect(callbackCalled).toBe(true)

			disposable.dispose()
			expect(disposed).toBe(true)
		})

		it("should verify search operations contract", async () => {
			const mockFs: IFileSystem = {
				readFile: async () => "",
				readDirectory: async () => [],
				stat: async (path) => ({ path, name: "", type: "file" }),
				exists: async () => true,
				writeFile: async () => {},
				createDirectory: async () => {},
				delete: async () => {},
				rename: async () => {},
				copy: async () => {},
				watch: () => ({ dispose: () => {} }),
				glob: async (_pattern, _options) => ["/test/file1.ts", "/test/file2.ts"],
				search: async (_pattern, _options) => [
					{
						path: "/test/file.ts",
						line: 5,
						column: 10,
						matchText: "test",
						lineText: "const test = true",
					},
				],
			}

			const globResults = await mockFs.glob("**/*.ts")
			expect(globResults).toHaveLength(2)

			const searchResults = await mockFs.search("test")
			expect(searchResults).toHaveLength(1)
			expect(searchResults[0]?.matchText).toBe("test")
		})
	})
})
