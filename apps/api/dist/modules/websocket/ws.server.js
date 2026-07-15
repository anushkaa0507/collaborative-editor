"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachWebSocketServer = attachWebSocketServer;
const ws_1 = require("ws");
const url_1 = require("url");
const ws_auth_1 = require("./ws.auth");
const room_manager_1 = require("./room.manager");
const sync_service_1 = require("../sync/sync.service");
const MAX_WS_MESSAGE_BYTES = 5 * 1024 * 1024;
function getRawDataSize(raw) {
    if (Buffer.isBuffer(raw))
        return raw.length;
    if (Array.isArray(raw))
        return raw.reduce((sum, buf) => sum + buf.length, 0);
    return raw.byteLength;
}
function attachWebSocketServer(httpServer) {
    const wss = new ws_1.WebSocketServer({ server: httpServer, path: "/ws" });
    wss.on("connection", async (socket, request) => {
        try {
            const url = new url_1.URL(request.url ?? "", "http://localhost");
            const documentId = url.searchParams.get("documentId");
            const token = url.searchParams.get("token");
            if (!documentId || !token) {
                socket.close(4000, "Missing documentId or token");
                return;
            }
            const { userId, role } = await (0, ws_auth_1.authenticateWsConnection)(token, documentId);
            const client = { socket, userId, role };
            (0, room_manager_1.joinRoom)(documentId, client);
            socket.send(JSON.stringify({
                type: "connected",
                documentId,
                role,
                collaboratorsOnline: (0, room_manager_1.getRoomSize)(documentId),
            }));
            socket.on("message", async (raw) => {
                if (getRawDataSize(raw) > MAX_WS_MESSAGE_BYTES) {
                    socket.send(JSON.stringify({ type: "error", message: "Payload too large" }));
                    return;
                }
                let parsed;
                try {
                    parsed = JSON.parse(raw.toString());
                }
                catch {
                    socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
                    return;
                }
                if (parsed.type !== "update")
                    return;
                if (role === "VIEWER") {
                    socket.send(JSON.stringify({ type: "error", message: "Viewers cannot push updates" }));
                    return;
                }
                if (!parsed.clientId || parsed.seq === undefined || !parsed.update) {
                    socket.send(JSON.stringify({ type: "error", message: "Malformed update payload" }));
                    return;
                }
                try {
                    const result = await (0, sync_service_1.pushUpdate)(documentId, parsed.clientId, parsed.seq, parsed.update, userId);
                    (0, room_manager_1.broadcastToRoom)(documentId, socket, {
                        type: "update",
                        senderId: userId,
                        update: parsed.update,
                        stateVector: result.stateVector,
                    });
                }
                catch (err) {
                    socket.send(JSON.stringify({ type: "error", message: err?.message ?? "Sync failed" }));
                }
            });
            socket.on("close", () => {
                (0, room_manager_1.leaveRoom)(documentId, client);
                (0, room_manager_1.broadcastToRoom)(documentId, socket, {
                    type: "presence",
                    collaboratorsOnline: (0, room_manager_1.getRoomSize)(documentId),
                });
            });
        }
        catch (err) {
            socket.close(4001, err?.message ?? "Unauthorized");
        }
    });
    return wss;
}
