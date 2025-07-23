import * as dgram from "dgram"; // UDP module
import {  Socket } from "socket.io-client";
import io from "socket.io-client";
class WebSocketToUDP {
  private socket:any =Socket; // WebSocket connection
  private udpClient: dgram.Socket; // UDP client

  constructor(
    private websocketUrl: string,
    private udpHost: string,
    private udpPort: number
  ) {
    // Create WebSocket connection
    this.socket = io(this.websocketUrl, {
      transports: ["websocket"], // Force WebSocket transport
    });

    // Create UDP client
    this.udpClient = dgram.createSocket("udp4");

    this.initializeSocketEvents();
  }

  private initializeSocketEvents(): void {
    // Event: Connection established
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    // Event: AIS message received
    this.socket.on("ais_mesg", (data: { ais_mesg: string; port: string }) => {
      console.log("AIS Message Received:", data);

      // Clean and split AIS message by newline
      const cleanedMessages = this.cleanAndSplitMessages(data.ais_mesg);

      // Send each cleaned AIS message via UDP
      cleanedMessages.forEach((aisMessage) => {
        console.log(`Sending AIS message to UDP server (${this.udpHost}:${this.udpPort}):`, aisMessage);
        this.udpClient.send(aisMessage, this.udpPort, this.udpHost, (err) => {
          if (err) {
            console.error("Error sending UDP message:", err);
          } else {
            console.log("AIS message sent successfully via UDP");
          }
        });
      });
    });

    // Event: Disconnection
    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    // Event: Error handling
    this.socket.on("error", (err: any) => {
      console.error("WebSocket Error:", err);
    });
  }

  private cleanAndSplitMessages(rawMessage: string): string[] {
    // Trim and split raw message by newline
    return rawMessage
      .trim() // Remove leading and trailing whitespace
      .split("\n") // Split by newline
      .map((message) => message.trim()) // Trim each message individually
      .filter((message) => message.length > 0); // Remove empty messages
  }
}

// Instantiate the WebSocket-to-UDP client
const websocketUrl = "http://146.190.89.97:3333"; // WebSocket server URL
const udpHost = "127.0.0.1"; // AvNav IP (use your IP)
const udpPort = 7060; // UDP port configured in AVNUdpReader
const client = new WebSocketToUDP(websocketUrl, udpHost, udpPort);
