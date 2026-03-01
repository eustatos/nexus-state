/**
 * ComparisonFormatter - Formats comparison results for display
 */

import type {
  SnapshotComparison,
  ComparisonFormat,
  VisualizationFormat,
  ExportFormat,
} from "./types";

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
};

/**
 * ComparisonFormatter - Formats comparison results for human consumption
 */
export class ComparisonFormatter {
  private colorize: boolean;

  constructor(colorize: boolean = false) {
    this.colorize = colorize;
  }

  /**
   * Format comparison result
   * @param comparison - Comparison result to format
   * @param format - Output format
   * @returns Formatted string
   */
  format(comparison: SnapshotComparison, format: ComparisonFormat): string {
    switch (format) {
      case "summary":
        return this.formatSummary(comparison);
      case "detailed":
        return this.formatDetailed(comparison);
      case "json":
        return JSON.stringify(comparison, null, 2);
      default:
        return this.formatSummary(comparison);
    }
  }

  /**
   * Format as summary
   */
  formatSummary(comparison: SnapshotComparison): string {
    const { summary, metadata, statistics } = comparison;

    const modifiedCount = summary.changedAtoms - summary.addedAtoms - summary.removedAtoms;

    const lines = [
      this.colorizeText("=== Snapshot Comparison ===", COLORS.bold),
      "",
      `Time difference: ${this.formatDuration(metadata.timeDifference)}`,
      `Snapshots: ${metadata.snapshotA.id} → ${metadata.snapshotB.id}`,
      metadata.snapshotA.action
        ? `Actions: ${metadata.snapshotA.action} → ${metadata.snapshotB.action || "(no action)"}`
        : "",
      "",
      this.colorizeText("Summary:", COLORS.bold),
      `  Total atoms: ${summary.totalAtoms}`,
      `  Changed: ${this.formatChangeCount(summary.changedAtoms, summary.totalAtoms)}`,
      `  ├─ Added: ${this.colorizeText(String(summary.addedAtoms), COLORS.green)}`,
      `  ├─ Removed: ${this.colorizeText(String(summary.removedAtoms), COLORS.red)}`,
      `  └─ Modified: ${this.colorizeText(String(modifiedCount), COLORS.yellow)}`,
      `  Unchanged: ${summary.unchangedAtoms}`,
      "",
      `Computed in: ${statistics.duration}ms`,
      `Memory used: ${this.formatBytes(statistics.memoryUsed)}`,
    ];

    return lines.filter((line) => line !== "").join("\n");
  }

  /**
   * Format change count with percentage
   */
  private formatChangeCount(changed: number, total: number): string {
    const percentage = total > 0 ? ((changed / total) * 100).toFixed(1) : "0.0";
    const color = changed > 0 ? COLORS.yellow : COLORS.green;
    return `${this.colorizeText(String(changed), color)} (${percentage}%)`;
  }

  /**
   * Format as detailed view
   */
  formatDetailed(comparison: SnapshotComparison): string {
    const lines = [
      this.formatSummary(comparison),
      "",
      this.colorizeText("=== Atom Changes ===", COLORS.bold),
      "",
    ];

    // Group atoms by status
    const added = comparison.atoms.filter((a) => a.status === "added");
    const removed = comparison.atoms.filter((a) => a.status === "removed");
    const modified = comparison.atoms.filter((a) => a.status === "modified");

    if (added.length > 0) {
      lines.push(this.colorizeText("Added atoms:", COLORS.green), "");
      added.forEach((atom) => {
        lines.push(`  + ${atom.atomName}`);
        lines.push(`    Type: ${atom.atomType}`);
        lines.push(`    Value: ${this.truncateValue(atom.newValue)}`);
        lines.push("");
      });
    }

    if (removed.length > 0) {
      lines.push(this.colorizeText("Removed atoms:", COLORS.red), "");
      removed.forEach((atom) => {
        lines.push(`  - ${atom.atomName}`);
        lines.push(`    Type: ${atom.atomType}`);
        lines.push(`    Value: ${this.truncateValue(atom.oldValue)}`);
        lines.push("");
      });
    }

    if (modified.length > 0) {
      lines.push(this.colorizeText("Modified atoms:", COLORS.yellow), "");
      modified.forEach((atom) => {
        lines.push(`  ~ ${atom.atomName}`);
        lines.push(`    Type: ${atom.atomType}`);

        if (atom.valueDiff) {
          lines.push(`    Changes:`);
          const diffLines = this.formatValueDiff(atom.valueDiff, 6);
          lines.push(...diffLines);
        }

        if (atom.metadataChanges && atom.metadataChanges.length > 0) {
          lines.push(`    Metadata changes:`);
          atom.metadataChanges.forEach((change) => {
            lines.push(`      - ${change}`);
          });
        }

        lines.push("");
      });
    }

    if (added.length === 0 && removed.length === 0 && modified.length === 0) {
      lines.push(this.colorizeText("  No changes detected", COLORS.green));
    }

    return lines.join("\n");
  }

