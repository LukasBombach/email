import { getGroups, test, EOL } from ".";

export type EmailHeaders = Record<string, string>;

type ParsedLine = ParsedFold | ParsedHeader | ParsedEmpty;
type ParsedFold = { type: "fold"; value: string };
type ParsedHeader = { type: "header"; name: string; value: string };
type ParsedEmpty = { type: "empty" };
type UnfoldedLine = [name: string, value: string];

const header = /^(?<name>[^ ][!-9;-~]+?): ?(?<value>.*)/;
const fold = /^ (?<value>.*)/;
const empty = /^$/;

export function parseHeaders(headers: string) {
  const lines = getLines(headers);
  const parsedLines = parseLines(lines);
  const unfoldedLines = unfoldLines(parsedLines);
  return Object.fromEntries(unfoldedLines);
}

function getLines(headers: string) {
  return headers.split(EOL);
}

function parseLines(lines: string[]) {
  return lines.map(line => {
    if (test(line, empty)) return { type: "empty" } as ParsedEmpty;
    if (test(line, fold)) return parseFold(line);
    if (test(line, header)) return parseHeader(line);
    throw new Error(`Cannot parse line "${line}"`);
  });
}

function parseFold(line: string): ParsedFold {
  const groups = getGroups<"value">(line, fold);
  const value = groups.value.replace(/^ {6}/, "");
  return { type: "fold", value };
}

function parseHeader(line: string): ParsedHeader {
  const { name, value } = getGroups<"name" | "value">(line, header);
  return { type: "header", name, value };
}

function unfoldLines(parseLines: ParsedLine[]) {
  const unfolded: UnfoldedLine[] = [];
  for (const line of parseLines) {
    if (line.type === "header") unfolded.push([line.name, line.value]);
    if (line.type === "fold") unfolded[unfolded.length - 1][1] += line.value;
  }
  return unfolded;
}
