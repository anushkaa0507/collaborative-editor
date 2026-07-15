"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoom = joinRoom;
exports.leaveRoom = leaveRoom;
exports.broadcastToRoom = broadcastToRoom;
exports.getRoomSize = getRoomSize;
const ws_1 = require("ws");
const rooms = new Map();
function joinRoom(documentId, client) {
    if (!rooms.has(documentId)) {
        rooms.set(documentId, new Set());
    }
    rooms.get(documentId).add(client);
}
function leaveRoom(documentId, client) {
    const room = rooms.get(documentId);
    if (!room)
        return;
    room.delete(client);
    if (room.size === 0) {
        rooms.delete(documentId);
    }
}
function broadcastToRoom(documentId, senderSocket, payload) {
    const room = rooms.get(documentId);
    if (!room)
        return;
    const message = JSON.stringify(payload);
    for (const client of room) {
        if (client.socket !== senderSocket && client.socket.readyState === ws_1.WebSocket.OPEN) {
            client.socket.send(message);
        }
    }
}
function getRoomSize(documentId) {
    return rooms.get(documentId)?.size ?? 0;
}
