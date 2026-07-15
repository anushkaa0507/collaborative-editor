"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const ws_server_1 = require("./modules/websocket/ws.server");
const PORT = process.env.PORT || 4000;
const httpServer = (0, http_1.createServer)(app_1.default);
(0, ws_server_1.attachWebSocketServer)(httpServer);
httpServer.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
    console.log(`WebSocket server attached at ws://localhost:${PORT}/ws`);
});
