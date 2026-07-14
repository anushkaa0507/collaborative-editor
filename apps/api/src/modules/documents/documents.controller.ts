import { Request, Response, NextFunction } from "express";
import {
  createDocument,
  listDocumentsForUser,
  getDocumentById,
  updateDocumentTitle,
  deleteDocument,
} from "./documents.service";
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdParamSchema,
} from "./documents.validators";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { title } = createDocumentSchema.parse(req.body);
    const document = await createDocument(req.userId!, title);
    res.status(201).json({
      id: document.id,
      title: document.title,
      ownerId: document.ownerId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const documents = await listDocumentsForUser(req.userId!);
    res.status(200).json(documents);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const document = await getDocumentById(id);
    res.status(200).json({
      id: document.id,
      title: document.title,
      ownerId: document.ownerId,
      state: Buffer.from(document.state).toString("base64"),
      stateVector: Buffer.from(document.stateVector).toString("base64"),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      role: req.documentRole,
    });
  } catch (err) {
    next(err);
  }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const { title } = updateDocumentSchema.parse(req.body);
    const document = await updateDocumentTitle(id, title);
    res.status(200).json({
      id: document.id,
      title: document.title,
      updatedAt: document.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    await deleteDocument(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}