import { z } from "zod";

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const aiAssistSchema = z.object({
  action: z.enum(["summarize", "fix_grammar", "continue_writing"]),
  text: z.string().min(1).max(20000),
});