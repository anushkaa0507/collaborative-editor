"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.push = push;
exports.pull = pull;
const sync_service_1 = require("./sync.service");
const sync_validators_1 = require("./sync.validators");
async function push(req, res, next) {
    try {
        const { id } = sync_validators_1.documentIdParamSchema.parse(req.params);
        const { clientId, seq, update } = sync_validators_1.pushSyncSchema.parse(req.body);
        const result = await (0, sync_service_1.pushUpdate)(id, clientId, seq, update, req.userId);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function pull(req, res, next) {
    try {
        const { id } = sync_validators_1.documentIdParamSchema.parse(req.params);
        const { stateVector } = sync_validators_1.pullSyncSchema.parse(req.query);
        const result = await (0, sync_service_1.pullUpdates)(id, stateVector);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
