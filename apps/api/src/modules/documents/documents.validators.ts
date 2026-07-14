import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255),
});

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});