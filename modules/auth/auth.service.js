"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.issueTokens = issueTokens;
exports.refreshTokens = refreshTokens;
exports.logoutUser = logoutUser;
exports.getUserById = getUserById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const db_1 = require("../../config/db");
const env_1 = require("../../config/env");
const ACCESS_TTL = env_1.env.ACCESS_TOKEN_TTL;
const REFRESH_TTL_DAYS = Number(env_1.env.REFRESH_TOKEN_TTL_DAYS);
async function registerUser(email, password, name) {
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        throw { status: 409, message: "Email already registered" };
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await db_1.prisma.user.create({
        data: { email, passwordHash, name },
    });
    return issueTokens(user.id);
}
async function loginUser(email, password) {
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw { status: 401, message: "Invalid credentials" };
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw { status: 401, message: "Invalid credentials" };
    return issueTokens(user.id);
}
async function issueTokens(userId) {
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TTL,
    });
    const refreshToken = (0, crypto_1.randomUUID)();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await db_1.prisma.refreshToken.create({
        data: { token: refreshToken, userId, expiresAt },
    });
    return { accessToken, refreshToken };
}
async function refreshTokens(refreshToken) {
    const stored = await db_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
        throw { status: 401, message: "Invalid or expired refresh token" };
    }
    await db_1.prisma.refreshToken.delete({ where: { id: stored.id } });
    return issueTokens(stored.userId);
}
async function logoutUser(refreshToken) {
    await db_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}
async function getUserById(userId) {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user)
        throw { status: 404, message: "User not found" };
    return user;
}
