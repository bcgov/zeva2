export const interPairDelimiter = "||";

export const intraPairDelimiter = "|";

export const getObject = (s: string | null): { [key: string]: string } => {
  const result: { [key: string]: string } = {};
  if (s) {
    const pairs = s.split(interPairDelimiter);
    for (const pair of pairs) {
      const keyValue = pair.split(intraPairDelimiter);
      if (keyValue.length === 2) {
        result[keyValue[0]] = keyValue[1];
      }
    }
  }
  return result;
};

export const getString = (o: { [key: string]: string }): string => {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(o)) {
    pairs.push(key + intraPairDelimiter + value);
  }
  return pairs.join(interPairDelimiter);
};

export const getLegalPairs = (o: {
  [key: string]: string;
}): { [key: string]: string } => {
  const result: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(o)) {
    if (
      key.indexOf(intraPairDelimiter) === -1 &&
      value.indexOf(intraPairDelimiter) === -1
    ) {
      result[key] = value;
    }
  }
  return result;
};
