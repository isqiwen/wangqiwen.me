export function formatString(template: string, values: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (_, key) => values[key] ?? "");
}

const COUNT_FORMATTER = new Intl.NumberFormat("en-US");

// 1234567 -> "1,234,567"
export function formatCount(value: number): string {
  return COUNT_FORMATTER.format(value);
}
