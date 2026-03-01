# Migration Guide

This section provides guides for migrating between different versions of Nexus State.

## Current Version: v1.0

### From v0.x

- [Migrating from v0.x to v1.0](./v0-to-v1.md) - Step-by-step migration guide
- [Breaking Changes](./breaking-changes.md) - Detailed list of breaking changes

## Migration Checklist

- [ ] Update imports from `nexus-state` to `@nexus-state/*`
- [ ] Replace `createStore` with `createEnhancedStore`
- [ ] Add names to all atoms for DevTools support
- [ ] Update Time Travel API calls
- [ ] Configure DevTools integration
- [ ] Enable Time Travel if needed
- [ ] Update any custom plugins
- [ ] Test all functionality

## Migration Tools

We provide automated migration tools to help with the transition:

```bash
# Install migration tool
npm install -D @nexus-state/migrate

# Run migration
npx @nexus-state/migrate
```

## Need Help?

- [Join our Discord](https://discord.gg/nexus-state)
- [Open an issue](https://github.com/nexus-state/nexus-state/issues)
- [Check FAQs](../community/faq.md)
