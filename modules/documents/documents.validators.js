"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentIdParamSchema = exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
exports.createDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
});
exports.updateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
});
exports.documentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
