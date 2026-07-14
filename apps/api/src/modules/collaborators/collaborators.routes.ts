import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireDocumentRole } from "../middleware/document-access.middleware";
import { add, list, updateRole, remove } from "./collaborators.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", requireDocumentRole("OWNER"), add);
router.get("/", requireDocumentRole("VIEWER"), list);
router.patch("/:collaboratorId", requireDocumentRole("OWNER"), updateRole);
router.delete("/:collaboratorId", requireDocumentRole("OWNER"), remove);

export default router;