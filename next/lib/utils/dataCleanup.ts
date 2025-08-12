export const cleanupStringData = (str: string | null) => {
  if (!str) {
    return null;
  }
  const trimmed = str.trim();
  return trimmed.length > 0 ? trimmed : null;
};