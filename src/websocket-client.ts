import WebSocket from "isomorphic-ws";
import EventEmitter from "node:events";

export interface Message {
  event: string;
  data: any;
}

class WsEvents extends EventEmitter {}

const getValidUrl = (url: string): string => {
  const regex = /^(ws|http)s?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/\S*)?$/;
  if (regex.test(url)) {
    const uri = new URL(url);
    if (uri.protocol === "http:") uri.protocol = "ws:";
    if (uri.protocol === "https:") uri.protocol = "wss:";
    return uri.toString();
  }

  if (typeof window !== "undefined") {
    const isSsl = window.location.protocol === "https:" || window.location.hostname === "wss:";
    const protocol = isSsl ? "wss:" : "ws:";

    if (url.startsWith("/") && !url.startsWith("//")) {
      return `${protocol}//${window.location.host}${url}`;
    }

    const uri = new URL(url);
    uri.protocol = protocol;
    url.startsWith("/") && (uri.host = window.location.host);
    return uri.toString();
  }

  return url;
};

export class WebSocketClient {
  private static instances: Record<string, WebSocketClient> = {};

  private ws: WebSocket | null = null;
  private messageQueue: string[] = [];
  private emitQueue: Message[] = [];

  private readonly wsEvents = new WsEvents();

  private constructor(private readonly url: string, private autoConnect = true) {
    this.url = getValidUrl(url);
    this.autoConnect = autoConnect;
    this.connect();

    this.wsEvents.on("message", (data: Message) => {
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

    this.ws.addEventListener("message", (message: Message) => {
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
