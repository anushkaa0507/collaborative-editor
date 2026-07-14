"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.getOne = getOne;
exports.restore = restore;
const snapshots_service_1 = require("./snapshots.service");
const snapshots_validators_1 = require("./snapshots.validators");
async function create(req, res, next) {
    try {
        const { id } = snapshots_validators_1.documentIdParamSchema.parse(req.params);
        const { versionLabel } = snapshots_validators_1.createSnapshotSchema.parse(req.body);
        const snapshot = await (0, snapshots_service_1.createSnapshot)(id, versionLabel, req.userId);
        res.status(201).json(snapshot);
    }
    catch (err) {
        next(err);
    }
}
async function list(req, res, next) {
    try {
        const { id } = snapshots_validators_1.documentIdParamSchema.parse(req.params);
        const snapshots = await (0, snapshots_service_1.listSnapshots)(id);
        res.status(200).json(snapshots);
    }
    catch (err) {
        next(err);
    }
}
async function getOne(req, res, next) {
    try {
        const { id, snapshotId } = snapshots_validators_1.snapshotIdParamSchema.parse(req.params);
        const snapshot = await (0, snapshots_service_1.getSnapshotContent)(id, snapshotId);
        res.status(200).json({
            id: snapshot.id,
            versionLabel: snapshot.versionLabel,
            content: Buffer.from(snapshot.content).toString("base64"),
            createdById: snapshot.createdById,
            createdAt: snapshot.createdAt,
        });
    }
    catch (err) {
        next(err);
    }
}
async function restore(req, res, next) {
    try {
        const { id, snapshotId } = snapshots_validators_1.snapshotIdParamSchema.parse(req.params);
        const result = await (0, snapshots_service_1.restoreSnapshot)(id, snapshotId, req.userId);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
