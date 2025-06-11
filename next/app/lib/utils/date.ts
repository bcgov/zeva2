export const padZeros = (s: string, n: number): string => {
  let d = n - s.length;
  if (d > 0) {
    return padZeros("0" + s, n);
  }
  return s;
};

// the functions below are intended to be called server-side, where the server's TZ = America/Vancouver
// IsoYmd refers to the YYYY-MM-DD format

const isValidIsoYmdString = (s: string): boolean => {
  const components = s.split("-");
  if (components.length !== 3) {
    return false;
  }
  const year = components[0];
  const month = components[1];
  const date = components[2];
  if (year.length !== 4) {
    return false;
  }
  if (month.length !== 2) {
    return false;
  }
  if (date.length !== 2) {
    return false;
  }
  if (Number.isNaN(Date.parse(`${s}T00:00:00`))) {
    return false;
  }
  return true;
};

export const validateDate = (s: string): [boolean, Date] => {
  const date = new Date(`${s}T00:00:00`);
  if (isValidIsoYmdString(s)) {
    return [true, date];
  }
  return [false, date];
};

export const getIsoYmdString = (d: Date): string => {
  // return "0NaN-NaN-NaN" if invalid date
  return `${padZeros(d.getFullYear().toString(), 4)}-${padZeros((d.getMonth() + 1).toString(), 2)}-${padZeros(d.getDate().toString(), 2)}`;
};

export const getTimeWithTz = (d: Date): string => {
  // returns "NaN:NaN NaN" if date is invalid
  let tz = "NaN";
  const tzOffset = d.getTimezoneOffset();
  if (tzOffset === 480) {
    tz = "PST";
  } else if (tzOffset === 420) {
    tz = "PDT";
  }
  return `${padZeros(d.getHours().toString(), 2)}:${padZeros(d.getMinutes().toString(), 2)} ${tz}`;
};
