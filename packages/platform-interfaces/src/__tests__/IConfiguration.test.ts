/**
 * IConfiguration interface contract tests
 */

import { describe, it, expect } from "vitest"
import type { IConfiguration, IConfigurationInspect, IConfigurationChangeEvent } from "../index.js"

describe("IConfiguration Contract", () => {
	it("should allow implementing IConfiguration with all required methods", () => {
		const configData: Record<string, unknown> = {
			"app.apiKey": "test-key",
			"app.maxTokens": 4096,
			"app.enabled": true,
		}

		const mockConfig: IConfiguration = {
			get: <T>(section: string, defaultValue?: T): T => {
				return (configData[section] ?? defaultValue) as T
			},
			update: async (section, value, _global) => {
				configData[section] = value
			},
			has: (section) => section in configData,
			inspect: <T>(section: string) => ({
				key: section,
				defaultValue: undefined,
				globalValue: configData[section] as T,
				workspaceValue: undefined,
			}),
			onDidChangeConfiguration: () => ({ dispose: () => {} }),
		}

		const apiKey = mockConfig.get<string>("app.apiKey")
		expect(apiKey).toBe("test-key")

		const maxTokens = mockConfig.get<number>("app.maxTokens", 1000)
		expect(maxTokens).toBe(4096)

		const unknown = mockConfig.get<string>("app.unknown", "default")
		expect(unknown).toBe("default")

		expect(mockConfig.has("app.apiKey")).toBe(true)
		expect(mockConfig.has("app.nonexistent")).toBe(false)
	})

	it("should verify configuration updates", async () => {
		const data: Record<string, unknown> = {}

		const mockConfig: IConfiguration = {
			get: <T>(section: string, defaultValue?: T): T => {
				return (data[section] ?? defaultValue) as T
			},
			update: async (section, value, _global) => {
				data[section] = value
			},
			has: (section) => section in data,
			inspect: () => undefined,
			onDidChangeConfiguration: () => ({ dispose: () => {} }),
		}

		await mockConfig.update("test.value", "new-value")
		expect(mockConfig.get<string>("test.value")).toBe("new-value")

		await mockConfig.update("test.number", 42)
		expect(mockConfig.get<number>("test.number")).toBe(42)
	})

	it("should verify configuration inspection", () => {
		const mockConfig: IConfiguration = {
			get: () => "value" as never,
			update: async () => {},
			has: () => true,
			inspect: <T>(section: string) => {
				const result: IConfigurationInspect<T> = {
					key: section,
					defaultValue: "default" as T,
					globalValue: "global" as T,
					workspaceValue: "workspace" as T,
				}
				return result
			},
			onDidChangeConfiguration: () => ({ dispose: () => {} }),
		}

		const inspected = mockConfig.inspect<string>("test.config")
		expect(inspected?.key).toBe("test.config")
		expect(inspected?.defaultValue).toBe("default")
		expect(inspected?.globalValue).toBe("global")
		expect(inspected?.workspaceValue).toBe("workspace")
	})

	it("should verify configuration change events", () => {
		let eventFired = false
		const affectedSections = new Set(["app.apiKey", "app.maxTokens"])

		const mockConfig: IConfiguration = {
			get: () => null as never,
			update: async () => {},
			has: () => false,
			inspect: () => undefined,
			onDidChangeConfiguration: (callback) => {
				const event: IConfigurationChangeEvent = {
					affectsConfiguration: (section) => affectedSections.has(section),
				}
				callback(event)
				eventFired = true
				return { dispose: () => {} }
			},
		}

		mockConfig.onDidChangeConfiguration((event) => {
			expect(event.affectsConfiguration("app.apiKey")).toBe(true)
			expect(event.affectsConfiguration("app.maxTokens")).toBe(true)
			expect(event.affectsConfiguration("app.other")).toBe(false)
		})

		expect(eventFired).toBe(true)
	})
})
