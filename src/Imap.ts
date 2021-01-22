import { Socket } from "net";
import tls, { TLSSocket } from "tls";

export class Imap {
  private netSocket = new Socket();
  private nextTag = 0;

  socket = new TLSSocket(this.netSocket);

  async cmd(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const tag = this.getNextTag();
      const message = `${tag} ${cmd}\r\n`;
      let messages = "";
      const listener = (msg: string) => {
        messages += msg;
        if (new RegExp(`${tag} OK`).test(msg)) {
          this.socket.off("data", listener);
          resolve(messages);
          return;
        }
        if (new RegExp(`${tag} BAD`).test(msg)) {
          this.socket.off("data", listener);
          reject(messages);
          return;
        }
      };
      this.socket.on("data", listener);
      this.socket.write(message);
    });
  }

  private getNextTag(): string {
    return (++this.nextTag).toString().padStart(4, "A");
  }
}
