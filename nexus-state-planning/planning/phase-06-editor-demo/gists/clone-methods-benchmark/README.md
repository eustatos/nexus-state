# Clone Methods Benchmark

Benchmark comparison of cloning methods for time-travel debugging implementations.

## Quick Start

```bash
# Install dependencies
npm install

# Run benchmarks
npm start
```

## What This Benchmarks

Compares performance of 4 cloning methods:

| Method | Description |
|--------|-------------|
| **JSON.stringify** | Built-in, fast but limited type support |
| **structuredClone** | Modern API, full type support (Node 17+) |
| **deepClone** | Custom implementation with circular ref support |
| **lodash cloneDeep** | Popular library, full support but slow |

## Requirements

- Node.js 17.0.0 or higher (for `structuredClone`)
- npm or yarn

## Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║   Clone Methods Benchmark for Time-Travel Debugging      ║
╚═══════════════════════════════════════════════════════════╝

📊 Test Configuration
────────────────────────────────────────────────────────────
  Test Data Size:     102.45 KB
  Iterations:         1000
  Node.js Version:    v20.10.0
  Platform:           darwin arm64

⏱ Running: JSON.stringify...
⏱ Running: structuredClone...
⏱ Running: deepClone (custom)...
⏱ Running: lodash cloneDeep...

╔═══════════════════════════════════════════════════════════╗
║                      RESULTS                              ║
╚═══════════════════════════════════════════════════════════╝

┌──────────────────────┬────────────┬────────────┬──────────────┐
│ Method               │ Time (ms)  │ Avg (ms)   │ Memory       │
├──────────────────────┼────────────┼────────────┼──────────────┤
│ JSON.stringify       │ 8.50       │ 0.009      │ 200%         │
│ structuredClone      │ 3.20       │ 0.003      │ 150%         │
│ deepClone (custom)   │ 5.10       │ 0.005      │ 120%         │
│ lodash cloneDeep     │ 12.30      │ 0.012      │ 150%         │
└──────────────────────┴────────────┴────────────┴──────────────┘

🏆 Fastest: structuredClone (3.20ms)
```

## Type Support

```
┌────────────────────┬────────────┬──────┬─────┬─────┬────────────┬──────────┐
│ Method             │ Primitives │ Date │ Map │ Set │ TypedArray │ Circular │
├────────────────────┼────────────┼──────┼─────┼─────┼────────────┼──────────┤
│ JSON.stringify     │     ✓      │  ⚠️  │  ✗  │  ✗  │     ✗      │    ✗     │
│ structuredClone    │     ✓      │  ✓   │  ✓  │  ✓  │     ✓      │    ✓     │
│ deepClone (custom) │     ✓      │  ✓   │  ✓  │  ✓  │     ✓      │    ✓     │
│ lodash cloneDeep   │     ✓      │  ✓   │  ✓  │  ✓  │     ✓      │    ✓     │
└────────────────────┴────────────┴──────┴─────┴─────┴────────────┴──────────┘

✓ = Full support | ⚠️ = Partial (loses type) | ✗ = No support
```

## Recommendations

Based on benchmark results:

| Use Case | Recommended Method |
|----------|-------------------|
| **Production (modern browsers)** | `structuredClone()` |
| **Production (old browsers)** | Custom `deepClone()` |
| **Prototyping** | `JSON.stringify` |
| **Avoid** | `lodash cloneDeep` (slow + 24KB bundle) |

## For Time-Travel Debugging

When implementing time-travel debugging, cloning is used for:

1. **Creating snapshots** - Clone state at point in time
2. **Restoring state** - Clone snapshot to avoid mutations
3. **Delta computation** - Compare cloned states

Choose your method based on:
- **State complexity** (Map/Set/Date?)
- **Browser support** requirements
- **Performance** needs

## Related

- [Time-Travel Debugging Article Series](../../article/drafts/)
- [Part 2: Performance and Advanced Topics](../../article/drafts/part-2-advanced-final.md)

## License

MIT
