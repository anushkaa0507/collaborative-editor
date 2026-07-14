import { Request, Response, NextFunction } from "express";
import {
  createSnapshot,
  listSnapshots,
  getSnapshotContent,
  restoreSnapshot,
} from "./snapshots.service";
import {
  documentIdParamSchema,
  snapshotIdParamSchema,
  createSnapshotSchema,
} from "./snapshots.validators";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const { versionLabel } = createSnapshotSchema.parse(req.body);
    const snapshot = await createSnapshot(id, versionLabel, req.userId!);
    res.status(201).json(snapshot);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = documentIdParamSchema.parse(req.params);
    const snapshots = await listSnapshots(id);
    res.status(200).json(snapshots);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, snapshotId } = snapshotIdParamSchema.parse(req.params);
    const snapshot = await getSnapshotContent(id, snapshotId);
    res.status(200).json({
      id: snapshot.id,
      versionLabel: snapshot.versionLabel,
      content: Buffer.from(snapshot.content).toString("base64"),
      createdById: snapshot.createdById,
      createdAt: snapshot.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, snapshotId } = snapshotIdParamSchema.parse(req.params);
    const result = await restoreSnapshot(id, snapshotId, req.userId!);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}