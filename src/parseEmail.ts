import { promises as fs } from "fs";
import { inspect, promisify } from "util";
import { decode } from "content-encodings";

import type { InspectOptions } from "util";

type EmailHeaders = Record<string, string>;
type Groups = Record<string, string>;

(async function main() {
  try {
    const filePath = `${__dirname}/max.email.txt`;
    const message = await fs.readFile(filePath, "utf-8");

    const { head, headers, body } = parseMessage(message);

    // log(head);
    // log(headers, { maxStringLength: null });
    /* Object.entries(headers).map(([key, value]) => {
      console.log(key);
      log(value, { maxStringLength: null });
      console.log("\n");
    }); */
    log(body, { maxStringLength: null });
  } catch (error) {
    console.error(error);
  }
})();

function log(value: any, options: InspectOptions = {}) {
  console.log(
    inspect(value, {
      depth: 10,
      colors: true,
      compact: false,
      maxStringLength: 80,
      ...options,
    })
  );
}

const EOL = "\n";

function splitMessage(
  message: string
): { head: string; headers: string; body: string } {
  const secondLine = message.indexOf(EOL);
  const split = message.indexOf(`${EOL}${EOL}`);
  const lastLine = message.lastIndexOf(`${EOL})${EOL}`);

  const head = message.substring(0, secondLine);
  const headers = message.substring(secondLine, split);
  const body = message.substring(split, lastLine);

  return { head, headers, body };
}

function parseMessage(message: string) {
  const messageParts = splitMessage(message);
  const head = parseHead(messageParts.head);
  const headers = parseHeaders(messageParts.headers);
  const body = parseBody(messageParts.body);

  return { head, headers, body };
}

function parseHead(head: string) {
  const regex = /^\* (?<id>\d+) FETCH \((?<flags>.+?) \{(?<length>\d+)\}$/;
  return getGroups<"id" | "flags" | "length">(head, regex);
}

function parseHeaders(headers: string) {
  const header = /^(?<key>[^ ][!-9;-~]+?):(?<value>.*)/;
  const fold = /^ (?<value>.*)/;
  const lines = headers.split(EOL);

  const parsedLines = lines.reduce<{ key: string; value: string }[]>(
    (headers, line) => {
      if (!line) {
        return headers;
      }
      if (test(line, fold)) {
        const { value } = getGroups<"value">(line, fold);
        const cleanedValue = value.replace(/^ {6}/, "");
        headers[headers.length - 1].value += cleanedValue;
        return headers;
      }
      if (test(line, header)) {
        return [...headers, getGroups<"key" | "value">(line, header)];
      }
      throw new Error(`Failed to parse "${line}"`);
    },
    []
  );
  const cleanedLines = parsedLines.map(({ key, value: originalValue }) => {
    const value = originalValue.trim();
    return { key, value };
  });
  return cleanedLines.reduce<EmailHeaders>(
    (headers, { key, value }) => Object.assign(headers, { [key]: value }),
    {}
  );
}

function parseBody(body: string) {
  const structure = /\n--(?<boundary>.*?)\n(?<content>.*?)\n--\1--/s;
  const { boundary, content } = getGroups<"boundary" | "content">(
    body,
    structure
  );
  const parts = content.split(new RegExp(`\n--${boundary}\n`));
  return parts.map(part => {
    const split = part.indexOf(`${EOL}${EOL}`);
    const headers = parseHeaders(part.substring(0, split));
    const body = decode("qp", part.substring(split).trim()).toString();
    return { headers, body };
  });
}

function test(str: string, regex: RegExp): boolean {
  const result = regex.test(str);
  regex.lastIndex = 0;
  return result;
}

function getGroups<T extends string = string>(
  str: string,
  regex: RegExp
): { [key in T]: string } {
  const result = str.match(regex);
  if (!result?.groups) throw new Error(`Could not match ${regex} to "${str}"`);
  regex.lastIndex = 0;
  return result.groups as { [key in T]: string };
}
