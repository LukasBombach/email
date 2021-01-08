import { promises as fs } from "fs";
import tls from "tls";
// import { simpleParser } from "mailparser";
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
    let messages = "";
    const listener = (msg: string) => {
      messages += msg;
      if (new RegExp(`${tag} OK`).test(msg)) {
        socket.off("data", listener);
        log("server", messages);
        resolve(messages);
        return;
      }
      if (new RegExp(`${tag} BAD`).test(msg)) {
        socket.off("data", listener);
        reject(messages);
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
    socket.on("end", () => log("event", "end"));

    log("event", "Connected");

    await cmd(socket, `LOGIN ${credentials.user} ${credentials.password}`);
    await cmd(socket, "SELECT INBOX");
    //await cmd(socket, `UID FETCH 1:* (FLAGS) (CHANGEDSINCE 9109895)`);
    const email = await cmd(socket, "FETCH 1 BODY[]");

    /* // const parsed = await simpleParser(mail);
    // console.log(parsed);
    await cmd(socket, `SELECT INBOX`);
    // await cmd(socket, `UID FETCH 1:* (FLAGS) (CHANGEDSINCE 9109895)`);
    const email = await cmd(
      socket,
      `FETCH 1:1 (FLAGS BODY[HEADER] BODY[TEXT])`
    ); */

    log("event", "Saving Email");
    await fs.writeFile(`${__dirname}/emails/last.email.txt`, email, "utf8");

    log("event", "Disconnecting");
    socket.destroy();
  } catch (error) {
    console.error(error);
  }
}

main();
