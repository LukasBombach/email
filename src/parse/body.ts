import { getGroups, parseHeaders, EOL } from ".";
import { decode } from "content-encodings";

interface ParsedPart {
  headers: Record<string, string>;
  body: string;
}

export interface Body {
  text?: string;
  html?: string;
}

export function parseBody(body: string) {
  const { content, boundary } = getStructure(body);
  const parts = getMultiparts(content, boundary);
  const parsedParts = parts.map(part => parseMultipart(part));
  return createBody(parsedParts);
}

export function parseMultipart(part: string): ParsedPart {
  const split = part.indexOf(`${EOL}${EOL}`);
  const headers = parseHeaders(part.substring(0, split));
  const body = decode("qp", part.substring(split).trim()).toString();
  return { headers, body };
}

function getStructure(body: string) {
  const structure = /\n--(?<boundary>.*?)\n(?<content>.*?)\n--\1--/s;
  return getGroups<"boundary" | "content">(body, structure);
}

function getMultiparts(content: string, boundary: string) {
  return content.split(new RegExp(`\n--${boundary}\n`));
}

function createBody(parsedParts: ParsedPart[]): Body {
  const text = findBody(parsedParts, "text/plain");
  const html = findBody(parsedParts, "text/html");
  return { text, html };
}

function findBody(parsedParts: ParsedPart[], contentType: string) {
  const part = parsedParts.find(part => hasContentType(part, contentType));
  return part ? part.body : undefined;
}

function hasContentType(part: ParsedPart, contentType: string) {
  return part.headers["Content-Type"]?.includes(contentType);
}
