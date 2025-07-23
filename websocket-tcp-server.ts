import { Socket } from "socket.io-client";
import * as net from "net";
import io from "socket.io-client";

class WebSocketTCPServer {
  private socket: any;
  private tcpServer: net.Server;
  private tcpClients: Map<string, net.Socket> = new Map();

  constructor(
    private websocketUrl: string,
    private tcpPort: number,
    private tcpHost: string = "127.0.0.1"
  ) {
    // Create the WebSocket connection
    this.socket = io(this.websocketUrl, {
      transports: ["websocket"],
    });

    // Create TCP server to accept incoming TCP connections
    this.tcpServer = net.createServer((clientSocket) => {
      const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
      console.log(`Local TCP client connected: ${clientId}`);
      
      // Store client reference
      this.tcpClients.set(clientId, clientSocket);

      // Listen for data coming from the TCP client
      clientSocket.on("data", (data: Buffer) => {
        const aisMessage = data.toString().trim();
        console.log("Received data from TCP client:", aisMessage);

        // Send the received AIS message to WebSocket server
        if (aisMessage) {
          this.socket.emit("ais_mesg", { 
            ais_mesg: aisMessage, 
            port: this.tcpPort.toString(),
            clientId: clientId 
          });
          console.log("Sent AIS message to WebSocket server:", aisMessage);
        }
      });

      // Handle client disconnection
      clientSocket.on("end", () => {
        console.log(`Local TCP client disconnected: ${clientId}`);
        this.tcpClients.delete(clientId);
      });

      // Handle client socket errors
      clientSocket.on("error", (err) => {
        console.error(`Error with local TCP client ${clientId}:`, err);
        this.tcpClients.delete(clientId);
      });
    });

    // Start the TCP server
    this.tcpServer.listen(this.tcpPort, this.tcpHost, () => {
      console.log(`TCP server listening on ${this.tcpHost}:${this.tcpPort}`);
    });

    // Handle TCP server errors
    this.tcpServer.on("error", (err) => {
      console.error("Error with TCP server:", err);
    });

    this.initializeWebSocketEvents();
  }

  private initializeWebSocketEvents(): void {
    // Event: Connection established
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    // Event: Disconnection
    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    // Event: Error handling
    this.socket.on("error", (err: any) => {
      console.error("WebSocket Error:", err);
    });

    // Handle WebSocket messages and forward them to ALL TCP clients
    this.socket.on("ais_mesg", (data: { ais_mesg: string; port: string; clientId?: string }) => {
      console.log("AIS message from WebSocket server:", data);

      const aisMessage = data.ais_mesg.trim();
      console.log("Broadcasting AIS message to TCP clients:", aisMessage);

      // Send to all connected TCP clients
      this.tcpClients.forEach((clientSocket, clientId) => {
        try {
          clientSocket.write(`${aisMessage}\n`);
          console.log(`Sent to TCP client ${clientId}: ${aisMessage}`);
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          this.tcpClients.delete(clientId);
        }
      });
    });
  }
}

// Instantiate the combined WebSocket-TCP server
const websocketUrl = "http://146.190.89.97:3333"; // WebSocket server URL
const tcpPort = 5000; // TCP port for listening
const tcpHost = "0.0.0.0"; // Listen on all interfaces
const server = new WebSocketTCPServer(websocketUrl, tcpPort, tcpHost);
