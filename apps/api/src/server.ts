import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { attachWebSocketServer } from "./modules/websocket/ws.server";

const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);
attachWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`WebSocket server attached at ws://localhost:${PORT}/ws`);
});