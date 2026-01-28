/**
 * Platform-agnostic configuration interfaces
 *
 * These interfaces provide an abstraction layer over different configuration storage implementations
 * (VSCode's configuration API, JSON/YAML files, etc.)
 */

import type { IDisposable } from "./IFileSystem.js"

/**
 * Represents detailed information about a configuration value
 */
export interface IConfigurationInspect<T> {
	/** Configuration key */
	key: string
	/** Default value */
	defaultValue?: T
	/** Global/user-level value */
	globalValue?: T
	/** Workspace-level value */
	workspaceValue?: T
}

/**
 * Event fired when configuration changes
 */
export interface IConfigurationChangeEvent {
	/**
	 * Check if a specific configuration section was affected
	 * @param section Configuration section to check
	 * @returns True if the section was affected
	 */
	affectsConfiguration(section: string): boolean
}

/**
 * Platform-agnostic configuration interface
 *
 * Implementations should provide concrete implementations for different platforms:
 * - VSCode: Wrapping vscode.workspace.getConfiguration()
 * - Node.js: Using JSON/YAML configuration files
 * - Web: Using localStorage or remote configuration
 */
export interface IConfiguration {
	// Get configuration value

	/**
	 * Get a configuration value
	 * @param section Configuration section/key
	 * @param defaultValue Default value if not found
	 * @returns Configuration value or default
	 */
	get<T>(section: string, defaultValue?: T): T

	// Update configuration

	/**
	 * Update a configuration value
	 * @param section Configuration section/key
	 * @param value Value to set
	 * @param global Whether to update global/user configuration (vs workspace)
	 */
	update(section: string, value: unknown, global?: boolean): Promise<void>

	// Check if configuration exists

	/**
	 * Check if a configuration section exists
	 * @param section Configuration section to check
	 * @returns True if exists, false otherwise
	 */
	has(section: string): boolean

	// Get all configuration for a section

	/**
	 * Get detailed information about a configuration value
	 * @param section Configuration section to inspect
	 * @returns Configuration details or undefined
	 */
	inspect<T>(section: string): IConfigurationInspect<T> | undefined

	// Change events

	/**
	 * Register a callback for configuration changes
	 * @param callback Function to call when configuration changes
	 * @returns Disposable to unregister the callback
	 */
	onDidChangeConfiguration(callback: (event: IConfigurationChangeEvent) => void): IDisposable
}
