import { promises as fs } from "fs";
import dotenv from "dotenv";
import Imap from "imap";

import type { Config, Box, FetchOptions } from "imap";

interface Message {
  body: string;
  attributes: unknown;
}

dotenv.config();

async function getCredentials(): Promise<Config> {
  return await fs
    .readFile(process.env.CREDENTIAL_FILE, "utf-8")
    .then(JSON.parse);
}

function getImap(credentials: Config): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(credentials);
    imap.once("ready", () => resolve(imap));
    imap.once("error", (err: Error) => reject(err));
    imap.connect();
  });
}

function openBox(imap: Imap, box: string): Promise<Box> {
  return new Promise((resolve, reject) => {
    imap.openBox(box, true, (error, box) => {
      if (error) return reject(error);
      resolve(box);
    });
  });
}

function fetchSequence(
  imap: Imap,
  source: string,
  options: FetchOptions
): Promise<Message[]> {
  return new Promise((resolve, reject) => {
    const request = imap.seq.fetch(source, options);
    const messages: Record<string, Message> = {};
    request.on("message", (message, seqno) => {
      messages[seqno.toString()] = { body: "", attributes: {} };
      message.on("body", stream => {
        stream.on("data", chunk => {
          messages[seqno.toString()].body += chunk.toString("utf8");
        });
      });
      message.once(
        "attributes",
        attrs => (messages[seqno.toString()].attributes = attrs)
      );
    });
    request.once("error", error => reject(error));
    request.once("end", () => resolve(Object.values(messages)));
  });
}

async function main() {
  console.log("starting script");

  const credentials = await getCredentials();
  const imap = await getImap(credentials);
  const box = await openBox(imap, "INBOX");
  const messages = await fetchSequence(imap, "1:3", {
    bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
    struct: true,
  });

  console.log(box);
  console.log(messages);

  imap.end();
}

main().catch(console.error);
