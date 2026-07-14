"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCollaborator = addCollaborator;
exports.listCollaborators = listCollaborators;
exports.updateCollaboratorRole = updateCollaboratorRole;
exports.removeCollaborator = removeCollaborator;
const db_1 = require("../../config/db");
async function addCollaborator(documentId, email, role) {
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw { status: 404, message: "User with this email not found" };
    const document = await db_1.prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw { status: 404, message: "Document not found" };
    if (document.ownerId === user.id) {
        throw { status: 400, message: "Owner cannot be added as a collaborator" };
    }
    const existing = await db_1.prisma.documentCollaborator.findUnique({
        where: { documentId_userId: { documentId, userId: user.id } },
    });
    if (existing)
        throw { status: 409, message: "User is already a collaborator" };
    return db_1.prisma.documentCollaborator.create({
        data: { documentId, userId: user.id, role },
        include: { user: { select: { id: true, email: true, name: true } } },
    });
}
async function listCollaborators(documentId) {
    return db_1.prisma.documentCollaborator.findMany({
        where: { documentId },
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
    });
}
async function updateCollaboratorRole(documentId, collaboratorId, role) {
    const collaborator = await db_1.prisma.documentCollaborator.findUnique({
        where: { id: collaboratorId },
    });
    if (!collaborator || collaborator.documentId !== documentId) {
        throw { status: 404, message: "Collaborator not found" };
    }
    return db_1.prisma.documentCollaborator.update({
        where: { id: collaboratorId },
        data: { role },
        include: { user: { select: { id: true, email: true, name: true } } },
    });
}
async function removeCollaborator(documentId, collaboratorId) {
    const collaborator = await db_1.prisma.documentCollaborator.findUnique({
        where: { id: collaboratorId },
    });
    if (!collaborator || collaborator.documentId !== documentId) {
        throw { status: 404, message: "Collaborator not found" };
    }
    await db_1.prisma.documentCollaborator.delete({ where: { id: collaboratorId } });
}
