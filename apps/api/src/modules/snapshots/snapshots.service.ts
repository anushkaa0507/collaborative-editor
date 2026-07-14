import * as Y from "yjs";
import { prisma } from "../../config/db";

export async function createSnapshot(documentId: string, versionLabel: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };

  const existingLabel = await prisma.documentSnapshot.findFirst({
    where: { documentId, versionLabel },
  });
  if (existingLabel) throw { status: 409, message: "A snapshot with this label already exists" };

  return prisma.documentSnapshot.create({
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

export async function listSnapshots(documentId: string) {
  return prisma.documentSnapshot.findMany({
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

export async function getSnapshotContent(documentId: string, snapshotId: string) {
  const snapshot = await prisma.documentSnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot || snapshot.documentId !== documentId) {
    throw { status: 404, message: "Snapshot not found" };
  }
  return snapshot;
}

export async function restoreSnapshot(documentId: string, snapshotId: string, userId: string) {
  const snapshot = await prisma.documentSnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot || snapshot.documentId !== documentId) {
    throw { status: 404, message: "Snapshot not found" };
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };

  const ydoc = new Y.Doc();
  try {
    if (document.state.length > 0) {
      Y.applyUpdate(ydoc, new Uint8Array(document.state));
    }
    Y.applyUpdate(ydoc, new Uint8Array(snapshot.content));
  } catch {
    ydoc.destroy();
    throw { status: 400, message: "Snapshot content is corrupted and cannot be restored" };
  }

  const restoredState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  const restoredStateVector = Buffer.from(Y.encodeStateVector(ydoc));
  ydoc.destroy();

  const [updatedDocument] = await prisma.$transaction([
    prisma.document.update({
      where: { id: documentId },
      data: { state: restoredState, stateVector: restoredStateVector },
    }),
    prisma.documentSnapshot.create({
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