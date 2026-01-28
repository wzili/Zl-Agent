/**
 * ITerminal and ITerminalManager interface contract tests
 *
 * These tests verify that the terminal interfaces are properly defined
 * and can be implemented by different platform implementations.
 */

import { describe, it, expect } from "vitest"
import type {
	ITerminal,
	ITerminalManager,
	ITerminalOptions,
	IExecuteOptions,
	ITerminalProcess,
	IDisposable,
} from "../index.js"

describe("ITerminal Contract", () => {
	describe("Type definitions", () => {
		it("should define ITerminalOptions type correctly", () => {
			const options: ITerminalOptions = {
				name: "Test Terminal",
				cwd: "/test/path",
				env: { PATH: "/usr/bin" },
				shell: "/bin/bash",
			}
			expect(options.name).toBe("Test Terminal")
			expect(options.cwd).toBe("/test/path")
		})

		it("should define IExecuteOptions type correctly", () => {
			const options: IExecuteOptions = {
				timeout: 5000,
				killSignal: "SIGTERM",
				env: { NODE_ENV: "test" },
			}
			expect(options.timeout).toBe(5000)
		})
	})

	describe("ITerminalProcess Contract", () => {
		it("should allow implementing ITerminalProcess with all required properties and methods", () => {
			class MockTerminalProcess implements ITerminalProcess {
				id = "proc-123"
				command = "npm test"
				isRunning = true
				exitCode: number | undefined = undefined

				getOutput(): string {
					return "test output"
				}

				getUnretrievedOutput(): string {
					return "new output"
				}

				clearOutput(): void {
					// Mock implementation
				}

				async write(_data: string): Promise<void> {
					// Mock implementation
				}

				async kill(): Promise<void> {
					this.isRunning = false
					this.exitCode = 1
				}

				onOutput(_callback: (data: string) => void): IDisposable {
					return { dispose: () => {} }
				}

				onExit(_callback: (exitCode: number) => void): IDisposable {
					return { dispose: () => {} }
				}
			}

			const process = new MockTerminalProcess()
			expect(process.id).toBe("proc-123")
			expect(process.command).toBe("npm test")
			expect(process.isRunning).toBe(true)
		})

		it("should verify process output management", () => {
			const mockProcess: ITerminalProcess = {
				id: "proc-1",
				command: "echo test",
				isRunning: false,
				exitCode: 0,
				getOutput: () => "full output",
				getUnretrievedOutput: () => "new output",
				clearOutput: () => {},
				write: async () => {},
				kill: async () => {},
				onOutput: () => ({ dispose: () => {} }),
				onExit: () => ({ dispose: () => {} }),
			}

			expect(mockProcess.getOutput()).toBe("full output")
			expect(mockProcess.getUnretrievedOutput()).toBe("new output")
		})

		it("should verify process event handling", () => {
			let outputReceived = false
			let exitReceived = false

			const mockProcess: ITerminalProcess = {
				id: "proc-1",
				command: "test",
				isRunning: true,
				getOutput: () => "",
				getUnretrievedOutput: () => "",
				clearOutput: () => {},
				write: async () => {},
				kill: async () => {},
				onOutput: (callback) => {
					callback("test output")
					outputReceived = true
					return { dispose: () => {} }
				},
				onExit: (callback) => {
					callback(0)
					exitReceived = true
					return { dispose: () => {} }
				},
			}

			mockProcess.onOutput((data) => {
				expect(data).toBe("test output")
			})

			mockProcess.onExit((code) => {
				expect(code).toBe(0)
			})

			expect(outputReceived).toBe(true)
			expect(exitReceived).toBe(true)
		})
	})

	describe("ITerminal Contract", () => {
		it("should allow implementing ITerminal with all required properties and methods", () => {
			class MockTerminal implements ITerminal {
				id = 1
				name = "Test Terminal"
				cwd = "/test"
				isBusy = false

				async execute(command: string, _options?: IExecuteOptions): Promise<ITerminalProcess> {
					return {
						id: "proc-1",
						command,
						isRunning: true,
						getOutput: () => "",
						getUnretrievedOutput: () => "",
						clearOutput: () => {},
						write: async () => {},
						kill: async () => {},
						onOutput: () => ({ dispose: () => {} }),
						onExit: () => ({ dispose: () => {} }),
					}
				}

				show(): void {
					// Mock implementation
				}

				hide(): void {
					// Mock implementation
				}

				dispose(): void {
					// Mock implementation
				}

				getCurrentWorkingDirectory(): string {
					return this.cwd
				}
			}

			const terminal = new MockTerminal()
			expect(terminal.id).toBe(1)
			expect(terminal.name).toBe("Test Terminal")
			expect(terminal.cwd).toBe("/test")
		})

		it("should verify terminal command execution", async () => {
			const mockTerminal: ITerminal = {
				id: 1,
				name: "Test",
				cwd: "/test",
				isBusy: false,
				execute: async (command) => ({
					id: "proc-1",
					command,
					isRunning: true,
					getOutput: () => "",
					getUnretrievedOutput: () => "",
					clearOutput: () => {},
					write: async () => {},
					kill: async () => {},
					onOutput: () => ({ dispose: () => {} }),
					onExit: () => ({ dispose: () => {} }),
				}),
				show: () => {},
				hide: () => {},
				dispose: () => {},
				getCurrentWorkingDirectory: () => "/test",
			}

			const process = await mockTerminal.execute("npm test")
			expect(process.command).toBe("npm test")
			expect(process.isRunning).toBe(true)
		})
	})

	describe("ITerminalManager Contract", () => {
		it("should allow implementing ITerminalManager with all required methods", () => {
			class MockTerminalManager implements ITerminalManager {
				private terminals: ITerminal[] = []

				async createTerminal(options?: ITerminalOptions): Promise<ITerminal> {
					const cwd = options?.cwd || "/"
					const terminal: ITerminal = {
						id: this.terminals.length + 1,
						name: options?.name || "Terminal",
						cwd,
						isBusy: false,
						execute: async () => ({
							id: "proc-1",
							command: "",
							isRunning: true,
							getOutput: () => "",
							getUnretrievedOutput: () => "",
							clearOutput: () => {},
							write: async () => {},
							kill: async () => {},
							onOutput: () => ({ dispose: () => {} }),
							onExit: () => ({ dispose: () => {} }),
						}),
						show: () => {},
						hide: () => {},
						dispose: () => {},
						getCurrentWorkingDirectory: () => cwd,
					}
					this.terminals.push(terminal)
					return terminal
				}

				getTerminal(id: number): ITerminal | undefined {
					return this.terminals.find((t) => t.id === id)
				}

				getAllTerminals(): ITerminal[] {
					return this.terminals
				}

				async getOrCreateTerminal(cwd: string, _taskId?: string): Promise<ITerminal> {
					const existing = this.terminals.find((t) => t.cwd === cwd)
					if (existing) {
						return existing
					}
					return this.createTerminal({ cwd })
				}

				releaseTerminalsForTask(_taskId: string): void {
					// Mock implementation
				}

				dispose(): void {
					this.terminals.forEach((t) => t.dispose())
					this.terminals = []
				}
			}

			const manager = new MockTerminalManager()
			expect(manager).toBeDefined()
			expect(manager.createTerminal).toBeDefined()
			expect(manager.getAllTerminals).toBeDefined()
		})

		it("should verify terminal creation and retrieval", async () => {
			const terminals: ITerminal[] = []

			const mockManager: ITerminalManager = {
				createTerminal: async (options) => {
					const terminal: ITerminal = {
						id: terminals.length + 1,
						name: options?.name || "Terminal",
						cwd: options?.cwd || "/",
						isBusy: false,
						execute: async () => ({}) as ITerminalProcess,
						show: () => {},
						hide: () => {},
						dispose: () => {},
						getCurrentWorkingDirectory: () => "/",
					}
					terminals.push(terminal)
					return terminal
				},
				getTerminal: (id) => terminals.find((t) => t.id === id),
				getAllTerminals: () => terminals,
				getOrCreateTerminal: async (cwd) => {
					const existing = terminals.find((t) => t.cwd === cwd)
					if (existing) return existing
					return mockManager.createTerminal({ cwd })
				},
				releaseTerminalsForTask: (_taskId) => {},
				dispose: () => {},
			}

			const terminal1 = await mockManager.createTerminal({ name: "Terminal 1" })
			expect(terminal1.id).toBe(1)
			expect(terminal1.name).toBe("Terminal 1")

			const terminal2 = await mockManager.createTerminal({ name: "Terminal 2" })
			expect(terminal2.id).toBe(2)

			const retrieved = mockManager.getTerminal(1)
			expect(retrieved?.name).toBe("Terminal 1")

			const allTerminals = mockManager.getAllTerminals()
			expect(allTerminals).toHaveLength(2)
		})

		it("should verify getOrCreateTerminal reuses existing terminals", async () => {
			let createCount = 0

			const terminals: ITerminal[] = []

			const mockManager: ITerminalManager = {
				createTerminal: async (options) => {
					createCount++
					const terminal: ITerminal = {
						id: terminals.length + 1,
						name: options?.name || "Terminal",
						cwd: options?.cwd || "/",
						isBusy: false,
						execute: async () => ({}) as ITerminalProcess,
						show: () => {},
						hide: () => {},
						dispose: () => {},
						getCurrentWorkingDirectory: () => options?.cwd || "/",
					}
					terminals.push(terminal)
					return terminal
				},
				getTerminal: (id) => terminals.find((t) => t.id === id),
				getAllTerminals: () => terminals,
				getOrCreateTerminal: async (cwd) => {
					const existing = terminals.find((t) => t.cwd === cwd)
					if (existing) return existing
					return mockManager.createTerminal({ cwd })
				},
				releaseTerminalsForTask: (_taskId) => {},
				dispose: () => {},
			}

			const terminal1 = await mockManager.getOrCreateTerminal("/project")
			expect(createCount).toBe(1)

			const terminal2 = await mockManager.getOrCreateTerminal("/project")
			expect(createCount).toBe(1) // Should reuse existing terminal
			expect(terminal1.id).toBe(terminal2.id)

			const terminal3 = await mockManager.getOrCreateTerminal("/other")
			expect(createCount).toBe(2) // Should create new terminal
			expect(terminal3.id).not.toBe(terminal1.id)
		})
	})
})
