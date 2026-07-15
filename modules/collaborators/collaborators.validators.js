"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentIdParamSchema = exports.collaboratorParamsSchema = exports.updateCollaboratorRoleSchema = exports.addCollaboratorSchema = void 0;
const zod_1 = require("zod");
exports.addCollaboratorSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(["EDITOR", "VIEWER"]),
});
exports.updateCollaboratorRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["EDITOR", "VIEWER"]),
});
exports.collaboratorParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    collaboratorId: zod_1.z.string().uuid(),
});
exports.documentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
