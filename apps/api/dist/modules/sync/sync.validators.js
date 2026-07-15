"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullSyncSchema = exports.pushSyncSchema = exports.documentIdParamSchema = void 0;
const zod_1 = require("zod");
const MAX_UPDATE_BYTES = 5 * 1024 * 1024;
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;
exports.documentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.pushSyncSchema = zod_1.z.object({
    clientId: zod_1.z.string().uuid(),
    seq: zod_1.z.number().int().nonnegative(),
    update: zod_1.z
        .string()
        .min(1)
        .refine((val) => BASE64_REGEX.test(val) && val.length % 4 === 0, {
        message: "Update must be valid base64",
    })
        .refine((val) => Buffer.from(val, "base64").length <= MAX_UPDATE_BYTES, {
        message: "Update payload exceeds maximum allowed size",
    }),
});
exports.pullSyncSchema = zod_1.z.object({
    stateVector: zod_1.z.string().optional(),
});
