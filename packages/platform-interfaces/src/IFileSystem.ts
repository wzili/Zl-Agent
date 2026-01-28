/**
 * Platform-agnostic file system interfaces
 *
 * These interfaces provide an abstraction layer over different file system implementations
 * (VSCode's file system API, Node.js fs module, etc.)
 */

/**
 * Represents basic information about a file or directory
 */
export interface IFileInfo {
	/** Full path to the file or directory */
	path: string
	/** Name of the file or directory (basename) */
	name: string
	/** Type of the file system entry */
	type: "file" | "directory" | "symlink"
	/** Size in bytes (undefined for directories) */
	size?: number
	/** Last modification time */
	modifiedTime?: Date
	/** Creation time */
	createdTime?: Date
}

/**
 * Options for reading files
 */
export interface IReadFileOptions {
	/** Encoding to use when reading the file */
	encoding?: "utf8" | "base64" | "binary"
	/** Maximum number of lines to read (for large files) */
	maxLines?: number
	/** Starting line number (0-based) */
	startLine?: number
	/** Ending line number (0-based, exclusive) */
	endLine?: number
}

/**
 * Options for writing files
 */
export interface IWriteFileOptions {
	/** Create parent directories if they don't exist */
	createDirectories?: boolean
	/** Whether to overwrite existing files */
	overwrite?: boolean
}

/**
 * Options for glob pattern matching
 */
export interface IGlobOptions {
	/** Working directory for relative patterns */
	cwd?: string
	/** Patterns to exclude */
	ignore?: string[]
	/** Include dot files/directories */
	dot?: boolean
	/** Maximum depth for directory traversal */
	maxDepth?: number
	/** Follow symbolic links */
	followSymlinks?: boolean
}

/**
 * Options for searching files
 */
export interface ISearchOptions {
	/** File pattern to search within */
	filePattern?: string
	/** Case-sensitive search */
	caseSensitive?: boolean
	/** Use regular expression */
	useRegex?: boolean
	/** Maximum number of results */
	maxResults?: number
	/** Include context lines around matches */
	contextLines?: number
}

/**
 * Result from a file search
 */
export interface ISearchResult {
	/** Path to the file containing the match */
	path: string
	/** Line number of the match (0-based) */
	line: number
	/** Column number of the match (0-based) */
	column: number
	/** The matched text */
	matchText: string
	/** Full line containing the match */
	lineText: string
	/** Context lines before the match */
	beforeContext?: string[]
	/** Context lines after the match */
	afterContext?: string[]
}

/**
 * Represents a file system change event
 */
export interface IFileChangeEvent {
	/** Type of change */
	type: "created" | "changed" | "deleted"
	/** Path to the affected file or directory */
	path: string
}

/**
 * Represents a disposable resource that can be cleaned up
 */
export interface IDisposable {
	/** Dispose of the resource */
	dispose(): void
}

/**
 * Platform-agnostic file system interface
 *
 * Implementations should provide concrete implementations for different platforms:
 * - VSCode: Wrapping vscode.workspace.fs
 * - Node.js: Using fs/promises module
 * - Web: Using File System Access API or virtual file system
 */
export interface IFileSystem {
	// Read operations

	/**
	 * Read a file's contents
	 * @param path Path to the file
	 * @param options Read options
	 * @returns File contents as string or Buffer
	 */
	readFile(path: string, options?: IReadFileOptions): Promise<string | Buffer>

	/**
	 * Read a directory's contents
	 * @param path Path to the directory
	 * @returns Array of file information
	 */
	readDirectory(path: string): Promise<IFileInfo[]>

	/**
	 * Get information about a file or directory
	 * @param path Path to the file or directory
	 * @returns File information
	 */
	stat(path: string): Promise<IFileInfo>

	/**
	 * Check if a file or directory exists
	 * @param path Path to check
	 * @returns True if exists, false otherwise
	 */
	exists(path: string): Promise<boolean>

	// Write operations

	/**
	 * Write content to a file
	 * @param path Path to the file
	 * @param content Content to write
	 * @param options Write options
	 */
	writeFile(path: string, content: string | Buffer, options?: IWriteFileOptions): Promise<void>

	/**
	 * Create a directory
	 * @param path Path to the directory
	 * @param recursive Create parent directories if they don't exist
	 */
	createDirectory(path: string, recursive?: boolean): Promise<void>

	/**
	 * Delete a file or directory
	 * @param path Path to delete
	 * @param recursive Delete directories recursively
	 */
	delete(path: string, recursive?: boolean): Promise<void>

	/**
	 * Rename or move a file or directory
	 * @param oldPath Current path
	 * @param newPath New path
	 */
	rename(oldPath: string, newPath: string): Promise<void>

	/**
	 * Copy a file or directory
	 * @param source Source path
	 * @param destination Destination path
	 */
	copy(source: string, destination: string): Promise<void>

	// Watch operations

	/**
	 * Watch a file or directory for changes
	 * @param path Path to watch
	 * @param callback Callback invoked on changes
	 * @returns Disposable to stop watching
	 */
	watch(path: string, callback: (event: IFileChangeEvent) => void): IDisposable

	// Search operations

	/**
	 * Find files matching a glob pattern
	 * @param pattern Glob pattern
	 * @param options Glob options
	 * @returns Array of matching file paths
	 */
	glob(pattern: string, options?: IGlobOptions): Promise<string[]>

	/**
	 * Search for text within files
	 * @param pattern Search pattern
	 * @param options Search options
	 * @returns Array of search results
	 */
	search(pattern: string, options?: ISearchOptions): Promise<ISearchResult[]>
}
