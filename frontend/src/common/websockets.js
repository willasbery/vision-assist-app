class WebSocketManager {
  constructor(serverIP, options = {}) {
    this.serverIP = serverIP;
    this.ws = null;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectTimeout = options.reconnectTimeout || 3000;
  }

  connect() {
    const wsUrl = `ws://${this.serverIP}:8000/ws`;
    console.log("Connecting to:", wsUrl);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket Connected");
      this.onStatusChange("Connected");
    };

    this.ws.onclose = (e) => {
      console.log("WebSocket Disconnected:", e.code, e.reason);
      this.onStatusChange("Disconnected");
      if (this.autoReconnect) {
        setTimeout(() => this.connect(), this.reconnectTimeout);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        this.onMessage(response);
      } catch (e) {
        console.log("Received message:", event.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.onStatusChange("Error");
      this.onError(error);
    };
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.ws) {
      this.autoReconnect = false;
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketManager; 