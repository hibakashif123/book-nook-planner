export type RatingBucket = { stars: number; count: number };

export type ExternalBookDetails = {
  title: string;
  author: string | null;
  coverUrl: string | null;
  description: string | null;
  firstPublishYear: number | null;
  subjects: string[];
  averageRating: number | null;
  ratingsCount: number | null;
  histogram: RatingBucket[];
  openLibraryUrl: string | null;
  goodreadsSearchUrl: string;
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function plainDescription(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) {
    const v = (value as { value?: unknown }).value;
    if (typeof v === "string") return v;
  }
  return null;
}

async function fromOpenLibraryWork(workId: string) {
  const work = await getJson<{
    title?: string;
    description?: unknown;
    subjects?: string[];
    covers?: number[];
    first_publish_date?: string;
  }>(`https://openlibrary.org/works/${workId}.json`);
  const ratings = await getJson<{
    summary?: { average?: number | null; count?: number };
    counts?: Record<string, number>;
  }>(`https://openlibrary.org/works/${workId}/ratings.json`);

  const histogram: RatingBucket[] = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratings?.counts?.[String(stars)] ?? 0,
  }));

  return {
    title: work?.title ?? null,
    description: plainDescription(work?.description),
    subjects: (work?.subjects ?? []).slice(0, 8),
    coverUrl: work?.covers?.[0] ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : null,
    firstPublishYear: work?.first_publish_date
      ? Number(String(work.first_publish_date).slice(-4)) || null
      : null,
    averageRating: typeof ratings?.summary?.average === "number" ? ratings.summary.average : null,
    ratingsCount: ratings?.summary?.count ?? null,
    histogram,
  };
}

async function fromGoogleBooks(title: string, author: string | null) {
  const q = `intitle:${title}${author ? ` inauthor:${author}` : ""}`;
  const json = await getJson<{
    items?: Array<{
      volumeInfo?: {
        title?: string;
        authors?: string[];
        description?: string;
        categories?: string[];
        publishedDate?: string;
        averageRating?: number;
        ratingsCount?: number;
        imageLinks?: { thumbnail?: string };
      };
    }>;
  }>(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1&printType=books`,
  );
  const v = json?.items?.[0]?.volumeInfo;
  if (!v) return null;
  return {
    title: v.title ?? null,
    author: v.authors?.[0] ?? null,
    description: v.description ?? null,
    subjects: (v.categories ?? []).slice(0, 8),
    coverUrl: v.imageLinks?.thumbnail?.replace(/^http:/, "https:").replace("&edge=curl", "") ?? null,
    firstPublishYear: v.publishedDate ? Number(v.publishedDate.slice(0, 4)) || null : null,
    averageRating: typeof v.averageRating === "number" ? v.averageRating : null,
    ratingsCount: v.ratingsCount ?? null,
  };
}

export async function loadExternalBookDetails(input: {
  workId: string;
  title: string;
  author: string | null;
}): Promise<ExternalBookDetails> {
  const isWork = /^OL\d+W$/i.test(input.workId);
  const ol = isWork ? await fromOpenLibraryWork(input.workId) : null;
  const needsMore = !ol || !ol.description || ol.averageRating === null;
  const gb = needsMore ? await fromGoogleBooks(input.title, input.author) : null;

  const histogram = ol?.histogram ?? [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));

  return {
    title: ol?.title ?? gb?.title ?? input.title,
    author: input.author ?? gb?.author ?? null,
    coverUrl: ol?.coverUrl ?? gb?.coverUrl ?? null,
    description: ol?.description ?? gb?.description ?? null,
    firstPublishYear: ol?.firstPublishYear ?? gb?.firstPublishYear ?? null,
    subjects: (ol?.subjects?.length ? ol.subjects : gb?.subjects) ?? [],
    averageRating: ol?.averageRating ?? gb?.averageRating ?? null,
    ratingsCount: ol?.ratingsCount ?? gb?.ratingsCount ?? null,
    histogram,
    openLibraryUrl: isWork ? `https://openlibrary.org/works/${input.workId}` : null,
    goodreadsSearchUrl: `https://www.goodreads.com/search?q=${encodeURIComponent(
      `${input.title} ${input.author ?? ""}`.trim(),
    )}`,
  };
}
