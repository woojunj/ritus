/** 검색어를 띄어쓰기로 나눈 낱말 목록. 대소문자는 구분하지 않는다. */
export function searchTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/** 낱말이 모두 글 안에 들어 있으면 true. 낱말이 없으면 항상 true. */
export function containsAllTerms(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.every((term) => lower.includes(term.toLowerCase()));
}
