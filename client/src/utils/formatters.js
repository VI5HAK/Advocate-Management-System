import dayjs from "dayjs";

export function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function formatTime12Hour(timeString) {
  if (!timeString || timeString === "—") return "—";
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  const parsed = dayjs(`2000-01-01T${timeString}`);
  if (!parsed.isValid()) return timeString;
  return parsed.format("hh:mm A");
}

export function formatDateDMY(dateString) {
  if (!dateString || dateString === "—") return "—";
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return dateString;
  return parsed.format("DD/MM/YYYY");
}

export function formatRemarkDate(dateValue) {
  if (!dateValue) return "—";
  const parsed = dayjs(dateValue);
  if (!parsed.isValid()) return String(dateValue);
  return parsed.format("DD/MM/YYYY, h:mm:ss A");
}
