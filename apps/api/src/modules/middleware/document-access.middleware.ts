import { Request, Response, NextFunction } from "express";
import { getDocumentRole } from "../documents/documents.service";
import { documentIdParamSchema } from "../documents/documents.validators";

const ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export function requireDocumentRole(minRole: "VIEWER" | "EDITOR" | "OWNER") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = documentIdParamSchema.parse(req.params);
      const userId = req.userId!;

      const role = await getDocumentRole(id, userId);
      if (!role) throw { status: 404, message: "Document not found" };
      if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
        throw { status: 403, message: "Insufficient permissions" };
      }

      req.documentRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };
}