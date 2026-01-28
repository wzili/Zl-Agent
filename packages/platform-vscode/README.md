# @roo-code/platform-vscode

VSCode 平台实现，为 `@roo-code/platform-interfaces` 提供基于 VSCode API 的具体实现。

## 状态

🚧 **开发中** - 这个包目前正在开发中，是 VSCode API 抽象层项目的 Phase 2 实现。

## 已实现

- ✅ **VSCodeFileSystem** - 完整实现了 `IFileSystem` 接口
    - 文件读写操作
    - 目录管理
    - 文件监视
    - Glob 搜索
    - 文本搜索

## 待实现

- ⏳ **VSCodeTerminalManager** - `ITerminalManager` 接口实现
- ⏳ **VSCodeEditor** - `IEditor` 接口实现
- ⏳ **VSCodeWorkspace** - `IWorkspace` 接口实现
- ⏳ **VSCodeConfiguration** - `IConfiguration` 接口实现
- ⏳ **VSCodeStorageProvider** - `IStorageProvider` 接口实现

## 使用示例

```typescript
import * as vscode from "vscode"
import { VSCodeFileSystem } from "@roo-code/platform-vscode"

// 在 VSCode 扩展中使用
export function activate(context: vscode.ExtensionContext) {
	const fileSystem = new VSCodeFileSystem()

	// 读取文件
	const content = await fileSystem.readFile("/path/to/file.txt")

	// 写入文件
	await fileSystem.writeFile("/path/to/output.txt", "Hello World")

	// 监视文件变化
	const disposable = fileSystem.watch("/path/to/watch", (event) => {
		console.log(`File ${event.type}: ${event.path}`)
	})

	context.subscriptions.push(disposable)
}
```

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

### 构建

```bash
pnpm build
```

## 架构说明

这个包实现了平台接口，使用 VSCode 的原生 API：

- `vscode.workspace.fs` - 文件系统操作
- `vscode.window.terminals` - 终端管理
- `vscode.window.activeTextEditor` - 编辑器操作
- `vscode.workspace.workspaceFolders` - 工作区管理
- `vscode.workspace.getConfiguration` - 配置管理
- `context.globalState/workspaceState/secrets` - 存储管理

## 相关包

- [`@roo-code/platform-interfaces`](../platform-interfaces) - 平台无关接口定义
- [`@roo-code/platform-node`](../platform-node) - Node.js 平台实现（规划中）

## 许可证

MIT
