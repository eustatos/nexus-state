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

    throw new LexerError(`Unexpected character: ${char}`, this.line, this.column);
  }

  private comment(): void {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
  }

  private identifierOrRule(): void {
    const start = this.position;

    while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
      this.advance();
    }

    const value = this.input.substring(start, this.position);

    // Check if followed by colon (field name) or not (rule)
    if (this.peek() === ':') {
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

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Check for range (e.g., 3..20)
    if (this.input.substring(this.position, this.position + 2) === '..') {
      this.advance(); // .
      this.advance(); // .

      while (this.isDigit(this.peek())) {
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
      this.match(TokenType.COMMA);

      if (this.check(TokenType.RULE)) {
        const rule = this.parseRule();
        rules.push(rule);
      } else if (!this.isAtEnd()) {
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
  [ruleName: string]: (...params: string[]) => DSLRule | null;
}

/**
 * Default validator mapping
 */
export const defaultValidators: ValidatorMap = {
  required: () => required as any,
  email: () => email as any,
  url: () => url as any,
  phone: () => phone as any,
  min: (value) => minLength(parseInt(value, 10)) as any,
  max: (value) => maxLength(parseInt(value, 10)) as any,
  minlength: (value) => minLength(parseInt(value, 10)) as any,
  maxlength: (value) => maxLength(parseInt(value, 10)) as any,
  minvalue: (value) => minValue(parseInt(value, 10)) as any,
  maxvalue: (value) => maxValue(parseInt(value, 10)) as any,
  pattern: (value) => pattern(new RegExp(value)) as any,
  regex: (value) => pattern(new RegExp(value)) as any,
  same: (field) => equalTo(field) as any,
  equals: (value) => equalTo(value) as any,
  unique: (ref) => {
    const [table, field] = ref.split('.');
    return unique(table, field) as any;
  },
  uppercase: () => pattern(/[A-Z]/, 'Must contain uppercase letter') as any,
  lowercase: () => pattern(/[a-z]/, 'Must contain lowercase letter') as any,
  number: () => pattern(/[0-9]/, 'Must contain number') as any,
  special: () => pattern(/[!@#$%^&*]/, 'Must contain special character') as any,
  alphanumeric: () => pattern(/^[a-zA-Z0-9]+$/, 'Must be alphanumeric') as any,
  integer: () => pattern(/^-?\d+$/, 'Must be an integer') as any,
  positive: () => minValue(0) as any,
  negative: () => maxValue(0) as any,
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
