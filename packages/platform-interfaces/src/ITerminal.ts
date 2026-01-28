/**
 * Platform-agnostic terminal interfaces
 *
 * These interfaces provide an abstraction layer over different terminal implementations
 * (VSCode's terminal API, Node.js child_process/node-pty, etc.)
 */

import type { IDisposable } from "./IFileSystem.js"

/**
 * Options for creating a terminal
 */
export interface ITerminalOptions {
	/** Name of the terminal (displayed in UI) */
	name?: string
	/** Working directory for the terminal */
	cwd?: string
	/** Environment variables */
	env?: Record<string, string>
	/** Shell executable path */
	shell?: string
}

/**
 * Options for executing commands
 */
export interface IExecuteOptions {
	/** Timeout in milliseconds */
	timeout?: number
	/** Kill signal to use on timeout */
	killSignal?: string
	/** Environment variables for this execution */
	env?: Record<string, string>
}

/**
 * Represents a running terminal process/command
 */
export interface ITerminalProcess {
	/** Unique identifier for this process */
	id: string
	/** Command that was executed */
	command: string
	/** Whether the process is currently running */
	isRunning: boolean
	/** Exit code (undefined if still running) */
	exitCode?: number

	// Output management

	/**
	 * Get all output accumulated so far
	 * @returns Complete output as string
	 */
	getOutput(): string

	/**
	 * Get output that hasn't been retrieved yet
	 * @returns Unretrieved output as string
	 */
	getUnretrievedOutput(): string

	/**
	 * Clear the accumulated output
	 */
	clearOutput(): void

	// Control

	/**
	 * Write data to the process stdin
	 * @param data Data to write
	 */
	write(data: string): Promise<void>

	/**
	 * Kill the process
	 */
	kill(): Promise<void>

	// Events

	/**
	 * Register a callback for output events
	 * @param callback Function to call when output is received
	 * @returns Disposable to unregister the callback
	 */
	onOutput(callback: (data: string) => void): IDisposable

	/**
	 * Register a callback for process exit
	 * @param callback Function to call when process exits
	 * @returns Disposable to unregister the callback
	 */
	onExit(callback: (exitCode: number) => void): IDisposable
}

/**
 * Represents a terminal instance
 */
export interface ITerminal {
	/** Unique identifier for this terminal */
	id: number
	/** Name of the terminal */
	name: string
	/** Current working directory */
	cwd: string
	/** Whether the terminal is currently busy (has running process) */
	isBusy: boolean

	// Execute commands

	/**
	 * Execute a command in this terminal
	 * @param command Command to execute
	 * @param options Execution options
	 * @returns Process handle
	 */
	execute(command: string, options?: IExecuteOptions): Promise<ITerminalProcess>

	// Terminal control

	/**
	 * Show the terminal in the UI
	 */
	show(): void

	/**
	 * Hide the terminal from the UI
	 */
	hide(): void

	/**
	 * Dispose of this terminal (closes it)
	 */
	dispose(): void

	// Current state

	/**
	 * Get the current working directory
	 * @returns Current working directory path
	 */
	getCurrentWorkingDirectory(): string
}

/**
 * Terminal manager for creating and managing terminal instances
 */
export interface ITerminalManager {
	// Terminal management

	/**
	 * Create a new terminal
	 * @param options Terminal creation options
	 * @returns New terminal instance
	 */
	createTerminal(options?: ITerminalOptions): Promise<ITerminal>

	/**
	 * Get an existing terminal by ID
	 * @param id Terminal ID
	 * @returns Terminal instance or undefined if not found
	 */
	getTerminal(id: number): ITerminal | undefined

	/**
	 * Get all active terminals
	 * @returns Array of all terminal instances
	 */
	getAllTerminals(): ITerminal[]

	/**
	 * Get or create a terminal for a specific working directory
	 * Reuses existing terminal if one exists for the same directory
	 * @param cwd Working directory
	 * @param taskId Optional task ID for tracking
	 * @returns Terminal instance
	 */
	getOrCreateTerminal(cwd: string, taskId?: string): Promise<ITerminal>

	// Cleanup

	/**
	 * Release all terminals associated with a task
	 * @param taskId Task ID
	 */
	releaseTerminalsForTask(taskId: string): void

	/**
	 * Dispose of all terminals and clean up resources
	 */
	dispose(): void
}
