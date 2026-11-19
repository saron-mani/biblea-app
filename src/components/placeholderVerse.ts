// A tiny, bundled verse painted before the daily/random lookup finishes.
// It is intentionally synchronous: both the app feed and the widget can show
// something meaningful on the very first frame, then replace it when the
// correct verse resolves.

export const PLACEHOLDER_VERSE = {
  book: "0",
  chapter: "1",
  verse: "1",
  address: "ഉല്പത്തി 1:1",
  text: "ആദിയില്‍ ദൈവം ആകാശവും ഭൂമിയും സൃഷ്ടിച്ചു.",
} as const;
