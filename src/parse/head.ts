import { getGroups } from ".";

export function parseHead(head: string) {
  const regex = /^\* (?<id>\d+) FETCH \((?<flags>.+?) \{(?<length>\d+)\}$/;
  const groups = getGroups<"id" | "flags" | "length">(head, regex);
  const id = parseInt(groups.id);
  const flags = groups.flags;
  const length = parseInt(groups.length);
  return { id, flags, length };
}
