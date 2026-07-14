"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateWsConnection = authenticateWsConnection;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const documents_service_1 = require("../documents/documents.service");
async function authenticateWsConnection(token, documentId) {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
    }
    catch {
        throw { status: 401, message: "Invalid or expired token" };
    }
    const role = await (0, documents_service_1.getDocumentRole)(documentId, payload.sub);
    if (!role) {
        throw { status: 404, message: "Document not found or access denied" };
    }
    return { userId: payload.sub, role };
}
