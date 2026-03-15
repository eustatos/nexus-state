import { describe, expect, it } from 'vitest';
import {
  arrayLength,
  conditional,
  creditCard,
  custom,
  email,
  equalTo,
  integer,
  length,
  lengthRange,
  matchesField,
  maxLength,
  maxValue,
  minLength,
  minValue,
  negative,
  notEqualTo,
  notOneOf,
  oneOf,
  pattern,
  phone,
  positive,
  required,
  url,
  valueRange,
} from '../validators';

describe('Built-in Validators', () => {
  describe('required', () => {
    it('should fail for empty string', async () => {
      const error = await required.validate('');
      expect(error).toBe('This field is required');
    });

    it('should fail for null', async () => {
      const error = await required.validate(null);
      expect(error).toBe('This field is required');
    });

    it('should fail for undefined', async () => {
      const error = await required.validate(undefined);
      expect(error).toBe('This field is required');
    });

    it('should fail for empty array', async () => {
      const error = await required.validate([]);
      expect(error).toBe('At least one item is required');
    });

    it('should pass for non-empty value', async () => {
      const error = await required.validate('test');
      expect(error).toBeNull();
    });

    it('should pass for non-empty array', async () => {
      const error = await required.validate([1, 2]);
      expect(error).toBeNull();
    });

    it('should pass for zero', async () => {
      const error = await required.validate(0);
      expect(error).toBeNull();
    });

    it('should pass for false', async () => {
      const error = await required.validate(false);
      expect(error).toBeNull();
    });
  });

  describe('minLength', () => {
    it('should fail for string shorter than min', async () => {
      const error = await minLength(5).validate('abc');
      expect(error).toBe('Minimum length is 5 characters');
    });

    it('should pass for string with min length', async () => {
      const error = await minLength(3).validate('abc');
      expect(error).toBeNull();
    });

    it('should pass for longer string', async () => {
      const error = await minLength(3).validate('abcdef');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await minLength(3).validate(123);
      expect(error).toBeNull();
    });

    it('should use custom message', async () => {
      const error = await minLength(5, 'Too short!').validate('abc');
      expect(error).toBe('Too short!');
    });
  });

  describe('maxLength', () => {
    it('should fail for string longer than max', async () => {
      const error = await maxLength(5).validate('abcdef');
      expect(error).toBe('Maximum length is 5 characters');
    });

    it('should pass for string with max length', async () => {
      const error = await maxLength(5).validate('abcde');
      expect(error).toBeNull();
    });

    it('should pass for shorter string', async () => {
      const error = await maxLength(5).validate('abc');
      expect(error).toBeNull();
    });

    it('should use custom message', async () => {
      const error = await maxLength(5, 'Too long!').validate('abcdef');
      expect(error).toBe('Too long!');
    });
  });

  describe('lengthRange', () => {
    it('should fail for string shorter than min', async () => {
      const error = await lengthRange(3, 5).validate('ab');
      expect(error).toBeDefined();
    });

    it('should fail for string longer than max', async () => {
      const error = await lengthRange(3, 5).validate('abcdef');
      expect(error).toBeDefined();
    });

    it('should pass for string in range', async () => {
      const error = await lengthRange(3, 5).validate('abcd');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await lengthRange(3, 5).validate(123);
      expect(error).toBeNull();
    });
  });

  describe('length', () => {
    it('should fail for wrong length', async () => {
      const error = await length(5).validate('abc');
      expect(error).toBeDefined();
    });

    it('should pass for exact length', async () => {
      const error = await length(3).validate('abc');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await length(3).validate(123);
      expect(error).toBeNull();
    });
  });

  describe('minValue', () => {
    it('should fail for number less than min', async () => {
      const error = await minValue(10).validate(5);
      expect(error).toBe('Minimum value is 10');
    });

    it('should pass for number equal to min', async () => {
      const error = await minValue(10).validate(10);
      expect(error).toBeNull();
    });

    it('should pass for number greater than min', async () => {
      const error = await minValue(10).validate(15);
      expect(error).toBeNull();
    });

    it('should skip non-number values', async () => {
      const error = await minValue(10).validate('test');
      expect(error).toBeNull();
    });

    it('should skip NaN', async () => {
      const error = await minValue(10).validate(NaN);
      expect(error).toBeNull();
    });
  });

  describe('maxValue', () => {
    it('should fail for number greater than max', async () => {
      const error = await maxValue(10).validate(15);
      expect(error).toBe('Maximum value is 10');
    });

    it('should pass for number equal to max', async () => {
      const error = await maxValue(10).validate(10);
      expect(error).toBeNull();
    });

    it('should pass for number less than max', async () => {
      const error = await maxValue(10).validate(5);
      expect(error).toBeNull();
    });
  });

  describe('valueRange', () => {
    it('should fail for number less than min', async () => {
      const error = await valueRange(10, 20).validate(5);
      expect(error).toBeDefined();
    });

    it('should fail for number greater than max', async () => {
      const error = await valueRange(10, 20).validate(25);
      expect(error).toBeDefined();
    });

    it('should pass for number in range', async () => {
      const error = await valueRange(10, 20).validate(15);
      expect(error).toBeNull();
    });

    it('should pass for number at min', async () => {
      const error = await valueRange(10, 20).validate(10);
      expect(error).toBeNull();
    });

    it('should pass for number at max', async () => {
      const error = await valueRange(10, 20).validate(20);
      expect(error).toBeNull();
    });
  });

  describe('pattern', () => {
    it('should fail for non-matching string', async () => {
      const error = await pattern(/^[A-Z]+$/).validate('abc');
      expect(error).toBeDefined();
    });

    it('should pass for matching string', async () => {
      const error = await pattern(/^[A-Z]+$/).validate('ABC');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await pattern(/^[A-Z]+$/).validate(123);
      expect(error).toBeNull();
    });

    it('should use custom message', async () => {
      const error = await pattern(/^[A-Z]+$/, 'Uppercase only').validate('abc');
      expect(error).toBe('Uppercase only');
    });
  });

  describe('email', () => {
    it('should fail for invalid email', async () => {
      const error = await email().validate('invalid');
      expect(error).toBe('Invalid email address');
    });

    it('should pass for valid email', async () => {
      const error = await email().validate('test@example.com');
      expect(error).toBeNull();
    });

    it('should pass for email with subdomain', async () => {
      const error = await email().validate('test@mail.example.com');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await email().validate(123);
      expect(error).toBeNull();
    });

    it('should use custom message', async () => {
      const error = await email('Please enter valid email').validate('invalid');
      expect(error).toBe('Please enter valid email');
    });
  });

  describe('url', () => {
    it('should fail for invalid url', async () => {
      const error = await url().validate('not-a-url');
      expect(error).toBe('Invalid URL');
    });

    it('should pass for http url', async () => {
      const error = await url().validate('http://example.com');
      expect(error).toBeNull();
    });

    it('should pass for https url', async () => {
      const error = await url().validate('https://example.com/path?query=1');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await url().validate(123);
      expect(error).toBeNull();
    });
  });

  describe('phone', () => {
    it('should fail for short phone number', async () => {
      const error = await phone().validate('123');
      expect(error).toBeDefined();
    });

    it('should pass for valid phone number', async () => {
      const error = await phone().validate('+1 (555) 123-4567');
      expect(error).toBeNull();
    });

    it('should pass for phone without country code', async () => {
      const error = await phone().validate('5551234567');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await phone().validate(123);
      expect(error).toBeNull();
    });
  });

  describe('creditCard', () => {
    it('should fail for invalid card number', async () => {
      const error = await creditCard().validate('1234567890123456');
      expect(error).toBeDefined();
    });

    it('should pass for valid card number (test)', async () => {
      // Test Visa number
      const error = await creditCard().validate('4111111111111111');
      expect(error).toBeNull();
    });

    it('should fail for too short number', async () => {
      const error = await creditCard().validate('123456');
      expect(error).toBeDefined();
    });

    it('should fail for too long number', async () => {
      const error = await creditCard().validate('12345678901234567890');
      expect(error).toBeDefined();
    });

    it('should skip non-string values', async () => {
      const error = await creditCard().validate(123);
      expect(error).toBeNull();
    });
  });

  describe('equalTo', () => {
    it('should fail for non-equal value', async () => {
      const error = await equalTo('expected').validate('different');
      expect(error).toBeDefined();
    });

    it('should pass for equal value', async () => {
      const error = await equalTo('expected').validate('expected');
      expect(error).toBeNull();
    });

    it('should work with numbers', async () => {
      const error = await equalTo(42).validate(42);
      expect(error).toBeNull();
    });

    it('should use custom message', async () => {
      const error = await equalTo('yes', 'Must be yes').validate('no');
      expect(error).toBe('Must be yes');
    });
  });

  describe('notEqualTo', () => {
    it('should fail for equal value', async () => {
      const error = await notEqualTo('forbidden').validate('forbidden');
      expect(error).toBeDefined();
    });

    it('should pass for non-equal value', async () => {
      const error = await notEqualTo('forbidden').validate('allowed');
      expect(error).toBeNull();
    });
  });

  describe('oneOf', () => {
    it('should fail for value not in list', async () => {
      const error = await oneOf(['a', 'b', 'c']).validate('d');
      expect(error).toBeDefined();
    });

    it('should pass for value in list', async () => {
      const error = await oneOf(['a', 'b', 'c']).validate('b');
      expect(error).toBeNull();
    });

    it('should work with numbers', async () => {
      const error = await oneOf([1, 2, 3]).validate(2);
      expect(error).toBeNull();
    });
  });

  describe('notOneOf', () => {
    it('should fail for value in list', async () => {
      const error = await notOneOf(['a', 'b', 'c']).validate('b');
      expect(error).toBeDefined();
    });

    it('should pass for value not in list', async () => {
      const error = await notOneOf(['a', 'b', 'c']).validate('d');
      expect(error).toBeNull();
    });
  });

  describe('positive', () => {
    it('should fail for zero', async () => {
      const error = await positive().validate(0);
      expect(error).toBeDefined();
    });

    it('should fail for negative number', async () => {
      const error = await positive().validate(-5);
      expect(error).toBeDefined();
    });

    it('should pass for positive number', async () => {
      const error = await positive().validate(5);
      expect(error).toBeNull();
    });

    it('should skip non-number values', async () => {
      const error = await positive().validate('test');
      expect(error).toBeNull();
    });
  });

  describe('negative', () => {
    it('should fail for zero', async () => {
      const error = await negative().validate(0);
      expect(error).toBeDefined();
    });

    it('should fail for positive number', async () => {
      const error = await negative().validate(5);
      expect(error).toBeDefined();
    });

    it('should pass for negative number', async () => {
      const error = await negative().validate(-5);
      expect(error).toBeNull();
    });
  });

  describe('integer', () => {
    it('should fail for float', async () => {
      const error = await integer().validate(3.14);
      expect(error).toBeDefined();
    });

    it('should pass for integer', async () => {
      const error = await integer().validate(5);
      expect(error).toBeNull();
    });

    it('should pass for negative integer', async () => {
      const error = await integer().validate(-5);
      expect(error).toBeNull();
    });

    it('should skip non-number values', async () => {
      const error = await integer().validate('test');
      expect(error).toBeNull();
    });
  });

  describe('arrayLength', () => {
    it('should fail for array with less than min items', async () => {
      const error = await arrayLength(3).validate([1, 2]);
      expect(error).toBeDefined();
    });

    it('should pass for array with min items', async () => {
      const error = await arrayLength(2).validate([1, 2]);
      expect(error).toBeNull();
    });

    it('should fail for array with more than max items', async () => {
      const error = await arrayLength(undefined, 2).validate([1, 2, 3]);
      expect(error).toBeDefined();
    });

    it('should pass for array with max items', async () => {
      const error = await arrayLength(undefined, 3).validate([1, 2, 3]);
      expect(error).toBeNull();
    });

    it('should pass for array in range', async () => {
      const error = await arrayLength(2, 4).validate([1, 2, 3]);
      expect(error).toBeNull();
    });

    it('should skip non-array values', async () => {
      const error = await arrayLength(2).validate('test');
      expect(error).toBeNull();
    });
  });

  describe('custom', () => {
    it('should use custom validation function', async () => {
      const validator = custom((v: string) => (v === 'valid' ? null : 'Not valid'));

      const error1 = await validator.validate('valid');
      expect(error1).toBeNull();

      const error2 = await validator.validate('invalid');
      expect(error2).toBe('Not valid');
    });

    it('should support custom message', async () => {
      const validator = custom(
        (v: string) => (v === 'valid' ? null : 'Error'),
        'Custom message'
      );

      const error = await validator.validate('invalid');
      expect(error).toBe('Custom message');
    });

    it('should support custom code', async () => {
      const validator = custom(
        (v: string) => (v === 'valid' ? null : 'Error'),
        'Custom message',
        'custom_code'
      );

      expect(validator.code).toBe('custom_code');
    });

    it('should receive allValues', async () => {
      const validator = custom((v: string, allValues: any) => {
        return v === allValues?.other ? null : 'Not equal';
      });

      const error1 = await validator.validate('a', { other: 'a' });
      expect(error1).toBeNull();

      const error2 = await validator.validate('a', { other: 'b' });
      expect(error2).toBe('Not equal');
    });
  });

  describe('matchesField', () => {
    it('should fail when fields do not match', async () => {
      const error = await matchesField('password', 'Passwords do not match')
        .validate('password123', { password: 'password456' });
      expect(error).toBe('Passwords do not match');
    });

    it('should pass when fields match', async () => {
      const error = await matchesField('password')
        .validate('password123', { password: 'password123' });
      expect(error).toBeNull();
    });

    it('should pass when allValues is undefined', async () => {
      const error = await matchesField('password')
        .validate('value', undefined);
      expect(error).toBeNull();
    });

    it('should pass when field does not exist in allValues', async () => {
      const error = await matchesField('nonexistent')
        .validate('value', { other: 'value' });
      expect(error).toBeNull();
    });
  });

  describe('conditional', () => {
    it('should skip validation when condition is false', async () => {
      const error = await conditional(
        (_v, all) => (all as any)?.type === 'premium',
        [required]
      ).validate('', { type: 'free' });
      expect(error).toBeNull();
    });

    it('should validate when condition is true', async () => {
      const error = await conditional(
        (_v, all) => (all as any)?.type === 'premium',
        [required]
      ).validate('', { type: 'premium' });
      expect(error).toBe('This field is required');
    });

    it('should work with array of rules', async () => {
      const error = await conditional(
        () => true,
        [required, minLength(5)]
      ).validate('abc', {});
      expect(error).toBe('Minimum length is 5 characters');
    });

    it('should pass all rules when condition is true', async () => {
      const error = await conditional(
        () => true,
        [required, minLength(3)]
      ).validate('abcde', {});
      expect(error).toBeNull();
    });
  });
});
