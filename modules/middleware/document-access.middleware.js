"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDocumentRole = requireDocumentRole;
const documents_service_1 = require("../documents/documents.service");
const documents_validators_1 = require("../documents/documents.validators");
const ROLE_RANK = {
    VIEWER: 1,
    EDITOR: 2,
    OWNER: 3,
};
function requireDocumentRole(minRole) {
    return async (req, res, next) => {
        try {
            const { id } = documents_validators_1.documentIdParamSchema.parse(req.params);
            const userId = req.userId;
            const role = await (0, documents_service_1.getDocumentRole)(id, userId);
            if (!role)
                throw { status: 404, message: "Document not found" };
            if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
                throw { status: 403, message: "Insufficient permissions" };
            }
            req.documentRole = role;
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
