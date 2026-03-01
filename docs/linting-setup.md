# Настройка Linting

## Необходимые зависимости

Для корректной работы linting в проекте необходимо установить следующие дополнительные зависимости:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

Или добавьте их вручную в раздел `devDependencies` файла `package.json`:

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

После добавления зависимостей выполните:

```bash
npm install
```

## Конфигурация ESLint

В проекте уже создан конфигурационный файл `.eslintrc.js` в корне проекта. Этот файл содержит базовую конфигурацию для всего проекта.

Для отдельных пакетов также созданы конфигурационные файлы, которые наследуют настройки из корневого файла:
- `packages/core/.eslintrc.js`
- `packages/react/.eslintrc.js`
- `packages/vue/.eslintrc.js`
- `packages/svelte/.eslintrc.js`
- `packages/immer/.eslintrc.js`
- `packages/persist/.eslintrc.js`

## Необходимый файл tsconfig.json

Для корректной работы ESLint с TypeScript необходимо создать файл `tsconfig.json` в корне проекта. Пример содержимого файла:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "composite": true
  },
  "exclude": ["node_modules", "dist"]
}
```

## Запуск linting

Для запуска проверки кода используйте команду:

```bash
npm run lint
```

Эта команда запустит ESLint во всех рабочих пространствах проекта благодаря TurboRepo.

## Автоматическое исправление ошибок

Для автоматического исправления ошибок, которые может исправить ESLint, используйте команду:

```bash
npm run lint -- --fix
```

## Дополнительные настройки

Вы можете добавить специфичные конфигурации ESLint в отдельные пакеты, создав в них файлы `.eslintrc.js` с соответствующими настройками.

## Интеграция с редактором

Для наилучшего опыта работы с ESLint рекомендуется установить расширение ESLint для вашего редактора кода:

- **VS Code**: [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- **WebStorm**: ESLint поддерживается из коробки

После установки расширения ошибки будут подсвечиваться в реальном времени во время редактирования кода.