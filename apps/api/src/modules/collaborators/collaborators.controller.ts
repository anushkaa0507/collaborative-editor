import { Request, Response, NextFunction } from "express";
import {
  addCollaborator,
  listCollaborators,
  updateCollaboratorRole,
  removeCollaborator,
} from "./collaborators.service";
import {
  addCollaboratorSchema,
  updateCollaboratorRoleSchema,
  collaboratorParamsSchema,
  documentIdParamSchema,
} from "./collaborators.validators";

export async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const { email, role } = addCollaboratorSchema.parse(req.body);
    const collaborator = await addCollaborator(id, email, role);
    res.status(201).json(collaborator);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const collaborators = await listCollaborators(id);
    res.status(200).json(collaborators);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, collaboratorId } = collaboratorParamsSchema.parse(req.params);
    const { role } = updateCollaboratorRoleSchema.parse(req.body);
    const collaborator = await updateCollaboratorRole(id, collaboratorId, role);
    res.status(200).json(collaborator);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, collaboratorId } = collaboratorParamsSchema.parse(req.params);
    await removeCollaborator(id, collaboratorId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}