// Functions Serialization Strategy
import {
  SerializationStrategy,
  SerializationContext,
  SerializedValue,
  SerializedFunction,
} from '../types';

/**
 * Strategy for handling function types
 */
export class FunctionsStrategy implements SerializationStrategy {
  canHandle(value: unknown): boolean {
    return typeof value === 'function';
  }

  serialize(value: unknown, context: SerializationContext): SerializedValue {
    const func = value as (...args: unknown[]) => unknown;
    const obj = value as object;

    // Check options for function handling
    if (context.options.functionHandling === 'ignore') {
      return {
        __serializedType: 'function',
        __refId: context.seen.get(obj),
        name: func.name,
        __omitted: true,
      };
    }

    // Get function metadata
    const source = func.toString();
    const isArrow = source.includes('=>');
    const isGenerator = source.includes('function*') || source.includes('*');
    const isAsync = source.includes('async');

    // Create function info object
    const result: SerializedFunction = {
      __serializedType: 'function',
      __refId: context.seen.get(obj),
      name: func.name || 'anonymous',
      source,
      length: func.length,
      isArrow,
      isGenerator,
      isAsync,
    };

    // Check if max depth exceeded (functions have no nested properties)
    if (
      context.options.maxDepth > 0 &&
      context.path.length > context.options.maxDepth
    ) {
      result.__omitted = true;
      result.__message = `Function serialization skipped: max depth exceeded at path: ${context.path.join('.')}`;
    }

    return result;
  }

  deserialize?(serialized: SerializedValue): unknown {
    // Parse function source back to function
    // Note: This is a simplified implementation
    // SECURITY: Function deserialization should only be used with trusted sources.
    // Never deserialize functions from untrusted user input.
    if (serialized.__serializedType === 'function') {
      const source = serialized.source as string;

      // Try to create a function from source
      // This is a simplified approach - in practice, you might want more sophisticated parsing
      try {
        // For arrow functions and regular functions
        if (source.includes('=>')) {
          // SECURITY WARNING: Using new Function() with untrusted input can lead to code injection.
          // Only deserialize functions from trusted sources (e.g., your own serialized state).
          return new Function(`return ${source}`)();
        } else if (source.startsWith('function')) {
          // Extract function body and params
          const match = source.match(
            /function\s*(\w*)\s*\(([^)]*)\)\s*{([\s\S]*)}$/
          );
          if (match) {
            const [, _name, params, body] = match;
            // SECURITY WARNING: Same as above - only use with trusted input
            return new Function(params, body);
          }
        }
      } catch (e) {
        // If parsing fails, return the source as a marker
        return {
          __serializedType: 'function',
          name: serialized.name,
          __source: source,
          __parseError: (e as Error).message,
        };
      }
    }
    return serialized;
  }
}
