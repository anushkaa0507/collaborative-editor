import { z } from "zod";

const MAX_UPDATE_BYTES = 5 * 1024 * 1024;

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const pushSyncSchema = z.object({
  clientId: z.string().uuid(),
  seq: z.number().int().nonnegative(),
  update: z
    .string()
    .refine((val) => {
      try {
        const buf = Buffer.from(val, "base64");
        return buf.length > 0 && buf.length <= MAX_UPDATE_BYTES;
      } catch {
        return false;
      }
    }, "Invalid or oversized base64 update payload"),
});

export const pullSyncSchema = z.object({
  stateVector: z.string().optional(),
});