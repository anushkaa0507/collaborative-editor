"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAssistSchema = exports.documentIdParamSchema = void 0;
const zod_1 = require("zod");
exports.documentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.aiAssistSchema = zod_1.z.object({
    action: zod_1.z.enum(["summarize", "fix_grammar", "continue_writing"]),
    text: zod_1.z.string().min(1).max(20000),
});
