"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
exports.validateSingleEnv = validateSingleEnv;
exports.validateEnv = validateEnv;
const Joi = __importStar(require("joi"));
function validateSingleEnv(key, schema) {
    const result = validateEnv({ [key]: schema });
    return result[key];
}
function validateEnv(schema) {
    const result = Joi.object(schema).validate(process.env, {
        allowUnknown: true,
        stripUnknown: true,
        convert: true,
    });
    if (result.error) {
        throw new Error(`Config validation error: ${result.error.message}`);
    }
    return result.value;
}
class Env {
    static string(key) {
        return this.customString(key, (s) => s.required());
    }
    static number(key) {
        return this.customNumber(key, (s) => s.required());
    }
    static boolean(key) {
        return this.customBoolean(key, (s) => s.required());
    }
    static enum(key, enumType) {
        return this.customString(key, (s) => s.valid(...Object.values(enumType)).required());
    }
    static optionalEnum(key, enumType, defaultValue = undefined) {
        return this.customString(key, (s) => {
            const schema = s.valid(...Object.values(enumType)).optional();
            if (defaultValue === undefined) {
                return schema;
            }
            return schema.default(defaultValue);
        });
    }
    static optionalString(key, defaultValue = undefined) {
        return this.customString(key, (s) => defaultValue !== undefined
            ? s.optional().default(defaultValue)
            : s.optional());
    }
    static optionalNumber(key, defaultValue = undefined) {
        return this.customNumber(key, (s) => defaultValue !== undefined
            ? s.optional().default(defaultValue)
            : s.optional());
    }
    static optionalBoolean(key, defaultValue = undefined) {
        return this.customBoolean(key, (s) => defaultValue !== undefined
            ? s.optional().default(defaultValue)
            : s.optional());
    }
    static customNumber(key, fn) {
        return validateSingleEnv(key, fn(Joi.number()));
    }
    static customString(key, fn) {
        return validateSingleEnv(key, fn(Joi.string()));
    }
    static customBoolean(key, fn) {
        return validateSingleEnv(key, fn(Joi.boolean()));
    }
}
exports.Env = Env;
//# sourceMappingURL=validate-env.js.map