"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.getOne = getOne;
exports.update = update;
exports.remove = remove;
const documents_service_1 = require("./documents.service");
const documents_validators_1 = require("./documents.validators");
async function create(req, res, next) {
    try {
        const { title } = documents_validators_1.createDocumentSchema.parse(req.body);
        const document = await (0, documents_service_1.createDocument)(req.userId, title);
        res.status(201).json({
            id: document.id,
            title: document.title,
            ownerId: document.ownerId,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        });
    }
    catch (err) {
        next(err);
    }
}
async function list(req, res, next) {
    try {
        const documents = await (0, documents_service_1.listDocumentsForUser)(req.userId);
        res.status(200).json(documents);
    }
    catch (err) {
        next(err);
    }
}
async function getOne(req, res, next) {
    try {
        const { id } = documents_validators_1.documentIdParamSchema.parse(req.params);
        const document = await (0, documents_service_1.getDocumentById)(id);
        res.status(200).json({
            id: document.id,
            title: document.title,
            ownerId: document.ownerId,
            state: Buffer.from(document.state).toString("base64"),
            stateVector: Buffer.from(document.stateVector).toString("base64"),
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            role: req.documentRole,
        });
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const { id } = documents_validators_1.documentIdParamSchema.parse(req.params);
        const { title } = documents_validators_1.updateDocumentSchema.parse(req.body);
        const document = await (0, documents_service_1.updateDocumentTitle)(id, title);
        res.status(200).json({
            id: document.id,
            title: document.title,
            updatedAt: document.updatedAt,
        });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        const { id } = documents_validators_1.documentIdParamSchema.parse(req.params);
        await (0, documents_service_1.deleteDocument)(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
