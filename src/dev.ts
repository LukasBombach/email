import { promises as fs } from "fs";
import { resolve } from "path";
import { inspect } from "util";
import dotenv from "dotenv";
import Imap from "imap";

import type { Config, Box, FetchOptions } from "imap";

interface Message {
  body: string;
  attributes?: Attributes;
}

type Attributes = {
  uid: number;
  flags: unknown[];
  date: Date;
  struct: unknown[];
  size: number;
} & Record<string, unknown>;

type Criterion = string | string[];

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
    imap.openBox(box, true, (error, box) =>
      error ? reject(error) : resolve(box)
    );
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
      messages[seqno.toString()] = { body: "" };
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

function search(imap: Imap, ...criteria: Criterion[]): Promise<number[]> {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (error, ids) =>
      error ? reject(error) : resolve(ids)
    );
  });
}

async function main() {
  try {
    const credentials = await getCredentials();
    const imap = await getImap(credentials);

    try {
      console.log("starting script");

      const { default: highestmodseqs } = await import("./highestmodseq.json");

      const fetchOptions: FetchOptions = {
        struct: false,
        envelope: false,
        size: false,
        modifiers: {
          changedsince: "9108115",
        },
      };

      const box = await openBox(imap, "INBOX");
      const messages = await fetchSequence(imap, "1:*", fetchOptions);
      const newHighestmodseq = (box as any).highestmodseq;

      if (highestmodseqs[highestmodseqs.length - 1] !== newHighestmodseq) {
        await fs.writeFile(
          resolve(__dirname, "highestmodseq.json"),
          JSON.stringify([...highestmodseqs, newHighestmodseq], null, 2),
          "utf-8"
        );
      }

      console.log(inspect(messages, { colors: true, depth: 10 }));
      imap.end();
    } catch (error) {
      console.error(error);
      imap.end();
    }
  } catch (error) {
    console.error(error);
  }
}

main();
