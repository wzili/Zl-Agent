/**
 * VSCode implementation of IStorage and IStorageProvider interfaces
 */

import * as vscode from "vscode"
import type { IStorage, ISecretStorage, IStorageProvider } from "@roo-code/platform-interfaces"

/**
 * VSCode implementation of IStorage using Memento
 */
export class VSCodeStorage implements IStorage {
	constructor(private memento: vscode.Memento) {}

	get<T>(key: string): T | undefined {
		return this.memento.get<T>(key)
	}

	async set<T>(key: string, value: T): Promise<void> {
		await this.memento.update(key, value)
	}

	async delete(key: string): Promise<void> {
		await this.memento.update(key, undefined)
	}

	keys(): string[] {
		// @ts-expect-error - keys() requires VSCode 1.73+
		return this.memento.keys()
	}
}

/**
 * VSCode implementation of ISecretStorage
 */
export class VSCodeSecretStorage implements ISecretStorage {
	// @ts-expect-error - SecretStorage requires VSCode 1.53+
	constructor(private secrets: vscode.SecretStorage) {}

	async get(key: string): Promise<string | undefined> {
		return await this.secrets.get(key)
	}

	async store(key: string, value: string): Promise<void> {
		await this.secrets.store(key, value)
	}

	async delete(key: string): Promise<void> {
		await this.secrets.delete(key)
	}
}

/**
 * VSCode implementation of IStorageProvider
 */
export class VSCodeStorageProvider implements IStorageProvider {
	public readonly globalState: IStorage
	public readonly workspaceState: IStorage
	public readonly secrets: ISecretStorage

	constructor(context: vscode.ExtensionContext) {
		this.globalState = new VSCodeStorage(context.globalState)
		this.workspaceState = new VSCodeStorage(context.workspaceState)
		// @ts-expect-error - secrets requires VSCode 1.53+
		this.secrets = new VSCodeSecretStorage(context.secrets)
	}
}
