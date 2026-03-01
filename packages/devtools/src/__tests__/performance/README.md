# Performance Benchmarks

This directory contains performance benchmarks for the DevTools package.

## Benchmarks

- **Memory usage**: Track memory consumption during various operations
- **Execution time**: Measure time taken for key operations
- **Bundle size**: Track bundle size impact of DevTools
- **Memory leak detection**: Ensure no memory leaks in long-running applications

## Running Benchmarks

```bash
# Run all benchmarks
npm run test:benchmark

# Run specific benchmark
npm run test:benchmark -- --run memory-usage
```

## Adding New Benchmarks

1. Create a new `.bench.ts` file in this directory
2. Use the `bench` function from Vitest to define benchmarks
3. Include setup and teardown logic
4. Add memory leak detection where applicable
```