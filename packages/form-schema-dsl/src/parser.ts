/**
 * Text-based DSL Parser for Nexus State Forms
 *
 * Parses a simple DSL syntax for form validation rules.
 *
 * @example
 * ```
 * # User Registration Form
 * username: required, min:3, max:20, unique:users.username
 * email: required, email, unique:users.email
 * password: required, min:8, uppercase, lowercase, number, special
 * confirmPassword: required, same:password
 * ```
 */

import type { DSLSchema, DSLRule } from './types';
import {
  required,
  minLength,
  maxLength,
  email,
  url,
  phone,
  pattern,
  minValue,
  maxValue,
  equalTo,
  // ... other validators
} from './validators';
import { unique } from './async-validators';

/**
 * Token types for the DSL lexer
 */
export enum TokenType {
  FIELD_NAME = 'FIELD_NAME',
  COLON = 'COLON',
  RULE = 'RULE',
  PARAM = 'PARAM',
  COMMA = 'COMMA',
  COMMENT = 'COMMENT',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

/**
 * Token interface
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * Lexer error
 */
export class LexerError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`Lexer error at line ${line}, column ${column}: ${message}`);
    this.name = 'LexerError';
  }
}

/**
 * Parser error
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public suggestion?: string
  ) {
    super(`Parser error at line ${line}, column ${column}: ${message}${suggestion ? `\nDid you mean: ${suggestion}` : ''}`);
    this.name = 'ParserError';
  }
}

/**
 * Parsed field validation
 */
export interface ParsedFieldValidation {
  fieldName: string;
  rules: ParsedRule[];
}

/**
 * Parsed rule
 */
export interface ParsedRule {
  name: string;
  params?: string[];
}

/**
 * Parsed schema result
 */
export interface ParsedSchemaResult {
  fields: ParsedFieldValidation[];
  errors: ParserError[];
}

/**
 * Lexer - converts input string to tokens
 */
export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Tokenize the input
   */
  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private peek(): string {
    return this.input[this.position];
  }

  private advance(): string {
    const char = this.input[this.position++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private scanToken(): void {
    const char = this.peek();

    // Skip whitespace (except newlines)
    if (char === ' ' || char === '\t') {
      this.advance();
      return;
    }

    // Comments
    if (char === '#') {
      this.comment();
      return;
    }

    // Newlines
    if (char === '\n') {
      this.advance();
      this.tokens.push({
        type: TokenType.NEWLINE,
        value: '\n',
        line: this.line - 1,
        column: this.column,
      });
      return;
    }

    // Colon
    if (char === ':') {
      this.advance();
      this.tokens.push({
        type: TokenType.COLON,
        value: ':',
        line: this.line,
        column: this.column - 1,
      });
      return;
    }

    // Comma
    if (char === ',') {
      this.advance();
      this.tokens.push({
        type: TokenType.COMMA,
        value: ',',
        line: this.line,
        column: this.column - 1,
      });
      return;
    }

    // Identifiers and rules
    if (this.isAlpha(char) || char === '_') {
      this.identifierOrRule();
      return;
    }

    // Numbers (for params)
    if (this.isDigit(char)) {
      this.number();
      return;
    }

    // Special characters (for regex patterns etc.) - skip them
    if (this.isSpecialChar(char)) {
      this.advance();
      return;
    }

    throw new LexerError(`Unexpected character: ${char}`, this.line, this.column);
  }

  private comment(): void {
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }
  }

  private identifierOrRule(): void {
    const start = this.position;

    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
      this.advance();
    }

    const value = this.input.substring(start, this.position);

    // Check if followed by colon (field name) or not (rule)
    if (!this.isAtEnd() && this.peek() === ':') {
      this.tokens.push({
        type: TokenType.FIELD_NAME,
        value,
        line: this.line,
        column: start + 1,
      });
    } else {
      this.tokens.push({
        type: TokenType.RULE,
        value,
        line: this.line,
        column: start + 1,
      });
    }
  }

  private number(): void {
    const start = this.position;

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }

    // Check for range (e.g., 3..20)
    if (!this.isAtEnd() && this.input.substring(this.position, this.position + 2) === '..') {
      this.advance(); // .
      this.advance(); // .

      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }

      const value = this.input.substring(start, this.position);
      this.tokens.push({
        type: TokenType.PARAM,
        value,
        line: this.line,
        column: start + 1,
      });
      return;
    }

    const value = this.input.substring(start, this.position);
    this.tokens.push({
      type: TokenType.PARAM,
      value,
      line: this.line,
      column: start + 1,
    });
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isSpecialChar(char: string): boolean {
    // Special characters that can appear in patterns/regex
    return '/\\[]{}()^$*+?.!@#%&_-~|'.includes(char);
  }
}

