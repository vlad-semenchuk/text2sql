import * as Joi from 'joi';
import { ObjectPropertiesSchema, SchemaMap } from 'joi';
type EnvKey = keyof typeof process.env | string;
export declare function validateSingleEnv<Type>(key: EnvKey, schema: ObjectPropertiesSchema<Type>): Type;
export declare function validateEnv<TSchema>(schema: SchemaMap<TSchema, true>): TSchema;
export declare class Env {
    static string(key: EnvKey): string;
    static number(key: EnvKey): number;
    static boolean(key: EnvKey): boolean;
    static enum<T extends Record<string, string | number>>(key: EnvKey, enumType: T): T[keyof T];
    static optionalEnum<T extends Record<string, string | number>>(key: EnvKey, enumType: T, defaultValue?: T[keyof T] | undefined): T[keyof T];
    static optionalString(key: EnvKey, defaultValue: string): string;
    static optionalString(key: EnvKey, defaultValue?: string): string | undefined;
    static optionalNumber(key: EnvKey, defaultValue: number): number;
    static optionalNumber(key: EnvKey, defaultValue?: number): number | undefined;
    static optionalBoolean(key: EnvKey, defaultValue?: boolean | undefined): boolean;
    static customNumber(key: EnvKey, fn: (s: Joi.NumberSchema) => Joi.NumberSchema): number;
    static customString(key: EnvKey, fn: (s: Joi.StringSchema) => Joi.StringSchema): string;
    static customBoolean(key: EnvKey, fn: (s: Joi.BooleanSchema) => Joi.BooleanSchema): boolean;
}
export {};
