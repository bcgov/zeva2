export const getDate = (datetime: Date) => {
  return datetime.toISOString().split("T")[0];
};
