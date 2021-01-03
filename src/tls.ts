import tls from "tls";
import { promises as fs } from "fs";
import chalk from "chalk";
import dotenv from "dotenv";

import type { TLSSocket } from "tls";
import type { Config } from "imap";

dotenv.config();

let nextTag = 0;

async function getCredentials(): Promise<Config> {
  return await fs
    .readFile(process.env.CREDENTIAL_FILE, "utf-8")
    .then(JSON.parse);
}

function log(type: "server" | "client" | "event", msg: string) {
  const prefix = {
    server: chalk.blue("server"),
    client: chalk.red("client"),
    event: chalk.grey("event "),
  }[type];
  const postfix = /(\n|\r)$/.test(msg) ? "" : "\r\n";
  process.stdout.write(`\n${prefix}\n${msg}${postfix}`);
}

async function connect(credentials: Config): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(credentials);

    socket.setEncoding("utf8");

    socket.once("data", data => {
      log("server", data);
      if (/^\* OK/.test(data)) {
        resolve(socket);
      } else {
        reject(new Error(`Connection Error: ${data}`));
      }
    });
  });
}

async function cmd(socket: TLSSocket, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tag = `tag${++nextTag}`;
    const message = `${tag} ${cmd}\r\n`;
    log("client", message);
    const listener = (msg: string) => {
      if (new RegExp(`${tag} OK`)) {
        socket.off("data", listener);
        resolve(msg);
        return;
      }
      if (new RegExp(`${tag} `)) {
        socket.off("data", listener);
        reject(msg);
        return;
      }
    };
    socket.on("data", listener);
    socket.write(message);
  });
}

async function main() {
  try {
    log("event", "Connect");

    const credentials = await getCredentials();
    const socket = await connect(credentials);
    socket.on("data", data => log("server", data));
    socket.on("end", () => log("event", "end"));

    log("event", "Connected");

    await cmd(socket, `CAPABILITY`);
    await cmd(socket, `LOGIN ${credentials.user} ${credentials.password}`);

    log("event", "Disconnecting");
    socket.destroy();
  } catch (error) {
    console.error(error);
  }
}

main();
