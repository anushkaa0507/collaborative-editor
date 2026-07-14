import { WebSocketServer, WebSocket, RawData } from "ws";
import { Server as HttpServer } from "http";
import { URL } from "url";
import { authenticateWsConnection } from "./ws.auth";
import { joinRoom, leaveRoom, broadcastToRoom, getRoomSize, ConnectedClient } from "./room.manager";
import { pushUpdate } from "../sync/sync.service";

const MAX_WS_MESSAGE_BYTES = 5 * 1024 * 1024;

function getRawDataSize(raw: RawData): number {
  if (Buffer.isBuffer(raw)) return raw.length;
  if (Array.isArray(raw)) return raw.reduce((sum, buf) => sum + buf.length, 0);
  return raw.byteLength;
}

export function attachWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", async (socket: WebSocket, request) => {
    try {
      const url = new URL(request.url ?? "", "http://localhost");
      const documentId = url.searchParams.get("documentId");
      const token = url.searchParams.get("token");

      if (!documentId || !token) {
        socket.close(4000, "Missing documentId or token");
        return;
      }

      const { userId, role } = await authenticateWsConnection(token, documentId);

      const client: ConnectedClient = { socket, userId, role };
      joinRoom(documentId, client);

      socket.send(
        JSON.stringify({
          type: "connected",
          documentId,
          role,
          collaboratorsOnline: getRoomSize(documentId),
        })
      );

      socket.on("message", async (raw: RawData) => {
        if (getRawDataSize(raw) > MAX_WS_MESSAGE_BYTES) {
          socket.send(JSON.stringify({ type: "error", message: "Payload too large" }));
          return;
        }

        let parsed: { type: string; clientId?: string; seq?: number; update?: string };
        try {
          parsed = JSON.parse(raw.toString());
        } catch {
          socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
          return;
        }

        if (parsed.type !== "update") return;

        if (role === "VIEWER") {
          socket.send(JSON.stringify({ type: "error", message: "Viewers cannot push updates" }));
          return;
        }

        if (!parsed.clientId || parsed.seq === undefined || !parsed.update) {
          socket.send(JSON.stringify({ type: "error", message: "Malformed update payload" }));
          return;
        }

        try {
          const result = await pushUpdate(documentId, parsed.clientId, parsed.seq, parsed.update, userId);
          broadcastToRoom(documentId, socket, {
            type: "update",
            senderId: userId,
            update: parsed.update,
            stateVector: result.stateVector,
          });
        } catch (err: any) {
          socket.send(JSON.stringify({ type: "error", message: err?.message ?? "Sync failed" }));
        }
      });

      socket.on("close", () => {
        leaveRoom(documentId, client);
        broadcastToRoom(documentId, socket, {
          type: "presence",
          collaboratorsOnline: getRoomSize(documentId),
        });
      });
    } catch (err: any) {
      socket.close(4001, err?.message ?? "Unauthorized");
    }
  });

  return wss;
}