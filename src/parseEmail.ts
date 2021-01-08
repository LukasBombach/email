import { promises as fs } from "fs";
import { inspect } from "util";

function log(value: any) {
  console.log(inspect(value, { depth: 10, colors: true }));
}

async function main() {
  try {
    const filePath = `${__dirname}/emails/max.email.txt`;
    const text = await fs.readFile(filePath, "utf-8");
    console.log(text);
  } catch (error) {
    console.error(error);
  }
}

main();
