"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assist = assist;
const ai_validators_1 = require("./ai.validators");
const ai_service_1 = require("./ai.service");
async function assist(req, res, next) {
    try {
        ai_validators_1.documentIdParamSchema.parse(req.params);
        const { action, text } = ai_validators_1.aiAssistSchema.parse(req.body);
        const result = await (0, ai_service_1.runAiAssist)(action, text);
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
