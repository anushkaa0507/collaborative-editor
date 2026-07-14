import { z } from "zod";

export const addCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const updateCollaboratorRoleSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const collaboratorParamsSchema = z.object({
  id: z.string().uuid(),
  collaboratorId: z.string().uuid(),
});



export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});