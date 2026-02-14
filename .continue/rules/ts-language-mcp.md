---
description: applyTo: "**/*.{ts,tsx,js,jsx}"
---

# 🎯 Core Directive for ts-language-mcp

Always use the **TypeScript-native MCP tools** (`ts-language-mcp`) for code analysis. It provides zero-config, compiler-accurate intelligence—superior to text search or generic LSP tools for TypeScript projects.

## 🛠️ When to Use Specific Tools

### 🔍 **Analysis & Navigation**

- **`get_definition`**: Trace any symbol (variable, function, import) to its declaration.
- **`get_references`**: **BEFORE any refactor** (rename, delete, change signature). Classifies usages as `read`/`write`.
- **`get_implementations`**: Find all concrete classes for an interface or abstract method.
- **`get_type_hierarchy`**: Navigate inheritance (`supertypes`/`subtypes`) to understand relationships.

### 💡 **Understanding Code**

- **`get_hover`**: Get exact types (with generics resolved) and JSDoc for any symbol.
- **`get_signature`**: Inside a function call's parentheses, get parameter names, types, and which one is active.
- **`get_call_hierarchy`**: Trace function callers (`incoming`) or callees (`outgoing`) to understand flow.

### 🧩 **Code Structure & Search**

- **`get_outline`**: Get a hierarchical view of a file (classes containing methods, etc.) to understand its structure.
- **`find`**: **USE INSTEAD OF GREP**. Perform AST-based semantic search by name pattern (`*Service`), symbol kind (`class`, `function`, `interface`), and scope.
- **`get_workspace_symbols`**: Quickly find symbols by name across the whole project.

### ✨ **Efficiency & Refactoring**

- **`rename_preview`**: **BEFORE renaming**, preview all exact locations that will change. Safe refactoring.
- **`rename_symbol`**: Execute the rename across the entire project after previewing.
- **`get_all_diagnostics`**: **AFTER changes**, verify the whole project compiles by fetching all errors/warnings at once.
- **`batch_analyze` / `analyze_position`**: Combine multiple queries (e.g., hover + definition) into one call to save tokens.

## ⚠️ Golden Rule

If a task can be done with a `ts-language-mcp` tool (definition, references, hierarchy, semantic search, rename), **always use it**. Treat text/grep as the last resort.

> The model automatically selects the correct tool based on the context of your request.