/**
 * Parser - converts tokens to AST
 */
export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private errors: ParserError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse the tokens
   */
  parse(): ParsedSchemaResult {
    const fields: ParsedFieldValidation[] = [];

    while (!this.isAtEnd()) {
      try {
        const field = this.parseField();
        if (field) {
          fields.push(field);
        }
      } catch (error) {
        if (error instanceof ParserError) {
          this.errors.push(error);
        } else {
          throw error;
        }
      }
    }

    return { fields, errors: this.errors };
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    return this.tokens[this.current++];
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private parseField(): ParsedFieldValidation | null {
    // Skip newlines
    while (this.match(TokenType.NEWLINE)) {
      // Skip
    }

    if (this.isAtEnd()) {
      return null;
    }

    // Field name
    if (!this.check(TokenType.FIELD_NAME)) {
      const token = this.peek();
      throw new ParserError(
        `Expected field name, got ${token.type}`,
        token.line,
        token.column,
        'fieldName: rule1, rule2'
      );
    }

    const fieldName = this.advance().value;

    // Colon
    if (!this.match(TokenType.COLON)) {
      const token = this.peek();
      throw new ParserError(
        `Expected ':' after field name`,
        token.line,
        token.column,
        `${fieldName}: rule1, rule2`
      );
    }

    // Rules
    const rules: ParsedRule[] = [];

    while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      // Skip commas
      if (this.match(TokenType.COMMA)) {
        continue;
      }

      if (this.check(TokenType.RULE)) {
        const rule = this.parseRule();
        rules.push(rule);
      } else {
        this.advance(); // Skip unexpected token
      }
    }

    return { fieldName, rules };
  }

  private parseRule(): ParsedRule {
    const ruleToken = this.advance();
    const params: string[] = [];

    // Check for param (e.g., min:3)
    if (this.match(TokenType.COLON)) {
      if (this.check(TokenType.PARAM) || this.check(TokenType.RULE)) {
        const paramToken = this.advance();
        params.push(paramToken.value);
      }
    }

    return {
      name: ruleToken.value,
      params,
    };
  }
}

/**
 * Validator mapping - maps rule names to validator functions
 */
export interface ValidatorMap {
  [ruleName: string]: (...params: string[]) => DSLRule | undefined;
}

/**
 * Default validator mapping
 */
