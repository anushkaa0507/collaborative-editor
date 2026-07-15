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
exports.pushUpdate = pushUpdate;
exports.pullUpdates = pullUpdates;
const Y = __importStar(require("yjs"));
const db_1 = require("../../config/db");
async function pushUpdate(documentId, clientId, seq, updateBase64, userId) {
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    const existing = await db_1.prisma.syncOperation.findUnique({
        where: { documentId_clientId_seq: { documentId, clientId, seq } },
    });
    if (existing) {
        return {
            alreadyApplied: true,
            stateVector: Buffer.from(document.stateVector).toString("base64"),
        };
    }
    const updateBuffer = Buffer.from(updateBase64, "base64");
    const ydoc = new Y.Doc();
    try {
        if (document.state.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(document.state));
        }
        Y.applyUpdate(ydoc, new Uint8Array(updateBuffer));
    }
    catch {
        ydoc.destroy();
        throw { status: 400, message: "Invalid sync update payload" };
    }
    const newState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    const newStateVector = Buffer.from(Y.encodeStateVector(ydoc));
    await db_1.prisma.$transaction([
        db_1.prisma.document.update({
            where: { id: documentId },
            data: { state: newState, stateVector: newStateVector },
        }),
        db_1.prisma.syncOperation.create({
            data: {
                documentId,
                clientId,
                seq,
                update: updateBuffer,
                createdById: userId,
            },
        }),
    ]);
    ydoc.destroy();
    return { alreadyApplied: false, stateVector: newStateVector.toString("base64") };
}
async function pullUpdates(documentId, clientStateVectorBase64) {
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    const ydoc = new Y.Doc();
    try {
        if (document.state.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(document.state));
        }
    }
    catch {
        ydoc.destroy();
        throw { status: 500, message: "Corrupted document state" };
    }
    let diff;
    try {
        if (clientStateVectorBase64) {
            const clientStateVector = new Uint8Array(Buffer.from(clientStateVectorBase64, "base64"));
            diff = Y.encodeStateAsUpdate(ydoc, clientStateVector);
        }
        else {
            diff = Y.encodeStateAsUpdate(ydoc);
        }
    }
    catch {
        ydoc.destroy();
        throw { status: 400, message: "Invalid state vector" };
    }
    const serverStateVector = Y.encodeStateVector(ydoc);
    ydoc.destroy();
    return {
        update: Buffer.from(diff).toString("base64"),
        stateVector: Buffer.from(serverStateVector).toString("base64"),
    };
}
