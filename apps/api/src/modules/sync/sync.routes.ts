import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireDocumentRole } from "../middleware/document-access.middleware";
import { push, pull } from "./sync.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/push", requireDocumentRole("EDITOR"), push);
router.get("/pull", requireDocumentRole("VIEWER"), pull);

export default router;