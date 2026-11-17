// Platform-neutral declaration for Metro's platform-specific resolution.
// Native builds resolve quoteRepository.native.ts; web resolves
// quoteRepository.web.ts. Reaching this file means the resolver was bypassed.
export async function getVerse(
  _book: string,
  _chapter: string,
  _verse: string,
): Promise<string | null> {
  throw new Error("No platform implementation for quoteRepository");
}
