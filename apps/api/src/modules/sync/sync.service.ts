import * as Y from "yjs";
import { prisma } from "../../config/db";

export async function pushUpdate(
  documentId: string,
  clientId: string,
  seq: number,
  updateBase64: string,
  userId: string
) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };

  const existing = await prisma.syncOperation.findUnique({
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
  if (document.state.length > 0) {
    Y.applyUpdate(ydoc, new Uint8Array(document.state));
  }
  Y.applyUpdate(ydoc, new Uint8Array(updateBuffer));

  const newState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  const newStateVector = Buffer.from(Y.encodeStateVector(ydoc));

  await prisma.$transaction([
    prisma.document.update({
      where: { id: documentId },
      data: { state: newState, stateVector: newStateVector },
    }),
    prisma.syncOperation.create({
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

export async function pullUpdates(documentId: string, clientStateVectorBase64?: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw { status: 404, message: "Document not found" };

  const ydoc = new Y.Doc();
  if (document.state.length > 0) {
    Y.applyUpdate(ydoc, new Uint8Array(document.state));
  }

  let diff: Uint8Array;
  if (clientStateVectorBase64) {
    const clientStateVector = new Uint8Array(Buffer.from(clientStateVectorBase64, "base64"));
    diff = Y.encodeStateAsUpdate(ydoc, clientStateVector);
  } else {
    diff = Y.encodeStateAsUpdate(ydoc);
  }

  const serverStateVector = Y.encodeStateVector(ydoc);
  ydoc.destroy();

  return {
    update: Buffer.from(diff).toString("base64"),
    stateVector: Buffer.from(serverStateVector).toString("base64"),
  };
}