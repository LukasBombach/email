import { getGroups, parseHeaders, EOL } from ".";
import { decode } from "content-encodings";

export function parseBody(body: string) {
  const { content, boundary } = getStructure(body);
  const parts = getMultiparts(content, boundary);
  return parts.map(part => parseMultipart(part));
}

export function parseMultipart(part: string) {
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
