# Migrating from OpenRouter Plugin v2 to v3

This guide walks through upgrading the OpenRouter plugin from version 2 to version 3 in your Catalyst web framework application. Version 3 introduces a new configuration schema and changes how middleware is registered, but the core functionality remains stable.

## What Changed

The major breaking changes in v3 are:

- **Configuration format**: The YAML structure for model routing has been flattened. Previously, you nested `fallback` under each model; now fallbacks are defined at the provider level.
- **Middleware initialization**: The `registerPlugin()` method no longer accepts a config object directly. You must call `plugin.configure()` first, then `registerPlugin(plugin)`.
- **Error types**: Custom error classes have been renamed and reorganized. `ModelNotAvailableError` is now `UnknownModelError`, and error details are accessed via `error.context` instead of `error.details`.

## Migration Steps

### 1. Update Your Configuration

**Before (v2)**:
```yaml
openrouter:
  models:
    primary:
      id: "meta-llama/llama-2-70b"
      fallback: "meta-llama/llama-2-13b"
    secondary:
      id: "openai/gpt-4"
      fallback: "openai/gpt-3.5-turbo"
```

**After (v3)**:
```yaml
openrouter:
  providers:
    meta:
      primary: "meta-llama/llama-2-70b"
      fallback: "meta-llama/llama-2-13b"
    openai:
      primary: "openai/gpt-4"
      fallback: "openai/gpt-3.5-turbo"
```

The new structure groups models by provider, simplifying multi-model strategies.

### 2. Update Plugin Registration

**Before (v2)**:
```javascript
const plugin = require('@catalyst/openrouter-v2');
app.registerPlugin(plugin, config);
```

**After (v3)**:
```javascript
const plugin = require('@catalyst/openrouter-v3');
plugin.configure(config);
app.registerPlugin(plugin);
```

This two-step process allows plugins to validate configuration before registration proceeds.

### 3. Update Error Handling

Search your codebase for error handling that catches plugin-specific exceptions:

**Before (v2)**:
```javascript
catch (err) {
  if (err.name === 'ModelNotAvailableError') {
    logger.warn(`Model unavailable: ${err.details.modelId}`);
  }
}
```

**After (v3)**:
```javascript
catch (err) {
  if (err.name === 'UnknownModelError') {
    logger.warn(`Model unavailable: ${err.context.modelId}`);
  }
}
```

### 4. Test Your Integration

After making these changes, run your integration tests to verify model selection and fallback behavior:

```bash
npm test -- --grep "openrouter"
```

Pay special attention to tests that exercise fallback logic. In v3, fallbacks are attempted sequentially and fail fast if all options exhaust.

## Deprecation Timeline

- v3.0 (current): Full support for v3 configuration. v2 configs will raise a deprecation warning but continue to function.
- v3.1 (June 2025): v2 config support will be removed entirely.

We recommend upgrading before June to avoid disruption. If you have complex configurations or custom middleware depending on v2 internals, please file an issue on the plugin repository.

## Getting Help

- Check the [v3 release notes](https://github.com/catalyst-framework/openrouter-plugin/releases/tag/v3.0.0) for additional context.
- Run `npm install @catalyst/openrouter-v3@latest` to pull the latest patch release with bug fixes.
- Open an issue if you encounter problems during migration.
