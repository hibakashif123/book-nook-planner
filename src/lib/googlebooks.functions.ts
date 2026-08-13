import { createServerFn } from "@tanstack/react-start";

export type TrendingBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedYear: number | null;
  averageRating: number | null;
  ratingsCount: number | null;
};

const SUBJECTS = ["romantasy", "dark romance", "young adult fantasy", "thriller"];

async function fromOpenLibrary(subject: string): Promise<TrendingBook[]> {
  const url =
    `https://openlibrary.org/search.json?q=${encodeURIComponent(`subject:${subject}`)}` +
    `&sort=readinglog&limit=12&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      cover_i?: number;
      first_publish_year?: number;
      ratings_average?: number;
      ratings_count?: number;
    }>;
  };
  return (json.docs ?? [])
    .filter((d) => d.key && d.title)
    .map((d) => ({
      id: d.key!.replace("/works/", ""),
      title: d.title!,
      author: d.author_name?.[0] ?? "Unknown author",
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
      publishedYear: d.first_publish_year ?? null,
      averageRating: typeof d.ratings_average === "number" ? d.ratings_average : null,
      ratingsCount: d.ratings_count ?? null,
    }));
}

async function fromGoogleBooks(subject: string): Promise<TrendingBook[]> {
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(subject)}` +
    `&orderBy=relevance&maxResults=12&printType=books&langRestrict=en`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: Array<{
      id?: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        publishedDate?: string;
        averageRating?: number;
        ratingsCount?: number;
      };
    }>;
  };
  return (json.items ?? [])
    .filter((i) => i.id && i.volumeInfo?.title)
    .map((i) => {
      const v = i.volumeInfo!;
      const thumb = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;
      return {
        id: i.id!,
        title: v.title!,
        author: v.authors?.[0] ?? "Unknown author",
        coverUrl: thumb ? thumb.replace(/^http:/, "https:").replace("&edge=curl", "") : null,
        publishedYear: v.publishedDate ? Number(v.publishedDate.slice(0, 4)) || null : null,
        averageRating: v.averageRating ?? null,
        ratingsCount: v.ratingsCount ?? null,
      };
    });
}

/** Popular picks pulled live from Open Library, falling back to Google Books. */
export const fetchTrendingBooks = createServerFn({ method: "GET" })
  .inputValidator((input: { subject?: string } | undefined) => ({
    subject: input?.subject ? String(input.subject).slice(0, 60) : "",
  }))
  .handler(async ({ data }): Promise<TrendingBook[]> => {
    const subject = data.subject || SUBJECTS[new Date().getUTCDay() % SUBJECTS.length]!;
    try {
      const primary = await fromOpenLibrary(subject);
      if (primary.length > 0) return primary;
    } catch {
      /* fall through */
    }
    try {
      return await fromGoogleBooks(subject);
    } catch {
      return [];
    }
  });
