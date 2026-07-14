import { Request, Response, NextFunction } from "express";
import { pushUpdate, pullUpdates } from "./sync.service";
import { documentIdParamSchema, pushSyncSchema, pullSyncSchema } from "./sync.validators";

export async function push(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const { clientId, seq, update } = pushSyncSchema.parse(req.body);
    const result = await pushUpdate(id, clientId, seq, update, req.userId!);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function pull(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const { stateVector } = pullSyncSchema.parse(req.query);
    const result = await pullUpdates(id, stateVector);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}