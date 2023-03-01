import WebSocket from "isomorphic-ws";
import EventEmitter from "events";

export interface Message {
  event: string;
  data: any;
}

class WsEvents extends EventEmitter {}

export class WebSocketClient {
  private static instances: Record<string, WebSocketClient> = {};

  private readonly url: string;
  private ws: WebSocket | null = null;
  private autoConnect: boolean;
  private messageQueue: string[] = [];
  private emitQueue: Message[] = [];

  private readonly wsEvents = new WsEvents();

  private constructor(url: string, autoConnect = true) {
    this.url = url;
    this.autoConnect = autoConnect;
    this.connect();

    this.wsEvents.on("message", (data: any) => {
      if (data.event) {
        this.wsEvents.emit(data.event, data.data);
      }
    });
  }

  public static getInstance(url: string, autoConnect = true): WebSocketClient {
    if (!WebSocketClient.instances[url]) {
      WebSocketClient.instances[url] = new WebSocketClient(url, autoConnect);
    }

    return WebSocketClient.instances[url];
  }

  public send(event: string, data?: any): void {
    const message = JSON.stringify({ event, data });
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
    } else {
      this.ws.send(message);
    }
  }

  public emit(message: Message): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.emitQueue.push(message);
    } else {
      this.wsEvents.emit(message.event, message.data);
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    this.wsEvents.on(event, callback);
  }

  public close(): void {
    this.autoConnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect(): void {
    if (this.ws) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener("open", () => {
      this.processMessageQueue();
      this.processEmitQueue();
    });

    this.ws.addEventListener("message", message => {
      try {
        const data = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
        this.wsEvents.emit("message", data);
      } catch {
        this.wsEvents.emit("message", message.data);
      }
    });

    this.ws.addEventListener("close", () => {
      this.ws = null;
      if (this.autoConnect) {
        setTimeout(() => {
          this.connect();
        }, 1000);
      }
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(message);
      }
    }
  }

  private processEmitQueue(): void {
    while (this.emitQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.emitQueue.shift();
      if (message) {
        this.wsEvents.emit(message.event, message.data);
      }
    }
  }
}
