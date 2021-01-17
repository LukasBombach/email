import { promises as fs } from "fs";
import { inspect } from "util";
import { parseEmail } from "./parse";

function log(value: any) {
  const depth = null;
  const colors = true;
  const compact = false;
  const maxStringLength = null;
  console.log(inspect(value, { depth, colors, compact, maxStringLength }));
}

(async function main() {
  try {
    const filePath = `${__dirname}/max.email.txt`;
    const text = await fs.readFile(filePath, "utf-8");
    const email = parseEmail(text);
    log(email);
  } catch (error) {
    console.error(error);
  }
})();
