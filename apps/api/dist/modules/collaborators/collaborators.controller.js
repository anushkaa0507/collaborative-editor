"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = add;
exports.list = list;
exports.updateRole = updateRole;
exports.remove = remove;
const collaborators_service_1 = require("./collaborators.service");
const collaborators_validators_1 = require("./collaborators.validators");
async function add(req, res, next) {
    try {
        const { id } = collaborators_validators_1.documentIdParamSchema.parse(req.params);
        const { email, role } = collaborators_validators_1.addCollaboratorSchema.parse(req.body);
        const collaborator = await (0, collaborators_service_1.addCollaborator)(id, email, role);
        res.status(201).json(collaborator);
    }
    catch (err) {
        next(err);
    }
}
async function list(req, res, next) {
    try {
        const { id } = collaborators_validators_1.documentIdParamSchema.parse(req.params);
        const collaborators = await (0, collaborators_service_1.listCollaborators)(id);
        res.status(200).json(collaborators);
    }
    catch (err) {
        next(err);
    }
}
async function updateRole(req, res, next) {
    try {
        const { id, collaboratorId } = collaborators_validators_1.collaboratorParamsSchema.parse(req.params);
        const { role } = collaborators_validators_1.updateCollaboratorRoleSchema.parse(req.body);
        const collaborator = await (0, collaborators_service_1.updateCollaboratorRole)(id, collaboratorId, role);
        res.status(200).json(collaborator);
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        const { id, collaboratorId } = collaborators_validators_1.collaboratorParamsSchema.parse(req.params);
        await (0, collaborators_service_1.removeCollaborator)(id, collaboratorId);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
