"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string(),
    JWT_ACCESS_SECRET: zod_1.z.string(),
    JWT_REFRESH_SECRET: zod_1.z.string(),
    ACCESS_TOKEN_TTL: zod_1.z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.string().default("30"),
});
exports.env = envSchema.parse(process.env);
