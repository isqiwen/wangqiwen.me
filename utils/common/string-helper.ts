export function formatString(template: string, values: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (_, key) => values[key] ?? "");
}
