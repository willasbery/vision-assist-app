class WebSocketManager {
  constructor(serverIP, options = {}) {
    this.serverIP = serverIP;
    this.ws = null;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectTimeout = options.reconnectTimeout || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 3;
    this.reconnectAttempts = 0;
    this.isManuallyDisconnected = false;
  }

  connect() {
    if (!this.serverIP) {
      this.onError(new Error("No server IP provided"));
      return;
    }

    const wsUrl = `ws://${this.serverIP}:8000/ws`;
    console.log("Connecting to:", wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket Connected");
        this.reconnectAttempts = 0;
        this.onStatusChange("Connected");
      };

      this.ws.onclose = (e) => {
        console.log("WebSocket Disconnected:", e.code, e.reason);
        this.onStatusChange("Disconnected");
        
        if (this.autoReconnect && !this.isManuallyDisconnected) {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectTimeout);
            this.onStatusChange(`Reconnecting (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          } else {
            this.onError(new Error("Maximum reconnection attempts reached"));
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.onMessage(response);
        } catch (e) {
          console.warn("Failed to parse message:", event.data);
        }
      };

      this.ws.onerror = (error) => {
        // console.error("WebSocket error:", error);
        this.onStatusChange("Error");
        this.onError(error);
      };
    } catch (error) {
      // console.error("Failed to create WebSocket connection:", error);
      this.onError(error);
    }
  }

  send(message) {
    if (!this.ws) {
      return false;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  retry() {
    this.isManuallyDisconnected = false;
    this.autoReconnect = true;
    this.reconnectAttempts = 0;
    this.connect();
  }
}

export default WebSocketManager; 