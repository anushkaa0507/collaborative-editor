import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireDocumentRole } from "../middleware/document-access.middleware";
import { assist } from "./ai.controllers";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.post("/assist", requireDocumentRole("EDITOR"), assist);

export default router;