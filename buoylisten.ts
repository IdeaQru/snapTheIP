import * as net from "net";

class TCPBridge {
  private tcpServer: net.Server;
  private tcpClients: Map<string, net.Socket> = new Map();

  constructor(
    private tcpPort: number,
    private tcpHost: string = "0.0.0.0"
  ) {
    // Create TCP server to accept incoming TCP connections
    this.tcpServer = net.createServer((clientSocket) => {
      const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
      console.log(`🔗 TCP client connected: ${clientId}`);
      
      // Store client reference
      this.tcpClients.set(clientId, clientSocket);

      // INPUT: Listen for data from TCP clients only
      clientSocket.on("data", (data: Buffer) => {
        const message = data.toString().trim();
        console.log(`📨 [INPUT] Data from TCP client ${clientId}:`, message);

        // OUTPUT: Broadcast to ALL other TCP clients (except sender)
        this.broadcastToTCPClients(message, clientId);
      });

      // Handle client disconnection
      clientSocket.on("end", () => {
        console.log(`❌ TCP client disconnected: ${clientId}`);
        this.tcpClients.delete(clientId);
      });

      // Handle client socket errors
      clientSocket.on("error", (err) => {
        console.error(`💥 Error with TCP client ${clientId}:`, err);
        this.tcpClients.delete(clientId);
      });
    });

    // Start the TCP server
    this.tcpServer.listen(this.tcpPort, this.tcpHost, () => {
      console.log(`🚀 TCP server listening on ${this.tcpHost}:${this.tcpPort}`);
    });

    // Handle TCP server errors
    this.tcpServer.on("error", (err) => {
      console.error("💥 Error with TCP server:", err);
    });
  }

  // OUTPUT: Method to broadcast message to all TCP clients
  private broadcastToTCPClients(message: string, excludeClientId?: string): void {
    if (this.tcpClients.size === 0) {
      console.log("⚠️  No TCP clients connected to broadcast to");
      return;
    }

    console.log(`📤 [OUTPUT] Broadcasting to ${this.tcpClients.size} TCP clients:`, message);

    let successCount = 0;
    let failCount = 0;

    this.tcpClients.forEach((clientSocket, clientId) => {
      // Skip sender if excludeClientId is provided
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }

      try {
        clientSocket.write(`${message}\n`);
        console.log(`✅ Sent to TCP client ${clientId}`);
        successCount++;
      } catch (error) {
        console.error(`💥 Error sending to client ${clientId}:`, error);
        this.tcpClients.delete(clientId);
        failCount++;
      }
    });

    console.log(`📊 Broadcast result: ${successCount} success, ${failCount} failed`);
  }

  // Method to get connected clients info
  public getConnectedClients(): string[] {
    return Array.from(this.tcpClients.keys());
  }

  // Method to manually send message to specific client
  public sendToClient(clientId: string, message: string): boolean {
    const clientSocket = this.tcpClients.get(clientId);
    if (clientSocket) {
      try {
        clientSocket.write(`${message}\n`);
        console.log(`✅ Message sent to specific client ${clientId}:`, message);
        return true;
      } catch (error) {
        console.error(`💥 Error sending to specific client ${clientId}:`, error);
        this.tcpClients.delete(clientId);
        return false;
      }
    } else {
      console.error(`❌ Client ${clientId} not found`);
      return false;
    }
  }

  // Method to close the server
  public close(): void {
    this.tcpServer.close(() => {
      console.log("🛑 TCP server closed");
    });
    
    // Close all client connections
    this.tcpClients.forEach((clientSocket, clientId) => {
      clientSocket.end();
      console.log(`🔌 Closed connection to client ${clientId}`);
    });
    
    this.tcpClients.clear();
  }
}

// Instantiate the TCP bridge
const tcpPort = 5008; // TCP port for listening
const tcpHost = "0.0.0.0"; // Listen on all interfaces

const bridge = new TCPBridge(tcpPort, tcpHost);

// Optional: Log connected clients every 30 seconds
setInterval(() => {
  const clients = bridge.getConnectedClients();
  console.log(`📋 Currently connected TCP clients: ${clients.length}`);
  clients.forEach(client => console.log(`   - ${client}`));
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bridge.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bridge.close();
  process.exit(0);
});
