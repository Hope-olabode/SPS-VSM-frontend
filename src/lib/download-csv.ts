/** Downloads a CSV. The BOM makes Excel read the file as UTF-8. */
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((line) => line.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
