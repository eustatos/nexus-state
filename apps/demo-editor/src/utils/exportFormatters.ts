/**
 * Утилиты для форматирования экспортированных данных
 */

import type { Snapshot } from '@nexus-state/core'

export interface ExportedSnapshot {
  id: string
  timestamp: number
  action?: string
  state: Record<string, any>
  metadata?: any
}

export interface ExportedState {
  version: string
  exportedAt: number
  snapshots: ExportedSnapshot[]
  currentState: Record<string, any>
  metadata?: {
    appName?: string
    appVersion?: string
    totalSnapshots?: number
  }
}

/**
 * Форматировать экспортированные данные как HTML
 */
export function formatAsHTML(data: ExportedState): string {
  const exportDate = new Date(data.exportedAt).toLocaleString()
  const snapshotCount = data.snapshots.length

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported State - ${exportDate}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f9f9f9;
    }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .meta {
      background: #ecf0f1;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .meta-item {
      display: inline-block;
      margin-right: 20px;
      font-weight: 500;
    }
    .snapshot {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 15px 0;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .snapshot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .snapshot-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }
    .snapshot-meta {
      font-size: 12px;
      color: #7f8c8d;
    }
    .snapshot-badge {
      display: inline-block;
      padding: 3px 8px;
      background: #3498db;
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    pre {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
      overflow: auto;
      font-size: 12px;
      line-height: 1.5;
      color: #2c3e50;
    }
    .state-key {
      color: #e74c3c;
      font-weight: 600;
    }
    .state-string { color: #27ae60; }
    .state-number { color: #3498db; }
    .state-boolean { color: #9b59b6; }
    .state-null { color: #95a5a6; }
    @media print {
      body { background: white; }
      .snapshot { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>📦 Exported State</h1>
  
  <div class="meta">
    <span class="meta-item">📅 Exported: ${exportDate}</span>
    <span class="meta-item">📊 Snapshots: ${snapshotCount}</span>
    ${data.metadata?.appName ? `<span class="meta-item">🏷️ App: ${data.metadata.appName}</span>` : ''}
  </div>

  <h2>Snapshots Timeline</h2>
  
  ${data.snapshots.map((snapshot, index) => `
    <div class="snapshot">
      <div class="snapshot-header">
        <div>
          <span class="snapshot-title">#${index + 1}: ${snapshot.action || 'Unknown'}</span>
          <span class="snapshot-badge">Snapshot</span>
        </div>
        <div class="snapshot-meta">
          <div>ID: ${snapshot.id}</div>
          <div>Time: ${new Date(snapshot.timestamp).toLocaleString()}</div>
        </div>
      </div>
      <pre>${escapeHtml(JSON.stringify(snapshot.state, null, 2))}</pre>
    </div>
  `).join('')}

  <h2>Current State</h2>
  <pre>${escapeHtml(JSON.stringify(data.currentState, null, 2))}</pre>
</body>
</html>
  `.trim()
}

/**
 * Форматировать экспортированные данные как Markdown
 */
export function formatAsMarkdown(data: ExportedState): string {
  const exportDate = new Date(data.exportedAt).toLocaleString()
  const snapshotCount = data.snapshots.length

  return `
# 📦 Exported State

**Exported at:** ${exportDate}  
**Snapshots:** ${snapshotCount}
${data.metadata?.appName ? `**App:** ${data.metadata.appName}` : ''}

---

## 📋 Snapshots Timeline

${data.snapshots.map((snapshot, index) => `
### #${index + 1}: ${snapshot.action || 'Unknown'}

- **ID:** ${snapshot.id}
- **Time:** ${new Date(snapshot.timestamp).toLocaleString()}

\`\`\`json
${JSON.stringify(snapshot.state, null, 2)}
\`\`\`
`).join('---\n')}

## 🎯 Current State

\`\`\`json
${JSON.stringify(data.currentState, null, 2)}
\`\`\`
  `.trim()
}

/**
 * Форматировать экспортированные данные как Plain Text
 */
export function formatAsPlainText(data: ExportedState): string {
  const exportDate = new Date(data.exportedAt).toLocaleString()
  const snapshotCount = data.snapshots.length

  return `
EXPORTED STATE
==============
Exported at: ${exportDate}
Snapshots: ${snapshotCount}
${data.metadata?.appName ? `App: ${data.metadata.appName}` : ''}

${data.snapshots.map((snapshot, index) => `
---
#${index + 1}: ${snapshot.action || 'Unknown'}
ID: ${snapshot.id}
Time: ${new Date(snapshot.timestamp).toLocaleString()}

${JSON.stringify(snapshot.state, null, 2)}
`).join('\n')}

---
CURRENT STATE
=============
${JSON.stringify(data.currentState, null, 2)}
  `.trim()
}

/**
 * Экранировать HTML специальные символы
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Получить MIME тип для формата
 */
export function getMimeType(format: string): string {
  switch (format) {
    case 'html':
      return 'text/html'
    case 'markdown':
      return 'text/markdown'
    case 'plaintext':
      return 'text/plain'
    case 'json':
    default:
      return 'application/json'
  }
}

/**
 * Получить расширение файла для формата
 */
export function getFileExtension(format: string): string {
  switch (format) {
    case 'html':
      return 'html'
    case 'markdown':
      return 'md'
    case 'plaintext':
      return 'txt'
    case 'json':
    default:
      return 'json'
  }
}
