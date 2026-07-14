import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./modules/middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);

app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorHandler);

export default app;