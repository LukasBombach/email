import { promises as fs } from "fs";
import { inspect } from "util";

function log(value: any) {
  console.log(inspect(value, { depth: 10, colors: true }));
}

type State = "start" | "header";

const regex = {
  responseHeader: /^\* (?<id>\d+) FETCH \((?<flags>.+?) \{(?<length>\d+)\}$/,
  message: /^(?<key>[!-9;-~]+?):(?<value>.*)/,
  foldingWhiteSpace: /^ (?<value>.*)/,
  multipartBoundary: /^--/,
};

function parseLines(lines: string[]) {
  let state: State = "start";

  for (const line of lines) {
    parseLine(line, state);
  }
}

function parseLine(line: string, state: State) {}

async function main() {
  try {
    const filePath = `${__dirname}/max.email.txt`;
    const text = await fs.readFile(filePath, "utf-8");
    const lines = text.split(/\r?\n/);
    const email = parseLines(lines);

    /* const parsedLines = lines
      .map(line => {
        if (/^\* 1 FETCH/.test(line)) {
          const r = /^\* (?<id>\d+) FETCH \((?<flags>.+?) \{(?<length>\d+)\}$/;
          return { type: "start", ...line.match(r).groups };
        } else if (/^(?<key>[!-9;-~]+?): (?<value>.*)/.test(line)) {
          const r = /^(?<key>[!-9;-~]+?): (?<value>.*)/;
          return { type: "header", ...line.match(r).groups };
        }
      })
      .filter(Boolean); */

    log(parsedLines);
  } catch (error) {
    console.error(error);
  }
}

main();
