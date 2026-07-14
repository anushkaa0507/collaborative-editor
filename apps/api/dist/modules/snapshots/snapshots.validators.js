"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSnapshotSchema = exports.snapshotIdParamSchema = exports.documentIdParamSchema = void 0;
const zod_1 = require("zod");
exports.documentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.snapshotIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    snapshotId: zod_1.z.string().uuid(),
});
exports.createSnapshotSchema = zod_1.z.object({
    versionLabel: zod_1.z.string().min(1).max(100),
});
