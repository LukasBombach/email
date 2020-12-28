import { promises as fs } from "fs";
import { inspect } from "util";
import dotenv from "dotenv";
import Imap from "imap";

import type { Config } from "imap";

async function main() {
  console.log("starting script");

  dotenv.config();

  const credentials: Config = await fs
    .readFile(process.env.CREDENTIAL_FILE, "utf-8")
    .then(JSON.parse);

  const imap = new Imap(credentials);

  imap.once("ready", () =>
    imap.openBox("INBOX", true, (error, box) => {
      if (error) throw error;

      var request = imap.seq.fetch("1:3", {
        bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
        struct: true,
      });

      request.on("message", (msg, seqno) => {
        console.log("Message #%d", seqno);

        var prefix = "(#" + seqno + ") ";

        msg.on("body", (stream, info) => {
          var buffer = "";

          stream.on("data", chunk => {
            buffer += chunk.toString("utf8");
          });

          stream.once("end", () => {
            console.log(
              prefix + "Parsed header: %s",
              inspect(Imap.parseHeader(buffer))
            );
          });
        });

        msg.once("attributes", attrs => {
          console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
        });

        msg.once("end", () => {
          console.log(prefix + "Finished");
        });
      });

      request.once("error", err => {
        console.log("Fetch error: " + err);
      });

      request.once("end", () => {
        console.log("Done fetching all messages!");
        imap.end();
      });
    })
  );

  imap.once("error", (err: Error) => {
    throw err;
  });

  imap.once("end", () => {
    console.log("Connection ended");
  });

  imap.connect();
}

main().catch(console.error);
