import * as Joi from 'joi';
import { ObjectPropertiesSchema, SchemaMap } from 'joi';

type EnvKey = keyof typeof process.env | string;

export function validateSingleEnv<Type>(key: EnvKey, schema: ObjectPropertiesSchema<Type>): Type {
  const result = validateEnv<Record<string, Type>>({ [key]: schema });
  return result[key];
}

export function validateEnv<TSchema>(schema: SchemaMap<TSchema, true>): TSchema {
  const result = Joi.object(schema).validate(process.env, {
    allowUnknown: true,
    stripUnknown: true,
    convert: true,
  });

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.value as TSchema;
}

export class Env {
  static string(key: EnvKey) {
    return this.customString(key, (s) => s.required());
  }

  static number(key: EnvKey) {
    return this.customNumber(key, (s) => s.required());
  }

  static boolean(key: EnvKey): boolean {
    return this.customBoolean(key, (s) => s.required());
  }

  static enum<T extends Record<string, string | number>>(key: EnvKey, enumType: T): T[keyof T] {
    return this.customString(key, (s) => s.valid(...Object.values(enumType)).required()) as T[keyof T];
  }

  static optionalEnum<T extends Record<string, string | number>>(
    key: EnvKey,
    enumType: T,
    defaultValue: T[keyof T] | undefined = undefined,
  ): T[keyof T] {
    return this.customString(key, (s) => {
      const schema = s.valid(...Object.values(enumType)).optional();

      if (defaultValue === undefined) {
        return schema;
      }

      return schema.default(defaultValue);
    }) as T[keyof T];
  }

  static optionalString(key: EnvKey, defaultValue: string): string;
  static optionalString(key: EnvKey, defaultValue?: string): string | undefined;
  static optionalString(key: EnvKey, defaultValue: string | undefined = undefined): string | undefined {
    return this.customString(key, (s) =>
      defaultValue !== undefined ? s.optional().default(defaultValue) : s.optional(),
    );
  }

  static optionalNumber(key: EnvKey, defaultValue: number): number;
  static optionalNumber(key: EnvKey, defaultValue?: number): number | undefined;
  static optionalNumber(key: EnvKey, defaultValue: number | undefined = undefined): number | undefined {
    return this.customNumber(key, (s) =>
      defaultValue !== undefined ? s.optional().default(defaultValue) : s.optional(),
    );
  }

  static optionalBoolean(key: EnvKey, defaultValue: boolean | undefined = undefined): boolean {
    return this.customBoolean(key, (s) =>
      defaultValue !== undefined ? s.optional().default(defaultValue) : s.optional(),
    );
  }

  static customNumber(key: EnvKey, fn: (s: Joi.NumberSchema) => Joi.NumberSchema): number {
    return validateSingleEnv<number>(key, fn(Joi.number()));
  }

  static customString(key: EnvKey, fn: (s: Joi.StringSchema) => Joi.StringSchema): string {
    return validateSingleEnv<string>(key, fn(Joi.string()));
  }

  static customBoolean(key: EnvKey, fn: (s: Joi.BooleanSchema) => Joi.BooleanSchema): boolean {
    return validateSingleEnv<boolean>(key, fn(Joi.boolean()));
  }
}
