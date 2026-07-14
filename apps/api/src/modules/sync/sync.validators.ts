import { z } from "zod";

const MAX_UPDATE_BYTES = 5 * 1024 * 1024;
const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const pushSyncSchema = z.object({
  clientId: z.string().uuid(),
  seq: z.number().int().nonnegative(),
  update: z
    .string()
    .min(1)
    .refine((val) => BASE64_REGEX.test(val) && val.length % 4 === 0, {
      message: "Update must be valid base64",
    })
    .refine((val) => Buffer.from(val, "base64").length <= MAX_UPDATE_BYTES, {
      message: "Update payload exceeds maximum allowed size",
    }),
});

export const pullSyncSchema = z.object({
  stateVector: z.string().optional(),
});