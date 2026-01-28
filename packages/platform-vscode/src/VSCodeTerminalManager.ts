/**
 * VSCode implementation of ITerminalManager interface
 *
 * Note: This is a simplified initial implementation.
 * Full implementation will integrate with existing TerminalRegistry,
 * Terminal, ExecaTerminal, and TerminalProcess classes.
 */

import * as vscode from "vscode"
import type {
	ITerminalManager,
	ITerminal,
	ITerminalOptions,
	IExecuteOptions,
	ITerminalProcess,
	IDisposable,
} from "@roo-code/platform-interfaces"

/**
 * Simple terminal process implementation
 */
class SimpleTerminalProcess implements ITerminalProcess {
	private output = ""
	private unretrievedOutput = ""
	private outputCallbacks: Array<(data: string) => void> = []
	private exitCallbacks: Array<(exitCode: number) => void> = []

	constructor(
		public readonly id: string,
		public readonly command: string,
		public isRunning: boolean,
		public exitCode?: number,
	) {}

	getOutput(): string {
		return this.output
	}

	getUnretrievedOutput(): string {
		return this.unretrievedOutput
	}

	clearOutput(): void {
		this.output = ""
		this.unretrievedOutput = ""
	}

	async write(_data: string): Promise<void> {
		// TODO: Implement stdin writing
		throw new Error("Not implemented yet")
	}

	async kill(): Promise<void> {
		this.isRunning = false
		this.exitCode = 1
		this.notifyExit(1)
	}

	onOutput(callback: (data: string) => void): IDisposable {
		this.outputCallbacks.push(callback)
		return {
			dispose: () => {
				const index = this.outputCallbacks.indexOf(callback)
				if (index >= 0) {
					this.outputCallbacks.splice(index, 1)
				}
			},
		}
	}

	onExit(callback: (exitCode: number) => void): IDisposable {
		this.exitCallbacks.push(callback)
		return {
			dispose: () => {
				const index = this.exitCallbacks.indexOf(callback)
				if (index >= 0) {
					this.exitCallbacks.splice(index, 1)
				}
			},
		}
	}

	// Internal methods for managing output and exit
	addOutput(data: string): void {
		this.output += data
		this.unretrievedOutput += data
		for (const callback of this.outputCallbacks) {
			callback(data)
		}
	}

	notifyExit(exitCode: number): void {
		this.exitCode = exitCode
		this.isRunning = false
		for (const callback of this.exitCallbacks) {
			callback(exitCode)
		}
	}
}

/**
 * Simple terminal implementation
 */
class SimpleTerminal implements ITerminal {
	public isBusy = false
	private currentProcess?: SimpleTerminalProcess

	constructor(
		public readonly id: number,
		public readonly name: string,
		public cwd: string,
		private vsTerminal?: vscode.Terminal,
	) {}

	async execute(command: string, _options?: IExecuteOptions): Promise<ITerminalProcess> {
		this.isBusy = true

		// Create process
		const processId = `proc-${this.id}-${Date.now()}`
		const process = new SimpleTerminalProcess(processId, command, true)
		this.currentProcess = process

		// Send command to terminal if available
		if (this.vsTerminal) {
			this.vsTerminal.sendText(command, true)
			this.vsTerminal.show()
		}

		// Note: This is a simplified implementation.
		// Full implementation needs to:
		// 1. Capture terminal output using shell integration
		// 2. Detect when command completes
		// 3. Get exit code
		// For now, we simulate completion after a delay
		setTimeout(() => {
			process.notifyExit(0)
			this.isBusy = false
		}, 100)

		return process
	}

	show(): void {
		this.vsTerminal?.show()
	}

	hide(): void {
		this.vsTerminal?.hide()
	}

	dispose(): void {
		this.vsTerminal?.dispose()
	}

	getCurrentWorkingDirectory(): string {
		return this.cwd
	}
}

/**
 * VSCode implementation of ITerminalManager
 */
export class VSCodeTerminalManager implements ITerminalManager {
	private terminals: SimpleTerminal[] = []
	private nextId = 1
	private taskTerminals = new Map<string, number[]>()

	/**
	 * Create a new terminal
	 */
	async createTerminal(options?: ITerminalOptions): Promise<ITerminal> {
		const cwd = options?.cwd || process.cwd()
		const name = options?.name || `Terminal ${this.nextId}`

		// Create VSCode terminal
		const vsTerminal = vscode.window.createTerminal({
			name,
			cwd,
			env: options?.env,
			shellPath: options?.shell,
		})

		const terminal = new SimpleTerminal(this.nextId++, name, cwd, vsTerminal)
		this.terminals.push(terminal)

		return terminal
	}

	/**
	 * Get an existing terminal by ID
	 */
	getTerminal(id: number): ITerminal | undefined {
		return this.terminals.find((t) => t.id === id)
	}

	/**
	 * Get all active terminals
	 */
	getAllTerminals(): ITerminal[] {
		// Filter out disposed terminals
		this.terminals = this.terminals.filter((_t) => {
			// TODO: Add proper disposal check
			return true
		})
		return this.terminals
	}

	/**
	 * Get or create a terminal for a specific working directory
	 */
	async getOrCreateTerminal(cwd: string, taskId?: string): Promise<ITerminal> {
		// Try to find an existing terminal for this cwd
		const existing = this.terminals.find((t) => !t.isBusy && t.cwd === cwd)

		if (existing) {
			// Associate with task if provided
			if (taskId) {
				const terminalIds = this.taskTerminals.get(taskId) || []
				if (!terminalIds.includes(existing.id)) {
					terminalIds.push(existing.id)
					this.taskTerminals.set(taskId, terminalIds)
				}
			}
			return existing
		}

		// Create new terminal
		const terminal = await this.createTerminal({ cwd, name: `Terminal ${cwd}` })

		// Associate with task if provided
		if (taskId) {
			const terminalIds = this.taskTerminals.get(taskId) || []
			terminalIds.push(terminal.id)
			this.taskTerminals.set(taskId, terminalIds)
		}

		return terminal
	}

	/**
	 * Release all terminals associated with a task
	 */
	releaseTerminalsForTask(taskId: string): void {
		this.taskTerminals.delete(taskId)
	}

	/**
	 * Dispose of all terminals and clean up resources
	 */
	dispose(): void {
		for (const terminal of this.terminals) {
			terminal.dispose()
		}
		this.terminals = []
		this.taskTerminals.clear()
	}
}
