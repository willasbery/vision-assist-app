import { useState, useEffect, useRef } from 'react';
import WebSocketManager from "@/src/common/websockets";

export const useWebSocket = (serverIP, options = {}) => {
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState(null);
  const wsManager = useRef(null);
  const [enabled, setEnabled] = useState(options.enabled ?? true);

  useEffect(() => {
    if (!enabled) return;
    
    if (!serverIP) {
      setStatus("No server IP configured");
      return;
    }

    wsManager.current = new WebSocketManager(serverIP, {
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === "Connected") {
          setError(null);
        }
      },
      onError: (error) => {
        setError("Connection failed. Please check your settings or retry.");
        options.onError?.(error);
      },
      ...options,
      maxReconnectAttempts: options.maxReconnectAttempts || 3,
    });
    
    wsManager.current.connect();
    return () => wsManager.current?.disconnect();
  }, [serverIP, enabled]);

  const retry = () => {
    setError(null);
    wsManager.current?.retry();
  };

  const send = (data) => {
    return wsManager.current?.send(data);
  };

  return {
    status,
    error,
    retry,
    send,
    setError,
    setEnabled
  };
}; 