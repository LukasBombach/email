import tls from "tls";

import type { TLSSocket } from "tls";

export interface Credentials {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export class EmailAccount {
  credentials: Credentials;
  connected = false;
  box: string | null = null;
  socket?: TLSSocket;
  nextTag = 0;

  constructor(credentials: Credentials) {
    this.credentials = credentials;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) return resolve();
      const err = (data: string) => new Error(`Connection Error: ${data}`);
      const isOk = (data: string) => /^\* OK/.test(data);
      const success = () => (this.connected = true) && resolve();
      const failure = (data: string) => reject(err(data));
      const onData = (data: string) => (isOk(data) ? success() : failure(data));
      this.socket = tls.connect(this.credentials);
      this.socket.setEncoding("utf8");
      this.socket.once("data", data => onData(data));
    });
  }

  disconnect() {
    if (this.connected) return;
    this.connected = false;
    this.socket?.destroy();
  }

  async cmd(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const tag = `tag${++this.nextTag}`;
      const message = `${tag} ${cmd}\r\n`;
      let messages = "";
      const listener = (msg: string) => {
        messages += msg;
        if (new RegExp(`${tag} OK`).test(msg)) {
          this.socket?.off("data", listener);
          resolve(messages);
          return;
        }
        if (new RegExp(`${tag} BAD`).test(msg)) {
          this.socket?.off("data", listener);
          reject(messages);
          return;
        }
      };
      this.socket?.on("data", listener);
      this.socket?.write(message);
    });
  }

  async open(box: string) {}

  async fetch(flags: string) {}

  async sync() {}

  on(eventName: string, callback: () => {}) {}

  off(eventName: string, callback: () => {}) {}

  private emit(eventName: string, ...values: any[]) {}
}
