import { useEffect, useRef, useCallback } from "react";
import useAppStore from "../store/useAppStore";
import { WS_URL } from "../api/client";

export default function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const setDetectionResult = useAppStore((s) => s.setDetectionResult);
  const setBackendConnected = useAppStore((s) => s.setBackendConnected);
  const setCameraConnected = useAppStore((s) => s.setCameraConnected);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("[WS] Connected");
        setBackendConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setDetectionResult(data);
          setCameraConnected(true);
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected");
        setBackendConnected(false);
        // Auto-reconnect after 3 seconds
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
        setBackendConnected(false);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[WS] Connection failed:", e);
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [setDetectionResult, setBackendConnected, setCameraConnected]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return wsRef;
}
