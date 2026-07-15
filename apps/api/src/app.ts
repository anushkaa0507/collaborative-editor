import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./modules/middleware/error.middleware";
import documentRoutes from "./modules/documents/documents.routes";
import collaboratorRoutes from "./modules/collaborators/collaborators.routes";
import syncRoutes from "./modules/sync/sync.routes";
import snapshotRoutes from "./modules/snapshots/snapshots.routes";
import aiRoutes from "./modules/ai/ai.routes";
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents/:id/collaborators", collaboratorRoutes);
app.use("/api/documents/:id/sync", syncRoutes);
app.use("/api/documents/:id/snapshots", snapshotRoutes);

app.use("/api/documents/:id/assist", aiRoutes);
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorHandler);

export default app;