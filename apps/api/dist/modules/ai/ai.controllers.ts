import { Request, Response, NextFunction } from "express";
import { aiAssistSchema, documentIdParamSchema } from "./ai.validators";
import { runAiAssist } from "./ai.service";

export async function assist(req: Request, res: Response, next: NextFunction) {
  try {
    documentIdParamSchema.parse(req.params);
    const { action, text } = aiAssistSchema.parse(req.body);
    const result = await runAiAssist(action, text);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}