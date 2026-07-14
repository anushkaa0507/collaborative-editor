import { z } from "zod";

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const snapshotIdParamSchema = z.object({
  id: z.string().uuid(),
  snapshotId: z.string().uuid(),
});

export const createSnapshotSchema = z.object({
  versionLabel: z.string().min(1).max(100),
});