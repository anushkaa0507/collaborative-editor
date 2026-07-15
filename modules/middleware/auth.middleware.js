"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing token" });
    }
    const token = header.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        req.userId = payload.sub;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
