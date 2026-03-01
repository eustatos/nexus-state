#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const path = require("path");

// Список пакетов, которые зависят от @nexus-state/core
const packages = [
  "async",
  "devtools",
  "family",
  "immer",
  "middleware",
  "persist",
  "react",
  "svelte",
  "vue",
  "web-worker",
];

// Функция для обновления package.json
function updatePackageJson(packageName) {
  const packagePath = path.join(
    __dirname,
    "..",
    "packages",
    packageName,
    "package.json",
  );

  if (!fs.existsSync(packagePath)) {
    console.log(`❌ Package ${packageName} not found`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  // Обновляем зависимости для pnpm workspace
  if (
    packageJson.dependencies &&
    packageJson.dependencies["@nexus-state/core"] === "*"
  ) {
    packageJson.dependencies["@nexus-state/core"] = "workspace:*";
    console.log(`✅ Updated ${packageName} dependencies`);
  }

  // Записываем обратно
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
}

// Обновляем все пакеты
console.log(
  "🔄 Updating package dependencies to use pnpm workspace protocol...",
);
packages.forEach(updatePackageJson);

// Обновляем demo-react
const demoReactPath = path.join(
  __dirname,
  "..",
  "apps",
  "demo-react",
  "package.json",
);
if (fs.existsSync(demoReactPath)) {
  const demoReactJson = JSON.parse(fs.readFileSync(demoReactPath, "utf8"));

  // Обновляем зависимости для использования локальных пакетов
  const dependencies = demoReactJson.dependencies || {};

  if (dependencies["@nexus-state/core"]) {
    dependencies["@nexus-state/core"] = "workspace:*";
  }

  if (dependencies["@nexus-state/react"]) {
    dependencies["@nexus-state/react"] = "workspace:*";
  }

  if (dependencies["@nexus-state/devtools"]) {
    dependencies["@nexus-state/devtools"] = "workspace:*";
  }

  demoReactJson.dependencies = dependencies;
  fs.writeFileSync(
    demoReactPath,
    JSON.stringify(demoReactJson, null, 2) + "\n",
  );
  console.log("✅ Updated demo-react dependencies");
}

console.log("\n🎉 All dependencies updated successfully!");
console.log("\nNext steps:");
console.log("1. Run `pnpm install` to update lockfile");
console.log("2. Run `pnpm run build` to rebuild packages");
console.log("3. Run `pnpm run dev:react` to test the demo");
