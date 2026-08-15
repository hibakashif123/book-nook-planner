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
