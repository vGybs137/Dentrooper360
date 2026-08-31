export type SearchTextPart = {
  value: string;
  highlighted: boolean;
};

/** Split text into segments, marking case-insensitive query matches. */
export function splitTextBySearchQuery(
  text: string,
  query: string,
): SearchTextPart[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [{ value: text, highlighted: false }];
  }

  const parts: SearchTextPart[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  let startIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, startIndex);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      parts.push({
        value: text.slice(startIndex, matchIndex),
        highlighted: false,
      });
    }

    parts.push({
      value: text.slice(matchIndex, matchIndex + normalizedQuery.length),
      highlighted: true,
    });

    startIndex = matchIndex + normalizedQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, startIndex);
  }

  if (startIndex < text.length) {
    parts.push({ value: text.slice(startIndex), highlighted: false });
  }

  return parts.length > 0 ? parts : [{ value: text, highlighted: false }];
}
