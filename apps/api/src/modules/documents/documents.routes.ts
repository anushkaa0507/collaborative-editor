import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireDocumentRole } from "../middleware/document-access.middleware";
import { create, list, getOne, update, remove } from "./documents.controller";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.get("/", list);
router.get("/:id", requireDocumentRole("VIEWER"), getOne);
router.patch("/:id", requireDocumentRole("EDITOR"), update);
router.delete("/:id", requireDocumentRole("OWNER"), remove);

export default router;