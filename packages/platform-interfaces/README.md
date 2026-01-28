# @roo-code/platform-interfaces

Platform-agnostic interfaces for Zl-Agent core functionality. This package provides abstract interfaces that enable the core functionality to work across different platforms.

## 概述

这个包定义了一组平台无关的接口，使 Zl-Agent 的核心功能可以在不同平台上运行：

- **VSCode Extension**: 使用 VSCode APIs
- **Node.js CLI**: 使用原生 Node.js 模块
- **Web Application**: 使用浏览器 APIs 或远程服务

## 架构

```
┌─────────────────────────────────────┐
│     Platform Implementations        │
│  (VSCode, Node.js, Web, etc.)      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│     Platform Interfaces (This)      │
│  IFileSystem, ITerminal, IEditor,   │
│  IWorkspace, IConfiguration, etc.   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Core Services               │
│   Task Engine, AI Providers, etc.  │
└─────────────────────────────────────┘
```

## 接口

### IFileSystem

提供平台无关的文件系统操作接口。

**主要功能：**

- 文件读写操作
- 目录管理
- 文件监视（watch）
- 文件搜索和 glob 模式匹配

**示例：**

```typescript
import type { IFileSystem } from "@roo-code/platform-interfaces"

async function readConfig(fs: IFileSystem): Promise<string> {
	const content = await fs.readFile("./config.json", { encoding: "utf8" })
	return content as string
}
```

### ITerminal 和 ITerminalManager

提供平台无关的终端/命令执行接口。

**主要功能：**

- 创建和管理终端实例
- 执行命令
- 捕获输出
- 进程控制

**示例：**

```typescript
import type { ITerminalManager } from "@roo-code/platform-interfaces"

async function runTests(terminalMgr: ITerminalManager): Promise<void> {
	const terminal = await terminalMgr.createTerminal({
		name: "Test Runner",
		cwd: "/path/to/project",
	})

	const process = await terminal.execute("npm test")

	process.onOutput((data) => {
		console.log("Output:", data)
	})

	process.onExit((exitCode) => {
		console.log("Exit code:", exitCode)
	})
}
```

### IEditor

提供平台无关的编辑器操作接口。

**主要功能：**

- 打开和关闭文档
- 获取编辑器上下文
- 应用文本编辑
- 显示差异视图
- 获取诊断信息

**示例：**

```typescript
import type { IEditor, ITextEdit } from "@roo-code/platform-interfaces"

async function refactorCode(editor: IEditor, filePath: string): Promise<void> {
	const doc = await editor.openDocument(filePath)

	const edits: ITextEdit[] = [
		{
			range: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 5 },
			},
			newText: "const",
		},
	]

	await editor.applyEdit(filePath, edits)
}
```

### IWorkspace

提供平台无关的工作区操作接口。

**主要功能：**

- 获取工作区文件夹
- 列出工作区文件
- 监听工作区变化

**示例：**

```typescript
import type { IWorkspace } from "@roo-code/platform-interfaces"

function setupWorkspace(workspace: IWorkspace): void {
	const folders = workspace.getWorkspaceFolders()
	console.log("Workspace folders:", folders)

	workspace.onDidCreateFile((path) => {
		console.log("File created:", path)
	})
}
```

### IConfiguration

提供平台无关的配置管理接口。

**主要功能：**

- 读取配置值
- 更新配置
- 监听配置变化
- 检查配置详情（全局/工作区级别）

**示例：**

```typescript
import type { IConfiguration } from "@roo-code/platform-interfaces"

function loadSettings(config: IConfiguration): void {
	const apiKey = config.get<string>("roocode.apiKey", "")
	const maxTokens = config.get<number>("roocode.maxTokens", 4096)

	config.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration("roocode.apiKey")) {
			console.log("API key changed")
		}
	})
}
```

### IStorage 和 IStorageProvider

提供平台无关的数据持久化接口。

**主要功能：**

- 全局状态存储（跨工作区）
- 工作区状态存储
- 安全密钥存储

**示例：**

```typescript
import type { IStorageProvider } from "@roo-code/platform-interfaces"

async function saveUserData(storage: IStorageProvider): Promise<void> {
	// 保存全局数据
	await storage.globalState.set("userId", "12345")

	// 保存工作区数据
	await storage.workspaceState.set("lastOpenFile", "/path/to/file")

	// 保存敏感信息
	await storage.secrets.store("apiKey", "secret-key-value")
}

async function loadUserData(storage: IStorageProvider): Promise<void> {
	const userId = storage.globalState.get<string>("userId")
	const lastFile = storage.workspaceState.get<string>("lastOpenFile")
	const apiKey = await storage.secrets.get("apiKey")

	console.log({ userId, lastFile, apiKey })
}
```

## 实现平台接口

要为新平台创建实现，只需实现这些接口：

```typescript
import type {
	IFileSystem,
	ITerminalManager,
	IEditor,
	IWorkspace,
	IConfiguration,
	IStorageProvider,
} from "@roo-code/platform-interfaces"

// 示例：自定义文件系统实现
export class MyCustomFileSystem implements IFileSystem {
	async readFile(path: string, options?: IReadFileOptions): Promise<string | Buffer> {
		// 你的实现
	}

	async writeFile(path: string, content: string | Buffer, options?: IWriteFileOptions): Promise<void> {
		// 你的实现
	}

	// ... 实现其他方法
}
```

## 相关包

- `@roo-code/platform-vscode` - VSCode 平台实现（规划中）
- `@roo-code/platform-node` - Node.js 平台实现（规划中）
- `@roo-code/vscode-shim` - 现有的 VSCode API mock 实现

## 开发

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
pnpm test
```

### 类型检查

```bash
pnpm check-types
```

### 代码检查

```bash
pnpm lint
```

### 构建

```bash
pnpm build
```

## 设计原则

1. **平台无关**: 接口不应依赖任何特定平台的 API
2. **简洁明了**: 接口应该易于理解和实现
3. **完整性**: 提供足够的功能来支持核心业务逻辑
4. **可测试性**: 接口设计便于 mock 和测试
5. **向后兼容**: 尽量保持接口稳定，避免破坏性更改

## 许可证

MIT
