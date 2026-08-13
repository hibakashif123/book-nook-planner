import { createServerFn } from "@tanstack/react-start";

export type TrendingBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedYear: number | null;
  description: string | null;
  averageRating: number | null;
  ratingsCount: number | null;
};

/** Popular picks pulled live from the Google Books API (no key required). */
export const fetchGoogleTrending = createServerFn({ method: "GET" })
  .inputValidator((input: { subject?: string } | undefined) => ({
    subject: String(input?.subject ?? "booktok").slice(0, 60),
  }))
  .handler(async ({ data }): Promise<TrendingBook[]> => {
    const url =
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(data.subject)}` +
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
          description?: string;
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
          description: v.description ?? null,
          averageRating: v.averageRating ?? null,
          ratingsCount: v.ratingsCount ?? null,
        };
      });
  });
