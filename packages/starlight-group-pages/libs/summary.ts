const maxSummaryLabels = 3;
const ellipsis = "…";

export function getLabelsSummary(
  labels: string[],
  lang: string
): string | undefined {
  if (labels.length === 0) return undefined;

  const listFormat = new Intl.ListFormat(lang, { type: "conjunction" });

  if (labels.length <= maxSummaryLabels) return listFormat.format(labels);

  return [...labels.slice(0, maxSummaryLabels), ellipsis].join(
    getListSeparator(listFormat)
  );
}

function getListSeparator(listFormat: Intl.ListFormat): string {
  const [, separator] = listFormat.formatToParts(["a", "b", "c"]);

  return separator?.type === "literal" ? separator.value : ", ";
}
