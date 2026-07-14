import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getDocumentRole } from "../documents/documents.service";

export async function authenticateWsConnection(token: string, documentId: string) {
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }

  const role = await getDocumentRole(documentId, payload.sub);
  if (!role) {
    throw { status: 404, message: "Document not found or access denied" };
  }

  return { userId: payload.sub, role };
}