/**
 * Platform-agnostic storage interfaces
 *
 * These interfaces provide an abstraction layer over different storage implementations
 * (VSCode's globalState/workspaceState/secrets, file-based storage, database, etc.)
 */

/**
 * Key-value storage interface for non-sensitive data
 */
export interface IStorage {
	/**
	 * Get a value from storage
	 * @param key Storage key
	 * @returns Value or undefined if not found
	 */
	get<T>(key: string): T | undefined

	/**
	 * Set a value in storage
	 * @param key Storage key
	 * @param value Value to store
	 */
	set<T>(key: string, value: T): Promise<void>

	/**
	 * Delete a value from storage
	 * @param key Storage key
	 */
	delete(key: string): Promise<void>

	/**
	 * Get all storage keys
	 * @returns Array of all keys
	 */
	keys(): string[]
}

/**
 * Secret storage interface for sensitive data
 *
 * Implementations should use secure storage mechanisms:
 * - VSCode: Built-in secrets API
 * - Node.js: System keychain (e.g., keytar)
 * - Web: Encrypted local storage or session storage
 */
export interface ISecretStorage {
	/**
	 * Get a secret value
	 * @param key Secret key
	 * @returns Secret value or undefined if not found
	 */
	get(key: string): Promise<string | undefined>

	/**
	 * Store a secret value
	 * @param key Secret key
	 * @param value Secret value
	 */
	store(key: string, value: string): Promise<void>

	/**
	 * Delete a secret value
	 * @param key Secret key
	 */
	delete(key: string): Promise<void>
}

/**
 * Storage provider that combines different storage types
 *
 * Provides access to:
 * - Global state: Persisted across all workspaces (user-level)
 * - Workspace state: Persisted per workspace
 * - Secrets: Secure storage for sensitive data
 */
export interface IStorageProvider {
	/**
	 * Global/user-level storage
	 * Persists across all workspaces and sessions
	 */
	globalState: IStorage

	/**
	 * Workspace-level storage
	 * Persists only for the current workspace
	 */
	workspaceState: IStorage

	/**
	 * Secure storage for secrets
	 * Encrypts sensitive data like API keys and tokens
	 */
	secrets: ISecretStorage
}
