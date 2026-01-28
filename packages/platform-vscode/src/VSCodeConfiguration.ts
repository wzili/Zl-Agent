/**
 * VSCode implementation of IConfiguration interface
 */

import * as vscode from "vscode"
import type {
	IConfiguration,
	IConfigurationInspect,
	IConfigurationChangeEvent,
	IDisposable,
} from "@roo-code/platform-interfaces"

export class VSCodeConfiguration implements IConfiguration {
	private disposables: vscode.Disposable[] = []

	/**
	 * Get a configuration value
	 */
	get<T>(section: string, defaultValue?: T): T {
		const config = vscode.workspace.getConfiguration()
		return config.get<T>(section, defaultValue as T)
	}

	/**
	 * Update a configuration value
	 */
	async update(section: string, value: unknown, global?: boolean): Promise<void> {
		const config = vscode.workspace.getConfiguration()
		const configTarget = global ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace
		await config.update(section, value, configTarget)
	}

	/**
	 * Check if a configuration section exists
	 */
	has(section: string): boolean {
		const config = vscode.workspace.getConfiguration()
		const inspected = config.inspect(section)
		return inspected !== undefined
	}

	/**
	 * Get detailed information about a configuration value
	 */
	inspect<T>(section: string): IConfigurationInspect<T> | undefined {
		const config = vscode.workspace.getConfiguration()
		const inspected = config.inspect<T>(section)

		if (!inspected) {
			return undefined
		}

		return {
			key: section,
			defaultValue: inspected.defaultValue,
			globalValue: inspected.globalValue,
			workspaceValue: inspected.workspaceValue,
		}
	}

	/**
	 * Register a callback for configuration changes
	 */
	onDidChangeConfiguration(callback: (event: IConfigurationChangeEvent) => void): IDisposable {
		const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
			const event: IConfigurationChangeEvent = {
				affectsConfiguration: (section: string) => e.affectsConfiguration(section),
			}
			callback(event)
		})

		this.disposables.push(disposable)

		return {
			dispose: () => {
				disposable.dispose()
				const index = this.disposables.indexOf(disposable)
				if (index >= 0) {
					this.disposables.splice(index, 1)
				}
			},
		}
	}

	/**
	 * Dispose of all resources
	 */
	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose()
		}
		this.disposables = []
	}
}
