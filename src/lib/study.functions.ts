import { createServerFn } from "@tanstack/react-start";

export type StudyResult = {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedYear: number | null;
  subjects: string[];
};

type Input = {
  q?: string;
  subject?: string;
  language?: string;
  level?: string;
  place?: string;
};

export const searchStudyMaterial = createServerFn({ method: "GET" })
  .inputValidator((input: Input) => ({
    q: String(input.q ?? "").slice(0, 120).trim(),
    subject: String(input.subject ?? "").slice(0, 60).trim(),
    language: String(input.language ?? "").slice(0, 8).trim(),
    level: String(input.level ?? "").slice(0, 60).trim(),
    place: String(input.place ?? "").slice(0, 60).trim(),
  }))
  .handler(async ({ data }): Promise<StudyResult[]> => {
    const terms = [data.q, data.subject, data.level].filter(Boolean).join(" ");
    const query = terms || "textbook";
    const params = new URLSearchParams({
      q: query,
      limit: "24",
      fields: "key,title,author_name,cover_i,first_publish_year,subject",
    });
    if (data.language) params.set("language", data.language);
    if (data.place) params.set("place", data.place);

    const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        cover_i?: number;
        first_publish_year?: number;
        subject?: string[];
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
        subjects: (d.subject ?? []).slice(0, 3),
      }));
  });
