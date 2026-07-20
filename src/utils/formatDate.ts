export function formatDate(value: string | number | undefined): string {
  if (value === undefined || value === "") {
    return "-";
  }

  let date: Date;

  if (typeof value === "number") {
    // Everything may return FILETIME (100-ns since 1601) or Unix ms/seconds.
    if (value > 1e14) {
      const unixMs = value / 10000 - 11644473600000;
      date = new Date(unixMs);
    } else if (value > 1e12) {
      date = new Date(value);
    } else {
      date = new Date(value * 1000);
    }
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}
