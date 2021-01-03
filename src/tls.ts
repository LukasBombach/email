// https://gist.github.com/anhldbk/3ea07d006c0fd411f19c0e362d4e0ec0

import tls from "tls";
import { promises as fs } from "fs";
import dotenv from "dotenv";

import type { Config } from "imap";

dotenv.config();

async function getCredentials(): Promise<Config> {
  return await fs
    .readFile(process.env.CREDENTIAL_FILE, "utf-8")
    .then(JSON.parse);
}

async function getCert(): Promise<string> {
  return await fs.readFile("server-cert.pem", "utf-8");
}

async function main() {
  try {
    const credentials = await getCredentials();
    const serverCert = await getCert();
    const options = {
      ca: [serverCert],
      user: credentials.user,
      password: credentials.password,
    };

    const socket = tls.connect(
      credentials.port,
      credentials.host,
      options,
      () => {
        console.log(
          "client connected",
          socket.authorized ? "authorized" : "unauthorized"
        );

        process.stdin.pipe(socket);
        process.stdin.resume();
      }
    );

    socket.setEncoding("utf8");

    socket.on("data", data => {
      console.log(data);
    });

    socket.on("end", () => {
      console.log("Ended");
    });
  } catch (error) {
    console.error(error);
  }
}

main();
