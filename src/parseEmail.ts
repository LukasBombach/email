import { promises as fs } from "fs";
import { inspect } from "util";

interface Message {
  flags: string;
  length: number;
  headers: Record<string, string | number>;
  bodies: string[];
}

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

async function main() {
  try {
    const filePath = `${__dirname}/max.email.txt`;
    const text = await fs.readFile(filePath, "utf-8");

    const secondLine = text.indexOf("\n");
    const split = text.indexOf("\n\n");
    const lastLine = text.lastIndexOf("\n)\n");

    const headers = text.substr(secondLine, split - secondLine);
    const body = text.substr(split, lastLine - split);

    console.log(headers);
  } catch (error) {
    console.error(error);
  }
}

main();
