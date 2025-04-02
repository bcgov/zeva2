export const getOptions = (object: { [key: string]: string }) => {
  const result = [];
  for (const [key, value] of Object.entries(object)) {
    result.push(
      <option key={key} value={key}>
        {value}
      </option>,
    );
  }
  return result;
};
