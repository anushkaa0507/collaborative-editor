import { prisma } from "../../config/db";

export async function addCollaborator(documentId: string, email: string, role: "EDITOR" | "VIEWER") {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 404, message: "User with this email not found" };

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };

  if (document.ownerId === user.id) {
    throw { status: 400, message: "Owner cannot be added as a collaborator" };
  }

  const existing = await prisma.documentCollaborator.findUnique({
    where: { documentId_userId: { documentId, userId: user.id } },
  });
  if (existing) throw { status: 409, message: "User is already a collaborator" };

  return prisma.documentCollaborator.create({
    data: { documentId, userId: user.id, role },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export async function listCollaborators(documentId: string) {
  return prisma.documentCollaborator.findMany({
    where: { documentId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateCollaboratorRole(
  documentId: string,
  collaboratorId: string,
  role: "EDITOR" | "VIEWER"
) {
  const collaborator = await prisma.documentCollaborator.findUnique({
    where: { id: collaboratorId },
  });
  if (!collaborator || collaborator.documentId !== documentId) {
    throw { status: 404, message: "Collaborator not found" };
  }

  return prisma.documentCollaborator.update({
    where: { id: collaboratorId },
    data: { role },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export async function removeCollaborator(documentId: string, collaboratorId: string) {
  const collaborator = await prisma.documentCollaborator.findUnique({
    where: { id: collaboratorId },
  });
  if (!collaborator || collaborator.documentId !== documentId) {
    throw { status: 404, message: "Collaborator not found" };
  }

  await prisma.documentCollaborator.delete({ where: { id: collaboratorId } });
}