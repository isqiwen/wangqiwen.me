const UPDATED_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatUpdatedDate(value: string) {
  return UPDATED_DATE_FORMATTER.format(new Date(`${value}T00:00:00Z`));
}
