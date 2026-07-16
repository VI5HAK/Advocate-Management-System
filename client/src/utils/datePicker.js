/**
 * Lightweight, self-contained implementation of the dayjs API.
 * This mimics dayjs behavior using native JS Date objects, keeping the codebase
 * independent of external date packages and build issues.
 */
export const dayjs = (dateInput) => {
  let date;

  if (dateInput === undefined || dateInput === null || dateInput === "") {
    date = new Date();
  } else if (typeof dateInput === "string") {
    // Match DD/MM/YYYY format
    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateInput.match(dmyPattern);
    if (match) {
      const dd = parseInt(match[1], 10);
      const mm = parseInt(match[2], 10) - 1; // JS months are 0-indexed
      const yyyy = parseInt(match[3], 10);
      date = new Date(yyyy, mm, dd);
    } else {
      date = new Date(dateInput);
    }
  } else if (dateInput instanceof Date) {
    date = new Date(dateInput.getTime());
  } else if (dateInput && dateInput.$d instanceof Date) {
    date = new Date(dateInput.$d.getTime());
  } else {
    date = new Date(NaN);
  }

  const isValid = () => !isNaN(date.getTime());

  const format = (formatStr) => {
    if (!isValid()) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    if (formatStr === "DD/MM/YYYY") {
      return `${dd}/${mm}/${yyyy}`;
    }
    if (formatStr === "YYYY-MM-DD") {
      return `${yyyy}-${mm}-${dd}`;
    }
    return date.toString();
  };

  const isBefore = (other, unit) => {
    if (!isValid()) return false;
    const otherDate = dayjs(other).$d;
    if (isNaN(otherDate.getTime())) return false;

    if (unit === "day") {
      const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const d2 = new Date(otherDate.getFullYear(), otherDate.getMonth(), otherDate.getDate());
      return d1.getTime() < d2.getTime();
    }
    return date.getTime() < otherDate.getTime();
  };

  const isAfter = (other, unit) => {
    if (!isValid()) return false;
    const otherDate = dayjs(other).$d;
    if (isNaN(otherDate.getTime())) return false;

    if (unit === "day") {
      const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const d2 = new Date(otherDate.getFullYear(), otherDate.getMonth(), otherDate.getDate());
      return d1.getTime() > d2.getTime();
    }
    return date.getTime() > otherDate.getTime();
  };

  const isSame = (other, unit) => {
    if (!isValid()) return false;
    const otherDate = dayjs(other).$d;
    if (isNaN(otherDate.getTime())) return false;

    if (unit === "day") {
      return (
        date.getFullYear() === otherDate.getFullYear() &&
        date.getMonth() === otherDate.getMonth() &&
        date.getDate() === otherDate.getDate()
      );
    }
    return date.getTime() === otherDate.getTime();
  };

  return {
    $d: date,
    isValid,
    format,
    isBefore,
    isAfter,
    isSame,
  };
};

export default dayjs;
