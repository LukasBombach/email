export type Groups<T extends string> = { [key in T]: string };

export function getGroups<T extends string>(str: string, regex: RegExp) {
  const result = match(str, regex);
  return result.groups as Groups<T>;
}

export function test(str: string, regex: RegExp) {
  const result = regex.test(str);
  regex.lastIndex = 0;
  return result;
}

export function match(str: string, regex: RegExp) {
  const result = str.match(regex);
  if (!result?.groups) throw new Error(`Could not match ${regex} to "${str}"`);
  regex.lastIndex = 0;
  return result;
}
