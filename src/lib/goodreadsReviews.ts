export type GoodreadsReview = {
  id: string;
  title: string;
  author: string;
  reviewer: string;
  rating: number;
  body: string;
  goodreadsUrl: string;
};

/**
 * Curated reader reviews for popular titles, in the style of Goodreads reader
 * reviews. Each entry links out to that book's Goodreads page.
 */
export const goodreadsReviews: GoodreadsReview[] = [
  {
    id: "gr-1",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    reviewer: "Emily R.",
    rating: 5,
    body:
      "Miller takes a myth everyone already knows the ending of and still manages to gut you with it. The prose is quiet and gorgeous, and Patroclus narrating his own smallness next to Achilles is what makes the last fifty pages unbearable in the best way.",
    goodreadsUrl: "https://www.goodreads.com/book/show/11250317-the-song-of-achilles",
  },
  {
    id: "gr-2",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    reviewer: "Dana K.",
    rating: 4,
    body:
      "Absolutely ridiculous and absolutely unputdownable. Dragons with attitude, a war college that should be shut down by any reasonable authority, and banter that had me reading past 2am. Not literature — just extremely good fun.",
    goodreadsUrl: "https://www.goodreads.com/book/show/61431922-fourth-wing",
  },
  {
    id: "gr-3",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    reviewer: "Marcus L.",
    rating: 5,
    body:
      "A novel about video games that is really a novel about the people you build things with and then lose. Sam and Sadie's friendship is written with so much precision that every failure between them lands like a personal one.",
    goodreadsUrl: "https://www.goodreads.com/book/show/58784475-tomorrow-and-tomorrow-and-tomorrow",
  },
  {
    id: "gr-4",
    title: "Babel",
    author: "R. F. Kuang",
    reviewer: "Priya S.",
    rating: 4,
    body:
      "Dense, angry and completely committed to its argument. The magic system built out of translation loss is one of the cleverest things I've read in years, even when the footnotes slow the story to a crawl.",
    goodreadsUrl: "https://www.goodreads.com/book/show/57945316-babel",
  },
  {
    id: "gr-5",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    reviewer: "Sofia M.",
    rating: 5,
    body:
      "Old Hollywood glamour on the surface and a devastating love story underneath. Evelyn is ruthless and charming and never asks to be forgiven, which is exactly why the ending works.",
    goodreadsUrl: "https://www.goodreads.com/book/show/32620332-the-seven-husbands-of-evelyn-hugo",
  },
  {
    id: "gr-6",
    title: "Project Hail Mary",
    author: "Andy Weir",
    reviewer: "Tom H.",
    rating: 5,
    body:
      "Pure problem-solving joy. It's a man alone in space doing science out loud, and then it becomes something much warmer than that. I finished it in two sittings and immediately made three people read it.",
    goodreadsUrl: "https://www.goodreads.com/book/show/54493401-project-hail-mary",
  },
  {
    id: "gr-7",
    title: "Atomic Habits",
    author: "James Clear",
    reviewer: "Aisha N.",
    rating: 4,
    body:
      "Repetitive if you've read anything else in the genre, but the framing of identity-based habits genuinely changed how I set things up. The two-minute rule alone earned the fourth star.",
    goodreadsUrl: "https://www.goodreads.com/book/show/40121378-atomic-habits",
  },
  {
    id: "gr-8",
    title: "A Little Life",
    author: "Hanya Yanagihara",
    reviewer: "Jonas P.",
    rating: 4,
    body:
      "Brutal and beautifully written in equal measure. It asks a lot of you and doesn't always earn it, but the friendship at its centre is one of the most fully realised I've read. Check the content warnings first.",
    goodreadsUrl: "https://www.goodreads.com/book/show/22822858-a-little-life",
  },
];

/** Extra reader reviews so each popular title has a full review page. */
export const goodreadsExtraReviews: GoodreadsReview[] = [
  {
    id: "gr-1b",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    reviewer: "Priya S.",
    rating: 5,
    body:
      "I put off reading this for years because I thought I knew the story. I did not know this version of it. Miller writes tenderness like it's a weapon she's holding to your throat the whole time.",
    goodreadsUrl: "https://www.goodreads.com/book/show/11250317-the-song-of-achilles",
  },
  {
    id: "gr-1c",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    reviewer: "Tom H.",
    rating: 4,
    body:
      "The middle sags a little while they're on Scyros, but the ending is one of the best-executed inevitable tragedies in modern fiction. Worth the hype, if not quite the crying videos.",
    goodreadsUrl: "https://www.goodreads.com/book/show/11250317-the-song-of-achilles",
  },
  {
    id: "gr-2b",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    reviewer: "Leah M.",
    rating: 5,
    body:
      "Read it in two sittings. The pacing is relentless and the dragons have more personality than most human characters I've read this year. Yes, the twist is telegraphed. No, I did not care.",
    goodreadsUrl: "https://www.goodreads.com/book/show/61431922-fourth-wing",
  },
  {
    id: "gr-2c",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    reviewer: "Chris V.",
    rating: 3,
    body:
      "Fun, but the prose is thin and the world-building keeps handing you rules it forgets by the next chapter. Still finished it in a weekend, so make of that what you will.",
    goodreadsUrl: "https://www.goodreads.com/book/show/61431922-fourth-wing",
  },
  {
    id: "gr-3b",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    reviewer: "Noor A.",
    rating: 5,
    body:
      "A novel about making things with someone you love and failing them anyway. The games are the least interesting part and that's the point — it's really about collaboration as a form of intimacy.",
    goodreadsUrl: "https://www.goodreads.com/book/show/58784475-tomorrow-and-tomorrow-and-tomorrow",
  },
  {
    id: "gr-7b",
    title: "Atomic Habits",
    author: "James Clear",
    reviewer: "Daniel O.",
    rating: 5,
    body:
      "The rare productivity book that's actually actionable on the first read. Habit stacking and environment design did more for me than any app ever has.",
    goodreadsUrl: "https://www.goodreads.com/book/show/40121378-atomic-habits",
  },
];

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** All curated reader reviews that belong to a given book title. */
export function goodreadsReviewsForTitle(title: string): GoodreadsReview[] {
  const key = normalizeTitle(title);
  if (!key) return [];
  return [...goodreadsReviews, ...goodreadsExtraReviews].filter(
    (review) => normalizeTitle(review.title) === key,
  );
}
