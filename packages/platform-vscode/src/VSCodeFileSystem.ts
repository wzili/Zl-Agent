/**
 * VSCode implementation of IFileSystem interface
 */

import * as vscode from "vscode"
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
} from "@roo-code/platform-interfaces"

export class VSCodeFileSystem implements IFileSystem {
	private watchers = new Map<string, vscode.FileSystemWatcher>()

	/**
	 * Read a file's contents
	 */
	async readFile(path: string, options?: IReadFileOptions): Promise<string | Buffer> {
		const uri = vscode.Uri.file(path)
		// @ts-expect-error - workspace.fs requires VSCode 1.37+
		const data = await vscode.workspace.fs.readFile(uri)

		if (options?.encoding === "base64") {
			return Buffer.from(data).toString("base64")
		} else if (options?.encoding === "binary") {
			return Buffer.from(data)
		}

		// Default to utf8
		let content = Buffer.from(data).toString("utf8")

		// Handle line-based reading
		if (options?.maxLines !== undefined || options?.startLine !== undefined || options?.endLine !== undefined) {
			const lines = content.split("\n")
			const start = options.startLine ?? 0
			const end = options.endLine ?? (options.maxLines ? start + options.maxLines : lines.length)
			content = lines.slice(start, end).join("\n")
		}

		return content
	}

	/**
	 * Read a directory's contents
	 */
	async readDirectory(path: string): Promise<IFileInfo[]> {
		const uri = vscode.Uri.file(path)
		// @ts-expect-error - workspace.fs requires VSCode 1.37+
		const entries = await vscode.workspace.fs.readDirectory(uri)

		const fileInfos: IFileInfo[] = []
		for (const [name, type] of entries) {
			const entryPath = `${path}/${name}`
			const entryUri = vscode.Uri.file(entryPath)

			try {
				// @ts-expect-error - workspace.fs requires VSCode 1.37+
				const stat = await vscode.workspace.fs.stat(entryUri)
				fileInfos.push({
					path: entryPath,
					name,
					type:
						type === vscode.FileType.File
							? "file"
							: type === vscode.FileType.Directory
								? "directory"
								: "symlink",
					size: type === vscode.FileType.File ? stat.size : undefined,
					modifiedTime: new Date(stat.mtime),
					createdTime: new Date(stat.ctime),
				})
			} catch {
				// Skip entries that can't be stat'd
			}
		}

		return fileInfos
	}

	/**
	 * Get information about a file or directory
	 */
	async stat(path: string): Promise<IFileInfo> {
		const uri = vscode.Uri.file(path)
		// @ts-expect-error - workspace.fs requires VSCode 1.37+
		const stat = await vscode.workspace.fs.stat(uri)

		const basename = path.split("/").pop() || path

		return {
			path,
			name: basename,
			type:
				stat.type === vscode.FileType.File
					? "file"
					: stat.type === vscode.FileType.Directory
						? "directory"
						: "symlink",
			size: stat.type === vscode.FileType.File ? stat.size : undefined,
			modifiedTime: new Date(stat.mtime),
			createdTime: new Date(stat.ctime),
		}
	}

