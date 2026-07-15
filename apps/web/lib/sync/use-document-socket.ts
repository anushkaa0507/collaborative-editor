"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useToast } from "@/components/ui/toast";

type Role = "OWNER" | "EDITOR" | "VIEWER";

type UseDocumentSocketArgs = {
  documentId: string | undefined;
  ydoc: Y.Doc | null;
  role: Role | null;
  enabled: boolean;
};

function buildWsUrl(documentId: string, token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const wsBase = apiUrl.replace(/\/api\/?$/, "").replace(/^http/, "ws");
  const params = new URLSearchParams({ documentId, token });
  return `${wsBase}/ws?${params.toString()}`;
}

export function useDocumentSocket({ documentId, ydoc, role, enabled }: UseDocumentSocketArgs) {
  const { showError } = useToast();
  const [connected, setConnected] = useState(false);
  const [collaboratorsOnline, setCollaboratorsOnline] = useState(1);

  const socketRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(crypto.randomUUID());
  const seqRef = useRef(0);

  const sendUpdate = useCallback(
    (update: Uint8Array) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      if (role === "VIEWER") return;
      seqRef.current += 1;
      socket.send(
        JSON.stringify({
          type: "update",
          clientId: clientIdRef.current,
          seq: seqRef.current,
          update: Buffer.from(update).toString("base64"),
        })
      );
    },
    [role]
  );

  useEffect(() => {
    if (!enabled || !documentId || !ydoc) return;
    const doc = ydoc;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;

    function connect() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !documentId) return;

      const socket = new WebSocket(buildWsUrl(documentId, token));
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        reconnectAttempts = 0;
        setConnected(true);
        sendUpdate(Y.encodeStateAsUpdate(doc));
      };

      socket.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "connected" || msg.type === "presence") {
          if (typeof msg.collaboratorsOnline === "number") {
            setCollaboratorsOnline(msg.collaboratorsOnline);
          }
        } else if (msg.type === "update" && msg.update) {
          try {
            Y.applyUpdate(doc, new Uint8Array(Buffer.from(msg.update, "base64")), "remote");
          } catch {}
        } else if (msg.type === "error") {
          showError(msg.message || "Sync error");
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectAttempts += 1;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 15000);
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, documentId, ydoc, sendUpdate, showError]);

  return { connected, collaboratorsOnline, sendUpdate };
}