  /**
   * Visualize changes as tree or list
   */
  visualize(comparison: SnapshotComparison, format: VisualizationFormat): string {
    switch (format) {
      case "tree":
        return this.visualizeTree(comparison);
      case "list":
        return this.visualizeList(comparison);
      default:
        return this.visualizeList(comparison);
    }
  }

  /**
   * Visualize as tree structure
   */
  private visualizeTree(comparison: SnapshotComparison): string {
    const lines = [this.colorizeText("State Tree:", COLORS.bold), ""];

    // Build tree from atoms
    const root: Record<string, any> = {};

    comparison.atoms.forEach((atom) => {
      const node = {
        status: atom.status,
        oldValue: atom.oldValue,
        newValue: atom.newValue,
        diff: atom.valueDiff,
      };
      root[atom.atomName] = node;
    });

    // Render tree
    const entries = Object.entries(root);
    entries.forEach(([name, node]: [string, any], index) => {
      const isLast = index === entries.length - 1;
      const prefix = isLast ? "└─" : "├─";
      const statusColor =
        node.status === "added"
          ? COLORS.green
          : node.status === "removed"
            ? COLORS.red
            : node.status === "modified"
              ? COLORS.yellow
              : COLORS.white;

      lines.push(`${prefix} ${this.colorizeText(name, statusColor)} (${node.status})`);

      if (node.diff && !node.diff.equal) {
        const diffLines = this.formatValueDiff(node.diff, 4);
        diffLines.forEach((line) => {
          lines.push(`   ${line}`);
        });
      }
    });

    return lines.join("\n");
  }

  /**
   * Visualize as simple list
   */
  private visualizeList(comparison: SnapshotComparison): string {
    const lines: string[] = [];

    comparison.atoms.forEach((atom) => {
      const icon =
        atom.status === "added"
          ? "+"
          : atom.status === "removed"
            ? "-"
            : atom.status === "modified"
              ? "~"
              : " ";

      const color =
        atom.status === "added"
          ? COLORS.green
          : atom.status === "removed"
            ? COLORS.red
            : atom.status === "modified"
              ? COLORS.yellow
              : COLORS.white;

      lines.push(`${icon} ${this.colorizeText(atom.atomName, color)} [${atom.status}]`);
    });

    return lines.join("\n");
  }

  /**
   * Export comparison to different formats
   */
  export(comparison: SnapshotComparison, format: ExportFormat): string {
    switch (format) {
      case "json":
        return this.exportJson(comparison);
      case "html":
        return this.exportHtml(comparison);
      case "md":
        return this.exportMarkdown(comparison);
      default:
        return this.exportJson(comparison);
    }
  }

  /**
   * Export as JSON
   */
  private exportJson(comparison: SnapshotComparison): string {
    return JSON.stringify(comparison, null, 2);
  }

