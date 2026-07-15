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
exports.createDocument = createDocument;
exports.listDocumentsForUser = listDocumentsForUser;
exports.getDocumentRole = getDocumentRole;
exports.getDocumentById = getDocumentById;
exports.updateDocumentTitle = updateDocumentTitle;
exports.deleteDocument = deleteDocument;
const db_1 = require("../../config/db");
const Y = __importStar(require("yjs"));
function emptyYjsState() {
    const doc = new Y.Doc();
    const state = Buffer.from(Y.encodeStateAsUpdate(doc));
    const stateVector = Buffer.from(Y.encodeStateVector(doc));
    doc.destroy();
    return { state, stateVector };
}
async function createDocument(ownerId, title) {
    const { state, stateVector } = emptyYjsState();
    return db_1.prisma.document.create({
        data: {
            title,
            ownerId,
            state,
            stateVector,
        },
    });
}
async function listDocumentsForUser(userId) {
    return db_1.prisma.document.findMany({
        where: {
            OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            title: true,
            ownerId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
async function getDocumentRole(documentId, userId) {
    const document = await db_1.prisma.document.findUnique({
        where: { id: documentId },
        select: { ownerId: true },
    });
    if (!document)
        return null;
    if (document.ownerId === userId)
        return "OWNER";
    const collaborator = await db_1.prisma.documentCollaborator.findUnique({
        where: { documentId_userId: { documentId, userId } },
    });
    return collaborator?.role ?? null;
}
async function getDocumentById(documentId) {
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    return document;
}
async function updateDocumentTitle(documentId, title) {
    return db_1.prisma.document.update({
        where: { id: documentId },
        data: { title },
    });
}
async function deleteDocument(documentId) {
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    await db_1.prisma.document.delete({ where: { id: documentId } });
}
