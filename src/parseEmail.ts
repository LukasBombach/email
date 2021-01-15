import { promises as fs } from "fs";
import { inspect } from "util";

interface Message {
  flags: string;
  length: number;
  headers: Record<string, string | number>;
  bodies: string[];
}

type ContextType = "root" | "header" | "multipart";

function log(value: any) {
  console.log(inspect(value, { depth: 10, colors: true }));
}

const regex = {
  responseHeader: /^\* (?<id>\d+) FETCH \((?<flags>.+?) \{(?<length>\d+)\}$/,
  header: /^(?<key>[!-9;-~]+?):(?<value>.*)/,
  foldingWhiteSpace: /^ (?<value>.*)/,
  multipartBoundary: /^--(?<value>.*)(?!--)$/,
  multipartClose: /^--(?<value>.*)--$/,
};

function parseLines(lines: string[]) {
  const parsedLines: any[] = [];

  for (const line of lines) {
    const lastLine = parsedLines[parsedLines.length - 1];

    if (lastLine?.type === "multipartBoundary" && !lastLine?.closed) {
      if (regex.multipartClose.test(line)) {
        log("closing the multipart");
        console.log(line);
        lastLine.closed = true;
      } else if (regex.multipartBoundary.test(line)) {
        log("splitting the multipart");
        lastLine.values.push("");
        console.log(line);
      } else {
        log("adding to the multipart");
        console.log(line);
        lastLine.values[lastLine.values.length - 1] += `\n${line}`;
      }
    } else if (regex.multipartBoundary.test(line)) {
      log("opening a mutlipart");
      console.log(line);
      parsedLines.push({
        type: "multipartBoundary",
        values: [""],
        closed: false,
      });
    } else if (regex.responseHeader.test(line)) {
      log("responseHeader");
      console.log(line);
      parsedLines.push({
        type: "responseHeader",
        ...line.match(regex.responseHeader).groups,
      });
    } else if (regex.header.test(line)) {
      log("header");
      console.log(line);
      parsedLines.push({
        type: "header",
        ...line.match(regex.header).groups,
      });
    } else if (regex.foldingWhiteSpace.test(line)) {
      log("header append");
      console.log(line);
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
    const parsed = parseLines(lines);
    log(parsed);

    /* 
    const parsedLines: any[] = [];

    let context: { type: ContextType } & Record<string, any> = { type: "root" };

    function add(type: keyof typeof regex, data: Record<string, string>) {
      parsedLines.push({ type, ...data });
    } */

    /* for (const line of lines) {
      if (context.type === "root") {
        if (regex.responseHeader.test(line)) {
          add("responseHeader", line.match(regex.responseHeader).groups);
        }
      }
    } */
  } catch (error) {
    console.error(error);
  }
}

main();