  /**
   * Export as HTML
   */
  private exportHtml(comparison: SnapshotComparison): string {
    const { summary, atoms, metadata, statistics } = comparison;

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Snapshot Comparison - ${metadata.snapshotA.id} vs ${metadata.snapshotB.id}</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; }
    .added { color: green; }
    .removed { color: red; }
    .modified { color: orange; }
    .unchanged { color: gray; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #4CAF50; color: white; }
    tr:nth-child(even) { background: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Snapshot Comparison</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Time difference:</strong> ${metadata.timeDifference}ms</p>
    <p><strong>Total atoms:</strong> ${summary.totalAtoms}</p>
    <p><strong>Changed:</strong> ${summary.changedAtoms} (${summary.changePercentage.toFixed(1)}%)</p>
    <ul>
      <li class="added">Added: ${summary.addedAtoms}</li>
      <li class="removed">Removed: ${summary.removedAtoms}</li>
      <li class="modified">Modified: ${summary.changedAtoms - summary.addedAtoms - summary.removedAtoms}</li>
    </ul>
    <p><strong>Duration:</strong> ${statistics.duration}ms</p>
  </div>
  <h2>Atom Changes</h2>
  <table>
    <tr>
      <th>Atom Name</th>
      <th>Status</th>
      <th>Type</th>
      <th>Old Value</th>
      <th>New Value</th>
    </tr>
    ${atoms
      .map(
        (atom) => `
      <tr class="${atom.status}">
        <td>${atom.atomName}</td>
        <td>${atom.status}</td>
        <td>${atom.atomType}</td>
        <td>${this.escapeHtml(this.truncateValue(atom.oldValue))}</td>
        <td>${this.escapeHtml(this.truncateValue(atom.newValue))}</td>
      </tr>
    `,
      )
      .join("")}
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Export as Markdown
   */
  private exportMarkdown(comparison: SnapshotComparison): string {
    const { summary, atoms, metadata, statistics } = comparison;

    const lines = [
      `# Snapshot Comparison`,
      ``,
      `## Overview`,
      `- **Time difference:** ${metadata.timeDifference}ms`,
      `- **Snapshots:** ${metadata.snapshotA.id} → ${metadata.snapshotB.id}`,
      `- **Actions:** ${metadata.snapshotA.action || "(none)"} → ${metadata.snapshotB.action || "(none)"}`,
      ``,
      `## Summary`,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total atoms | ${summary.totalAtoms} |`,
      `| Changed | ${summary.changedAtoms} (${summary.changePercentage.toFixed(1)}%) |`,
      `| Added | ${summary.addedAtoms} |`,
      `| Removed | ${summary.removedAtoms} |`,
      `| Modified | ${summary.changedAtoms - summary.addedAtoms - summary.removedAtoms} |`,
      `| Unchanged | ${summary.unchangedAtoms} |`,
      ``,
      `## Statistics`,
      `- **Duration:** ${statistics.duration}ms`,
      `- **Memory used:** ${this.formatBytes(statistics.memoryUsed)}`,
      `- **Depth:** ${statistics.depth}`,
      ``,
      `## Atom Changes`,
      ``,
    ];

    const added = atoms.filter((a) => a.status === "added");
    const removed = atoms.filter((a) => a.status === "removed");
    const modified = atoms.filter((a) => a.status === "modified");

    if (added.length > 0) {
      lines.push(`### Added`, ``);
      added.forEach((atom) => {
        lines.push(`- **${atom.atomName}** (${atom.atomType})`);
        lines.push(`  - Value: \`${this.truncateValue(atom.newValue)}\``);
      });
      lines.push(``);
    }

    if (removed.length > 0) {
      lines.push(`### Removed`, ``);
      removed.forEach((atom) => {
        lines.push(`- **${atom.atomName}** (${atom.atomType})`);
        lines.push(`  - Value: \`${this.truncateValue(atom.oldValue)}\``);
      });
      lines.push(``);
    }

    if (modified.length > 0) {
      lines.push(`### Modified`, ``);
      modified.forEach((atom) => {
        lines.push(`- **${atom.atomName}** (${atom.atomType})`);
        lines.push(`  - Old: \`${this.truncateValue(atom.oldValue)}\``);
        lines.push(`  - New: \`${this.truncateValue(atom.newValue)}\``);
      });
      lines.push(``);
    }

    return lines.join("\n");
  }

  /**
   * Format value diff for display
   */
  private formatValueDiff(diff: any, indent: number = 0): string[] {
    const lines: string[] = [];
    const prefix = " ".repeat(indent);

    if (diff.type === "primitive") {
      if (!diff.equal) {
        lines.push(`${prefix}Old: ${this.truncateValue(diff.oldPrimitive)}`);
        lines.push(`${prefix}New: ${this.truncateValue(diff.newPrimitive)}`);
      }
    } else if (diff.type === "object" && diff.objectChanges) {
      Object.entries(diff.objectChanges).forEach(([key, value]: [string, any]) => {
        if (!value.equal) {
          lines.push(`${prefix}${key}:`);
          lines.push(...this.formatValueDiff(value, indent + 2));
        }
      });
    } else if (diff.type === "array" && diff.arrayChanges) {
      const { added, removed, modified } = diff.arrayChanges;
      if (added.length > 0) lines.push(`${prefix}Added indices: ${added.join(", ")}`);
      if (removed.length > 0) lines.push(`${prefix}Removed indices: ${removed.join(", ")}`);
      if (modified.length > 0) {
        lines.push(`${prefix}Modified:`);
        modified.forEach(({ index, diff: itemDiff }: { index: number; diff: any }) => {
          lines.push(`${prefix}  [${index}]:`);
          lines.push(...this.formatValueDiff(itemDiff, indent + 4));
        });
      }
    }

    return lines.length > 0 ? lines : [`${prefix}(no detailed changes)`];
  }

  /**
   * Format duration in human-readable form
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * Format bytes in human-readable form
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Truncate value for display
   */
  private truncateValue(value: any, maxLength: number = 50): string {
    if (value === undefined) return "undefined";
    if (value === null) return "null";

    const str = typeof value === "object" ? JSON.stringify(value) : String(value);

    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + "...";
  }

  /**
   * Colorize text if enabled
   */
  private colorizeText(text: string, color: string): string {
    return this.colorize ? `${color}${text}${COLORS.reset}` : text;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
  }
}
