"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
const auth_validators_1 = require("./auth.validators");
const auth_service_1 = require("./auth.service");
async function register(req, res, next) {
    try {
        const data = auth_validators_1.registerSchema.parse(req.body);
        const tokens = await (0, auth_service_1.registerUser)(data.email, data.password, data.name);
        res.status(201).json(tokens);
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const data = auth_validators_1.loginSchema.parse(req.body);
        const tokens = await (0, auth_service_1.loginUser)(data.email, data.password);
        res.status(200).json(tokens);
    }
    catch (err) {
        next(err);
    }
}
async function refresh(req, res, next) {
    try {
        const data = auth_validators_1.refreshSchema.parse(req.body);
        const tokens = await (0, auth_service_1.refreshTokens)(data.refreshToken);
        res.status(200).json(tokens);
    }
    catch (err) {
        next(err);
    }
}
async function logout(req, res, next) {
    try {
        const data = auth_validators_1.refreshSchema.parse(req.body);
        await (0, auth_service_1.logoutUser)(data.refreshToken);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
async function me(req, res, next) {
    try {
        const user = await (0, auth_service_1.getUserById)(req.userId);
        res.status(200).json(user);
    }
    catch (err) {
        next(err);
    }
}
