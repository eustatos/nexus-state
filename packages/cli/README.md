# @nexus-state/cli

[![npm version](https://img.shields.io/npm/v/@nexus-state/cli.svg)](https://www.npmjs.com/package/@nexus-state/cli)
[![License](https://img.shields.io/npm/l/@nexus-state/cli.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🛠️ Command-line interface for Nexus State: code generation, project templates, and utilities

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Features

- 🚀 **Quick Start** — project templates in seconds
- 📦 **Code Generation** — atoms, hooks, tests automatically
- 🎨 **Customization** — templates for your project
- 🔧 **Utilities** — migrations, code analysis
- 📚 **Documentation** — built-in examples

---

## 📦 Installation

```bash
npm install -g @nexus-state/cli
```

---

## 🚀 Quick Start

### Create New Project

```bash
nexus init my-app
cd my-app
npm install
npm run dev
```

---

## 📖 Commands

### `nexus init <name>`

Creates a new Nexus State project.

```bash
# Basic template
nexus init my-app

# With specific framework
nexus init my-app --template react
nexus init my-app --template vue
nexus init my-app --template svelte
nexus init my-app --template vanilla

# With TypeScript
nexus init my-app --typescript

# Quiet mode (no prompts)
nexus init my-app --yes
```

**Options:**

| Option | Description |
|--------|-------------|
| `--template` | Template: `react`, `vue`, `svelte`, `vanilla` |
| `--typescript` | Add TypeScript configuration |
| `--yes` | Skip prompts, use defaults |
| `--install` | Auto-install dependencies |

### `nexus generate <type> <name>`

Generates Nexus State code.

```bash
# Generate atom
nexus generate atom User
nexus generate atom userAtom --path=store/atoms

# Generate hook (React)
nexus generate hook useUser
nexus generate hook useAtom --atom=userAtom

# Generate slice
nexus generate slice auth
nexus generate slice user --fields=name,email,role

# Generate test
nexus generate test userAtom
nexus generate test authSlice

# Generate type (TypeScript)
nexus generate type User --fields=id:number,name:string,email:string
```

**Types:**

| Type | Description |
|------|-------------|
| `atom` | Creates atom file |
| `hook` | Creates React hook |
| `slice` | Creates state slice |
| `test` | Creates test file |
| `type` | Creates TypeScript type |

### `nexus dev`

Starts development mode with auto-build.

```bash
nexus dev
nexus dev --watch
nexus dev --port 3000
```

### `nexus build`

Builds project for production.

```bash
nexus build
nexus build --minify
nexus build --sourcemap
```

### `nexus migrate <version>`

Runs migrations between versions.

```bash
nexus migrate 0.2.0
nexus migrate latest
```

### `nexus analyze`

Analyzes atom usage in project.

```bash
nexus analyze
nexus analyze --output=report.json
```

### `nexus doctor`

Checks project configuration for issues.

```bash
nexus doctor
nexus doctor --fix
```

---

## 💡 Usage Examples

### Create E-commerce Shop

```bash
# Create project
nexus init my-shop --template react --typescript

# Generate atoms
cd my-shop
nexus generate atom products
nexus generate atom cart
nexus generate atom user
nexus generate atom orders

# Generate hooks
nexus generate hook useProducts
nexus generate hook useCart
nexus generate hook useUser

# Generate tests
nexus generate test cartAtom
nexus generate test productsAtom
```

### Generate CRUD Operations

```bash
# Create user slice with fields
nexus generate slice user --fields=id:number,name:string,email:string,role:string

# Generate tests for slice
nexus generate test userSlice
```

### Migrate to New Version

```bash
# Check available migrations
nexus migrate --list

# Apply migration
nexus migrate 0.2.0

# Check result
nexus doctor
```

---

## 🎨 Templates

### Available Templates

| Template | Description |
|----------|-------------|
| `react` | React app with Vite |
| `vue` | Vue 3 app with Vite |
| `svelte` | Svelte app with Vite |
| `vanilla` | Vanilla JS app |
| `react-ts` | React + TypeScript |
| `next` | Next.js app |
| `nuxt` | Nuxt 3 app |

### Custom Templates

Create your template in `.nexus/templates`:

```bash
mkdir -p .nexus/templates/my-template
cp -r node_modules/@nexus-state/cli/templates/react/* .nexus/templates/my-template/
```

Use it:

```bash
nexus init my-app --template=my-template
```

---

## ⚙️ Configuration

### `.nexusrc.json`

Project configuration file:

```json
{
  "template": "react",
  "typescript": true,
  "atomsPath": "src/store/atoms",
  "hooksPath": "src/hooks",
  "testsPath": "src/__tests__",
  "aliases": {
    "@atoms": "src/store/atoms",
    "@hooks": "src/hooks"
  }
}
```

---

## ⚠️ Troubleshooting

### Problem: Command not found

**Solution:** Make sure CLI is installed globally:

```bash
npm install -g @nexus-state/cli
nexus --version
```

### Problem: Generation error

**Solution:** Check permissions:

```bash
# Run as admin
sudo nexus generate atom User

# Or change folder permissions
chmod -R 755 src/store
```

### Problem: Outdated version

**Solution:** Update CLI:

```bash
npm update -g @nexus-state/cli
nexus --version
```

---

## 📊 Scripts for package.json

```json
{
  "scripts": {
    "dev": "nexus dev",
    "build": "nexus build",
    "generate:atom": "nexus generate atom",
    "generate:hook": "nexus generate hook",
    "generate:test": "nexus generate test",
    "migrate": "nexus migrate latest",
    "doctor": "nexus doctor"
  }
}
```

---

## 📚 Documentation

- [CLI Guide](https://nexus-state.website.yandexcloud.net/guide/cli)
- [Templates](https://nexus-state.website.yandexcloud.net/guides/templates)
- [Code Generation](https://nexus-state.website.yandexcloud.net/guides/code-generation)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
