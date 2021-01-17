import { parseHead, parseHeaders, parseBody, EOL } from ".";

export function parseEmail(email: string) {
  const emailParts = splitEmail(email);
  const head = parseHead(emailParts.head);
  const headers = parseHeaders(emailParts.headers);
  const body = parseBody(emailParts.body);

  return { head, headers, body };
}

function splitEmail(email: string) {
  const secondLine = email.indexOf(EOL);
  const split = email.indexOf(`${EOL}${EOL}`);
  const lastLine = email.lastIndexOf(`${EOL})${EOL}`);

  const head = email.substring(0, secondLine);
  const headers = email.substring(secondLine, split);
  const body = email.substring(split, lastLine);

  return { head, headers, body };
}