	/**
	 * Check if a file or directory exists
	 */
	async exists(path: string): Promise<boolean> {
		try {
			const uri = vscode.Uri.file(path)
			// @ts-expect-error - workspace.fs requires VSCode 1.37+
			await vscode.workspace.fs.stat(uri)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Write content to a file
	 */
	async writeFile(path: string, content: string | Buffer, options?: IWriteFileOptions): Promise<void> {
		const uri = vscode.Uri.file(path)

		// Create parent directories if needed
		if (options?.createDirectories) {
			const dirPath = path.substring(0, path.lastIndexOf("/"))
			if (dirPath) {
				await this.createDirectory(dirPath, true)
			}
		}

		const data = typeof content === "string" ? Buffer.from(content, "utf8") : content

		try {
			// @ts-expect-error - workspace.fs requires VSCode 1.37+
			await vscode.workspace.fs.writeFile(uri, data)
		} catch (error) {
			if (!options?.overwrite) {
				throw error
			}
			// If overwrite is true, try again (the error might have been due to file not existing)
			// @ts-expect-error - workspace.fs requires VSCode 1.37+
			await vscode.workspace.fs.writeFile(uri, data)
		}
	}

	/**
	 * Create a directory
	 */
	async createDirectory(path: string, recursive?: boolean): Promise<void> {
		const uri = vscode.Uri.file(path)

		if (recursive) {
			// Create all parent directories
			const parts = path.split("/")
			let currentPath = ""
			for (const part of parts) {
				if (!part) continue
				currentPath += "/" + part
				const currentUri = vscode.Uri.file(currentPath)
				try {
					// @ts-expect-error - workspace.fs requires VSCode 1.37+
					await vscode.workspace.fs.createDirectory(currentUri)
				} catch {
					// Directory might already exist, that's okay
				}
			}
		} else {
			// @ts-expect-error - workspace.fs requires VSCode 1.37+
			await vscode.workspace.fs.createDirectory(uri)
		}
	}

	/**
	 * Delete a file or directory
	 */
	async delete(path: string, recursive?: boolean): Promise<void> {
		const uri = vscode.Uri.file(path)
		// @ts-expect-error - workspace.fs requires VSCode 1.37+
		await vscode.workspace.fs.delete(uri, { recursive: recursive ?? false, useTrash: false })
	}

	/**
	 * Rename or move a file or directory
	 */
	async rename(oldPath: string, newPath: string): Promise<void> {
		const oldUri = vscode.Uri.file(oldPath)
		const newUri = vscode.Uri.file(newPath)
		// @ts-expect-error - workspace.fs requires VSCode 1.37+
		await vscode.workspace.fs.rename(oldUri, newUri, { overwrite: false })
	}

	/**
	 * Copy a file or directory
	 */
	async copy(source: string, destination: string): Promise<void> {
		const sourceUri = vscode.Uri.file(source)
		const destUri = vscode.Uri.file(destination)
		// @ts-expect-error - workspace.fs requires VSCode 1.37+
		await vscode.workspace.fs.copy(sourceUri, destUri, { overwrite: false })
	}

	/**
	 * Watch a file or directory for changes
	 */
	watch(path: string, callback: (event: IFileChangeEvent) => void): IDisposable {
		const watcher = vscode.workspace.createFileSystemWatcher(path)

		const onCreateDisposable = watcher.onDidCreate((uri) => {
			callback({ type: "created", path: uri.fsPath })
		})

		const onChangeDisposable = watcher.onDidChange((uri) => {
			callback({ type: "changed", path: uri.fsPath })
		})

		const onDeleteDisposable = watcher.onDidDelete((uri) => {
			callback({ type: "deleted", path: uri.fsPath })
		})

		this.watchers.set(path, watcher)

		return {
			dispose: () => {
				onCreateDisposable.dispose()
				onChangeDisposable.dispose()
				onDeleteDisposable.dispose()
				watcher.dispose()
				this.watchers.delete(path)
			},
		}
	}

	/**
	 * Find files matching a glob pattern
	 */
	async glob(pattern: string, options?: IGlobOptions): Promise<string[]> {
		const excludePattern = options?.ignore?.join(",") || undefined
		const maxResults = options?.maxDepth ? undefined : 10000

		const uris = await vscode.workspace.findFiles(pattern, excludePattern, maxResults)
		return uris.map((uri) => uri.fsPath)
	}

	/**
	 * Search for text within files
	 */
	async search(pattern: string, options?: ISearchOptions): Promise<ISearchResult[]> {
		const results: ISearchResult[] = []

		// Get files to search
		const filePattern = options?.filePattern || "**/*"
		const files = await this.glob(filePattern)

		// Limit results
		const maxResults = options?.maxResults ?? 1000
		const useRegex = options?.useRegex ?? false
		const caseSensitive = options?.caseSensitive ?? false

		let searchRegex: RegExp
		if (useRegex) {
			searchRegex = new RegExp(pattern, caseSensitive ? "g" : "gi")
		} else {
			const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
			searchRegex = new RegExp(escaped, caseSensitive ? "g" : "gi")
		}

		for (const file of files) {
			if (results.length >= maxResults) break

			try {
				const content = (await this.readFile(file)) as string
				const lines = content.split("\n")

				for (let i = 0; i < lines.length; i++) {
					if (results.length >= maxResults) break

					const line = lines[i]
					if (!line) continue

					const matches = line.matchAll(searchRegex)
					for (const match of matches) {
						if (results.length >= maxResults) break

						const contextLines = options?.contextLines ?? 0
						const beforeContext =
							contextLines > 0
								? lines.slice(Math.max(0, i - contextLines), i).filter((l) => l !== undefined)
								: undefined
						const afterContext =
							contextLines > 0
								? lines.slice(i + 1, i + 1 + contextLines).filter((l) => l !== undefined)
								: undefined

						results.push({
							path: file,
							line: i,
							column: match.index ?? 0,
							matchText: match[0] ?? "",
							lineText: line,
							beforeContext,
							afterContext,
						})
					}
				}
			} catch {
				// Skip files that can't be read
			}
		}

		return results
	}

	/**
	 * Dispose of all resources
	 */
	dispose(): void {
		for (const watcher of this.watchers.values()) {
			watcher.dispose()
		}
		this.watchers.clear()
	}
}
