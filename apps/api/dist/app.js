"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const error_middleware_1 = require("./modules/middleware/error.middleware");
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const collaborators_routes_1 = __importDefault(require("./modules/collaborators/collaborators.routes"));
const sync_routes_1 = __importDefault(require("./modules/sync/sync.routes"));
const snapshots_routes_1 = __importDefault(require("./modules/snapshots/snapshots.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.use("/api/auth", auth_routes_1.default);
app.use("/api/documents", documents_routes_1.default);
app.use("/api/documents/:id/collaborators", collaborators_routes_1.default);
app.use("/api/documents/:id/sync", sync_routes_1.default);
app.use("/api/documents/:id/snapshots", snapshots_routes_1.default);
app.use("/api/documents/:id/assist", ai_routes_1.default);
app.get("/health", (_, res) => {
    res.status(200).json({
        status: "ok",
    });
});
app.use(error_middleware_1.errorHandler);
exports.default = app;
