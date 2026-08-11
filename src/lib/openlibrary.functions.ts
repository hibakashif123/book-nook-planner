import { createServerFn } from "@tanstack/react-start";

export type OpenLibraryResult = {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedYear: number | null;
};

export const searchOpenLibrary = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) => ({ q: String(input.q ?? "").slice(0, 120).trim() }))
  .handler(async ({ data }): Promise<OpenLibraryResult[]> => {
    if (!data.q) return [];
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(data.q)}&limit=20&fields=key,title,author_name,cover_i,first_publish_year`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Book search is unavailable right now.");
    const json = (await res.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        cover_i?: number;
        first_publish_year?: number;
      }>;
    };
    return (json.docs ?? [])
      .filter((d) => d.key && d.title)
      .map((d) => ({
        openLibraryId: d.key!.replace("/works/", ""),
        title: d.title!,
        author: d.author_name?.[0] ?? "Unknown author",
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
        publishedYear: d.first_publish_year ?? null,
      }));
  });
