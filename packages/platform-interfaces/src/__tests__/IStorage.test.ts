/**
 * IStorage and IStorageProvider interface contract tests
 */

import { describe, it, expect } from "vitest"
import type { IStorage, ISecretStorage, IStorageProvider } from "../index.js"

describe("IStorage Contract", () => {
	it("should allow implementing IStorage with all required methods", async () => {
		const data = new Map<string, unknown>()

		const mockStorage: IStorage = {
			get: <T>(key: string): T | undefined => {
				return data.get(key) as T | undefined
			},
			set: async <T>(key: string, value: T): Promise<void> => {
				data.set(key, value)
			},
			delete: async (key: string): Promise<void> => {
				data.delete(key)
			},
			keys: (): string[] => {
				return Array.from(data.keys())
			},
		}

		await mockStorage.set("userId", "12345")
		expect(mockStorage.get<string>("userId")).toBe("12345")

		await mockStorage.set("count", 42)
		expect(mockStorage.get<number>("count")).toBe(42)

		expect(mockStorage.keys()).toContain("userId")
		expect(mockStorage.keys()).toContain("count")

		await mockStorage.delete("userId")
		expect(mockStorage.get<string>("userId")).toBeUndefined()
	})

	it("should verify storage with complex objects", async () => {
		const data = new Map<string, unknown>()

		const mockStorage: IStorage = {
			get: <T>(key: string): T | undefined => data.get(key) as T | undefined,
			set: async <T>(key: string, value: T) => {
				data.set(key, value)
			},
			delete: async (key) => {
				data.delete(key)
			},
			keys: () => Array.from(data.keys()),
		}

		const userData = {
			name: "John Doe",
			age: 30,
			settings: {
				theme: "dark",
				language: "en",
			},
		}

		await mockStorage.set("user", userData)
		const retrieved = mockStorage.get<typeof userData>("user")
		expect(retrieved?.name).toBe("John Doe")
		expect(retrieved?.settings.theme).toBe("dark")
	})
})

describe("ISecretStorage Contract", () => {
	it("should allow implementing ISecretStorage with all required methods", async () => {
		const secrets = new Map<string, string>()

		const mockSecretStorage: ISecretStorage = {
			get: async (key: string): Promise<string | undefined> => {
				return secrets.get(key)
			},
			store: async (key: string, value: string): Promise<void> => {
				secrets.set(key, value)
			},
			delete: async (key: string): Promise<void> => {
				secrets.delete(key)
			},
		}

		await mockSecretStorage.store("apiKey", "secret-key-123")
		const apiKey = await mockSecretStorage.get("apiKey")
		expect(apiKey).toBe("secret-key-123")

		await mockSecretStorage.delete("apiKey")
		const deleted = await mockSecretStorage.get("apiKey")
		expect(deleted).toBeUndefined()
	})

	it("should handle multiple secrets", async () => {
		const secrets = new Map<string, string>()

		const mockSecretStorage: ISecretStorage = {
			get: async (key) => secrets.get(key),
			store: async (key, value) => {
				secrets.set(key, value)
			},
			delete: async (key) => {
				secrets.delete(key)
			},
		}

		await mockSecretStorage.store("apiKey", "key-123")
		await mockSecretStorage.store("token", "token-456")
		await mockSecretStorage.store("password", "pass-789")

		expect(await mockSecretStorage.get("apiKey")).toBe("key-123")
		expect(await mockSecretStorage.get("token")).toBe("token-456")
		expect(await mockSecretStorage.get("password")).toBe("pass-789")
	})
})

describe("IStorageProvider Contract", () => {
	it("should allow implementing IStorageProvider with all storage types", async () => {
		const globalData = new Map<string, unknown>()
		const workspaceData = new Map<string, unknown>()
		const secretsData = new Map<string, string>()

		const mockStorageProvider: IStorageProvider = {
			globalState: {
				get: <T>(key: string) => globalData.get(key) as T | undefined,
				set: async <T>(key: string, value: T) => {
					globalData.set(key, value)
				},
				delete: async (key) => {
					globalData.delete(key)
				},
				keys: () => Array.from(globalData.keys()),
			},
			workspaceState: {
				get: <T>(key: string) => workspaceData.get(key) as T | undefined,
				set: async <T>(key: string, value: T) => {
					workspaceData.set(key, value)
				},
				delete: async (key) => {
					workspaceData.delete(key)
				},
				keys: () => Array.from(workspaceData.keys()),
			},
			secrets: {
				get: async (key) => secretsData.get(key),
				store: async (key, value) => {
					secretsData.set(key, value)
				},
				delete: async (key) => {
					secretsData.delete(key)
				},
			},
		}

		// Test global state
		await mockStorageProvider.globalState.set("userId", "user-123")
		expect(mockStorageProvider.globalState.get<string>("userId")).toBe("user-123")

		// Test workspace state
		await mockStorageProvider.workspaceState.set("lastFile", "/test.ts")
		expect(mockStorageProvider.workspaceState.get<string>("lastFile")).toBe("/test.ts")

		// Test secrets
		await mockStorageProvider.secrets.store("apiKey", "secret")
		expect(await mockStorageProvider.secrets.get("apiKey")).toBe("secret")
	})

	it("should verify storage isolation between global and workspace state", async () => {
		const globalData = new Map<string, unknown>()
		const workspaceData = new Map<string, unknown>()

		const mockStorageProvider: IStorageProvider = {
			globalState: {
				get: <T>(key: string) => globalData.get(key) as T | undefined,
				set: async <T>(key: string, value: T) => {
					globalData.set(key, value)
				},
				delete: async (key) => {
					globalData.delete(key)
				},
				keys: () => Array.from(globalData.keys()),
			},
			workspaceState: {
				get: <T>(key: string) => workspaceData.get(key) as T | undefined,
				set: async <T>(key: string, value: T) => {
					workspaceData.set(key, value)
				},
				delete: async (key) => {
					workspaceData.delete(key)
				},
				keys: () => Array.from(workspaceData.keys()),
			},
			secrets: {
				get: async () => undefined,
				store: async () => {},
				delete: async () => {},
			},
		}

		// Set same key in both storages with different values
		await mockStorageProvider.globalState.set("config", "global-value")
		await mockStorageProvider.workspaceState.set("config", "workspace-value")

		// Verify they remain separate
		expect(mockStorageProvider.globalState.get<string>("config")).toBe("global-value")
		expect(mockStorageProvider.workspaceState.get<string>("config")).toBe("workspace-value")

		// Delete from one should not affect the other
		await mockStorageProvider.globalState.delete("config")
		expect(mockStorageProvider.globalState.get<string>("config")).toBeUndefined()
		expect(mockStorageProvider.workspaceState.get<string>("config")).toBe("workspace-value")
	})
})
