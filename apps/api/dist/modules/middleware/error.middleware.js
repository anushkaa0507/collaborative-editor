"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({ message: "Validation error", issues: err.issues });
    }
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({ message });
}
