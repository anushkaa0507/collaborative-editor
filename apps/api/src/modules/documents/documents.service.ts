import { prisma } from "../../config/db";
import { Role } from "../../generated/prisma";

const EMPTY_BUFFER = Buffer.alloc(0);

export async function createDocument(ownerId: string, title: string) {
  return prisma.document.create({
    data: {
      title,
      ownerId,
      state: EMPTY_BUFFER,
      stateVector: EMPTY_BUFFER,
    },
  });
}

export async function listDocumentsForUser(userId: string) {
  return prisma.document.findMany({
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

export async function getDocumentRole(
  documentId: string,
  userId: string
): Promise<Role | "OWNER" | null> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!document) return null;
  if (document.ownerId === userId) return "OWNER";

  const collaborator = await prisma.documentCollaborator.findUnique({
    where: { documentId_userId: { documentId, userId } },
  });

  return collaborator?.role ?? null;
}

export async function getDocumentById(documentId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };
  return document;
}

export async function updateDocumentTitle(documentId: string, title: string) {
  return prisma.document.update({
    where: { id: documentId },
    data: { title },
  });
}

export async function deleteDocument(documentId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };
  await prisma.document.delete({ where: { id: documentId } });
}