import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireDocumentRole } from "../middleware/document-access.middleware";
import { create, list, getOne, restore } from "./snapshots.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", requireDocumentRole("EDITOR"), create);
router.get("/", requireDocumentRole("VIEWER"), list);
router.get("/:snapshotId", requireDocumentRole("VIEWER"), getOne);
router.post("/:snapshotId/restore", requireDocumentRole("EDITOR"), restore);

export default router;