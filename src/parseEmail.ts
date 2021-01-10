import { promises as fs } from "fs";
import { inspect } from "util";

function log(value: any) {
  console.log(inspect(value, { depth: 10, colors: true }));
}

const regex = {
  responseHeader: /^\* (?<id>\d+) FETCH \((?<flags>.+?) \{(?<length>\d+)\}$/,
  header: /^(?<key>[!-9;-~]+?):(?<value>.*)/,
  foldingWhiteSpace: /^ (?<value>.*)/,
  multipartBoundary: /^--(?<value>.*)/,
};

function parseLines(lines: string[]) {
  const parsedLines: any[] = [];

  for (const line of lines) {
    const lastLine = parsedLines[parsedLines.length - 1];

    if (
      lastLine &&
      lastLine.type === "multipartBoundary" &&
      lastLine.closed === false
    ) {
      if (regex.multipartBoundary.test(line)) {
        lastLine.closed = true;
      } else {
        lastLine.value += line;
      }
    } else if (regex.multipartBoundary.test(line)) {
      parsedLines.push({
        type: "multipartBoundary",
        ...line.match(regex.multipartBoundary).groups,
        closed: false,
      });
    } else if (regex.responseHeader.test(line)) {
      parsedLines.push({
        type: "responseHeader",
        ...line.match(regex.responseHeader).groups,
      });
    } else if (regex.header.test(line)) {
      parsedLines.push({
        type: "header",
        ...line.match(regex.header).groups,
      });
    } else if (regex.foldingWhiteSpace.test(line)) {
      parsedLines[parsedLines.length - 1].value += line.match(
        regex.foldingWhiteSpace
      ).groups.value;
    }
  }

  return parsedLines;
}

async function main() {
  try {
    const filePath = `${__dirname}/max.email.txt`;
    const text = await fs.readFile(filePath, "utf-8");
    const lines = text.split(/\r?\n/);
    const parsedLines = parseLines(lines);

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
