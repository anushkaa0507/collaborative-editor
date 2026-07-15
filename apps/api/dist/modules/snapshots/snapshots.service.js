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
exports.createSnapshot = createSnapshot;
exports.listSnapshots = listSnapshots;
exports.getSnapshotContent = getSnapshotContent;
exports.restoreSnapshot = restoreSnapshot;
const Y = __importStar(require("yjs"));
const db_1 = require("../../config/db");
async function createSnapshot(documentId, versionLabel, userId) {
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    const existingLabel = await db_1.prisma.documentSnapshot.findFirst({
        where: { documentId, versionLabel },
    });
    if (existingLabel)
        throw { status: 409, message: "A snapshot with this label already exists" };
    return db_1.prisma.documentSnapshot.create({
        data: {
            documentId,
            versionLabel,
            content: document.state,
            createdById: userId,
        },
        select: {
            id: true,
            versionLabel: true,
            createdById: true,
            createdAt: true,
        },
    });
}
async function listSnapshots(documentId) {
    return db_1.prisma.documentSnapshot.findMany({
        where: { documentId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            versionLabel: true,
            createdById: true,
            createdAt: true,
        },
    });
}
async function getSnapshotContent(documentId, snapshotId) {
    const snapshot = await db_1.prisma.documentSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot || snapshot.documentId !== documentId) {
        throw { status: 404, message: "Snapshot not found" };
    }
    return snapshot;
}
async function restoreSnapshot(documentId, snapshotId, userId) {
    const snapshot = await db_1.prisma.documentSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot || snapshot.documentId !== documentId) {
        throw { status: 404, message: "Snapshot not found" };
    }
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    const ydoc = new Y.Doc();
    try {
        if (document.state.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(document.state));
        }
        Y.applyUpdate(ydoc, new Uint8Array(snapshot.content));
    }
    catch {
        ydoc.destroy();
        throw { status: 400, message: "Snapshot content is corrupted and cannot be restored" };
    }
    const restoredState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    const restoredStateVector = Buffer.from(Y.encodeStateVector(ydoc));
    ydoc.destroy();
    const [updatedDocument] = await db_1.prisma.$transaction([
        db_1.prisma.document.update({
            where: { id: documentId },
            data: { state: restoredState, stateVector: restoredStateVector },
        }),
        db_1.prisma.documentSnapshot.create({
            data: {
                documentId,
                versionLabel: `restore-of-${snapshot.versionLabel}-${Date.now()}`,
                content: restoredState,
                createdById: userId,
            },
        }),
    ]);
    return {
        id: updatedDocument.id,
        stateVector: Buffer.from(updatedDocument.stateVector).toString("base64"),
    };
}
