import { Injectable, Logger } from '@nestjs/common';
import { IsString, MaxLength, validate, ValidationError } from 'class-validator';

export interface SanitizationResult {
  sanitizedInput: string;
  wasModified: boolean;
  securityWarnings: string[];
}

export interface SanitizationOptions {
  maxLength?: number;
  allowEmptyInput?: boolean;
  logSuspiciousActivity?: boolean;
}

@Injectable()
export class InputSanitizationService {
  private readonly logger = new Logger(InputSanitizationService.name);

  // Patterns that could indicate prompt injection attempts
  private readonly suspiciousPatterns = [
    // SQL injection patterns
    /(\bUNION\b|\bSELECT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b|\bALTER\b)/gi,
    // Prompt injection patterns
    /(\bignore\s+previous\b|\bforget\s+instructions\b|\bnew\s+instructions\b)/gi,
    /(\brole\s*:\s*system\b|\brole\s*:\s*assistant\b|\brole\s*:\s*user\b)/gi,
    // Script injection patterns
    /(<script\b|javascript:|data:|vbscript:)/gi,
    // System command patterns
    /(\$\(|`|eval\(|exec\(|system\()/gi,
    // Excessive special characters (potential obfuscation)
    /[!@#$%^&*()+=[\]{};':"\\|,.<>/?]{10,}/g,
  ];

  // Characters to remove/escape
  private readonly dangerousChars = [
    '\x00',
    '\x01',
    '\x02',
    '\x03',
    '\x04',
    '\x05',
    '\x06',
    '\x07',
    '\x08',
    '\x0B',
    '\x0C',
    '\x0E',
    '\x0F',
    '\x10',
    '\x11',
    '\x12',
    '\x13',
    '\x14',
    '\x15',
    '\x16',
    '\x17',
    '\x18',
    '\x19',
    '\x1A',
    '\x1B',
    '\x1C',
    '\x1D',
    '\x1E',
    '\x1F',
    '\x7F',
  ];

  /**
   * Sanitizes user input to prevent prompt injection and other security issues
   */
  async sanitizeInput(input: string, options: SanitizationOptions = {}): Promise<SanitizationResult> {
    const { maxLength = 1000, allowEmptyInput = false, logSuspiciousActivity = true } = options;

    let sanitizedInput = input;
    let wasModified = false;
    const securityWarnings: string[] = [];

    // Validate input using class-validator
    const validationResult = await this.validateInputStructure(input, maxLength, allowEmptyInput);
    if (validationResult.length > 0) {
      const errorMessages = validationResult.map((error) => Object.values(error.constraints || {}).join(', '));
      securityWarnings.push(...errorMessages);

      // For validation errors, we'll still try to sanitize what we can
      if (input.length > maxLength) {
        sanitizedInput = input.substring(0, maxLength);
        wasModified = true;
        securityWarnings.push(`Input truncated to ${maxLength} characters`);
      }
    }

    // Remove dangerous control characters
    const originalLength = sanitizedInput.length;
    sanitizedInput = this.removeDangerousCharacters(sanitizedInput);
    if (sanitizedInput.length !== originalLength) {
      wasModified = true;
      securityWarnings.push('Removed dangerous control characters');
    }

    // Check for suspicious patterns
    const suspiciousMatches = this.detectSuspiciousPatterns(sanitizedInput);
    if (suspiciousMatches.length > 0) {
      securityWarnings.push(...suspiciousMatches);

      if (logSuspiciousActivity) {
        this.logger.warn(
          `Suspicious input detected: ${JSON.stringify({
            originalInput: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
            patterns: suspiciousMatches,
            timestamp: new Date().toISOString(),
          })}`,
        );
      }
    }

    // Normalize whitespace and trim
    const normalizedInput = this.normalizeWhitespace(sanitizedInput);
    if (normalizedInput !== sanitizedInput) {
      sanitizedInput = normalizedInput;
      wasModified = true;
    }

    // Final validation - ensure we don't return empty string unless allowed
    if (!allowEmptyInput && sanitizedInput.trim().length === 0) {
      securityWarnings.push('Input resulted in empty string after sanitization');
    }

    return {
      sanitizedInput,
      wasModified,
      securityWarnings,
    };
  }

  /**
   * Escapes special characters for prompt safety
   */
  escapeForPrompt(input: string): string {
    return input
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/'/g, "\\'") // Escape single quotes
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs
  }

  /**
   * Creates a safe version of input for logging purposes
   */
  createSafeLogVersion(input: string, maxLength: number = 100): string {
    const truncated = input.length > maxLength ? input.substring(0, maxLength) + '...' : input;

    return this.escapeForPrompt(truncated);
  }

  /**
   * Validates input structure using class-validator
   */
  private async validateInputStructure(
    input: string,
    maxLength: number,
    _allowEmptyInput: boolean,
  ): Promise<ValidationError[]> {
    class InputValidation {
      @IsString()
      @MaxLength(maxLength, { message: `Input must not exceed ${maxLength} characters` })
      value: string;

      constructor(value: string) {
        this.value = value;
      }
    }

    const validation = new InputValidation(input);
    return await validate(validation);
  }

  /**
   * Removes dangerous control characters
   */
  private removeDangerousCharacters(input: string): string {
    let cleaned = input;

    for (const char of this.dangerousChars) {
      cleaned = cleaned.replace(new RegExp(char, 'g'), '');
    }

    return cleaned;
  }

  /**
   * Detects potentially malicious patterns in input
   */
  private detectSuspiciousPatterns(input: string): string[] {
    const warnings: string[] = [];

    for (const pattern of this.suspiciousPatterns) {
      const matches = input.match(pattern);
      if (matches && matches.length > 0) {
        warnings.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    return warnings;
  }

  /**
   * Normalizes whitespace in input
   */
  private normalizeWhitespace(input: string): string {
    return input
      .replace(/\s+/g, ' ') // Replace multiple whitespaces with single space
      .replace(/\n{3,}/g, '\n\n') // Limit excessive newlines
      .trim(); // Remove leading/trailing whitespace
  }
}
