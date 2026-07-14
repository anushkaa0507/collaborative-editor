import { WebSocket } from "ws";

interface ConnectedClient {
  socket: WebSocket;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
}

const rooms = new Map<string, Set<ConnectedClient>>();

export function joinRoom(documentId: string, client: ConnectedClient) {
  if (!rooms.has(documentId)) {
    rooms.set(documentId, new Set());
  }
  rooms.get(documentId)!.add(client);
}

export function leaveRoom(documentId: string, client: ConnectedClient) {
  const room = rooms.get(documentId);
  if (!room) return;
  room.delete(client);
  if (room.size === 0) {
    rooms.delete(documentId);
  }
}

export function broadcastToRoom(documentId: string, senderSocket: WebSocket, payload: unknown) {
  const room = rooms.get(documentId);
  if (!room) return;

  const message = JSON.stringify(payload);
  for (const client of room) {
    if (client.socket !== senderSocket && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(message);
    }
  }
}

export function getRoomSize(documentId: string): number {
  return rooms.get(documentId)?.size ?? 0;
}

export type { ConnectedClient };