export const defaultValidators: ValidatorMap = {
  required: () => ({
    validate: (value) => {
      if (value === null || value === undefined || value === '') {
        return 'This field is required';
      }
      if (Array.isArray(value) && value.length === 0) {
        return 'At least one item is required';
      }
      return null;
    },
    code: 'required',
  }),
  email: () => ({
    validate: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Invalid email format';
    },
    code: 'email',
  }),
  url: () => ({
    validate: (value) => {
      if (!value) return null;
      const urlRegex = /^https?:\/\/.+\..+/;
      return urlRegex.test(value) ? null : 'Invalid URL format';
    },
    code: 'url',
  }),
  phone: () => ({
    validate: (value) => {
      if (!value) return null;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(value) ? null : 'Invalid phone format';
    },
    code: 'phone',
  }),
  min: (value) => ({
    validate: (val) => {
      if (typeof val !== 'string') return null;
      const min = parseInt(value, 10);
      return val.length >= min ? null : `Minimum length is ${min} characters`;
    },
    code: 'min_length',
  }),
  max: (value) => ({
    validate: (val) => {
      if (typeof val !== 'string') return null;
      const max = parseInt(value, 10);
      return val.length <= max ? null : `Maximum length is ${max} characters`;
    },
    code: 'max_length',
  }),
  minlength: (value) => defaultValidators.min(value),
  maxlength: (value) => defaultValidators.max(value),
  minvalue: (value) => ({
    validate: (val) => {
      if (typeof val !== 'number') return null;
      const min = parseInt(value, 10);
      return val >= min ? null : `Minimum value is ${min}`;
    },
    code: 'min_value',
  }),
  maxvalue: (value) => ({
    validate: (val) => {
      if (typeof val !== 'number') return null;
      const max = parseInt(value, 10);
      return val <= max ? null : `Maximum value is ${max}`;
    },
    code: 'max_value',
  }),
  pattern: (value) => ({
    validate: (val) => {
      if (!val) return null;
      try {
        const regex = new RegExp(value);
        return regex.test(val) ? null : 'Invalid format';
      } catch {
        return 'Invalid pattern';
      }
    },
    code: 'pattern',
  }),
  regex: (value) => defaultValidators.pattern(value),
  same: (field) => ({
    validate: (value, allValues) => {
      const targetValue = allValues?.[field];
      return value === targetValue ? null : `Must match ${field}`;
    },
    code: 'same',
  }),
  equals: (value) => ({
    validate: (val) => {
      return val === value ? null : `Must equal ${value}`;
    },
    code: 'equals',
  }),
  unique: (ref) => {
    const [table, field] = ref.split('.');
    return {
      validate: async (value) => {
        if (!value) return null;
        try {
          const response = await fetch(`/api/validate/unique`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table, field, value }),
          });
          const data = await response.json() as { available: boolean };
          return data.available ? null : 'Already exists';
        } catch {
          return 'Validation failed';
        }
      },
      code: 'unique',
    };
  },
  uppercase: () => ({
    validate: (value) => {
      if (!value) return null;
      return /[A-Z]/.test(value) ? null : 'Must contain uppercase letter';
    },
    code: 'uppercase',
  }),
  lowercase: () => ({
    validate: (value) => {
      if (!value) return null;
      return /[a-z]/.test(value) ? null : 'Must contain lowercase letter';
    },
    code: 'lowercase',
  }),
  number: () => ({
    validate: (value) => {
      if (!value) return null;
      return /[0-9]/.test(value) ? null : 'Must contain number';
    },
    code: 'number',
  }),
  special: () => ({
    validate: (value) => {
      if (!value) return null;
      return /[!@#$%^&*]/.test(value) ? null : 'Must contain special character';
    },
    code: 'special',
  }),
  alphanumeric: () => ({
    validate: (value) => {
      if (!value) return null;
      return /^[a-zA-Z0-9]+$/.test(value) ? null : 'Must be alphanumeric';
    },
    code: 'alphanumeric',
  }),
  integer: () => ({
    validate: (value) => {
      if (value === null || value === undefined) return null;
      return Number.isInteger(value) ? null : 'Must be an integer';
    },
    code: 'integer',
  }),
  positive: () => ({
    validate: (value) => {
      if (typeof value !== 'number') return null;
      return value > 0 ? null : 'Must be positive';
    },
    code: 'positive',
  }),
  negative: () => ({
    validate: (value) => {
      if (typeof value !== 'number') return null;
      return value < 0 ? null : 'Must be negative';
    },
    code: 'negative',
  }),
};

/**
 * Convert parsed schema to DSLSchema
 */
export function parsedSchemaToDSLSchema(
  parsed: ParsedSchemaResult,
  validators: ValidatorMap = defaultValidators
): { schema: DSLSchema; errors: ParserError[] } {
  const schema: DSLSchema = {};
  const errors: ParserError[] = [...parsed.errors];

  for (const field of parsed.fields) {
    const rules: DSLRule[] = [];

    for (const rule of field.rules) {
      const validatorFactory = validators[rule.name.toLowerCase()];

      if (!validatorFactory) {
        errors.push(new ParserError(
          `Unknown rule: ${rule.name}`,
          0,
          0,
          `Available rules: ${Object.keys(validators).join(', ')}`
        ));
        continue;
      }

      try {
        const validator = validatorFactory(...(rule.params || []));
        if (validator) {
          rules.push(validator);
        }
      } catch (error) {
        errors.push(new ParserError(
          `Error applying rule ${rule.name}: ${(error as Error).message}`,
          0,
          0
        ));
      }
    }

    if (rules.length > 0) {
      schema[field.fieldName] = rules;
    }
  }

  return { schema, errors };
}

/**
 * Parse DSL string to DSLSchema
 *
 * @param input - DSL string
 * @returns Parsed schema with errors
 */
export function parseDSL(input: string): { schema: DSLSchema; errors: ParserError[] } {
  try {
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const parsed = parser.parse();

    return parsedSchemaToDSLSchema(parsed);
  } catch (error) {
    if (error instanceof LexerError || error instanceof ParserError) {
      return { schema: {}, errors: [error] };
    }
    throw error;
  }
}
