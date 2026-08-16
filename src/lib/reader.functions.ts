import { createServerFn } from "@tanstack/react-start";

export type Chapter = {
  index: number;
  title: string;
  text: string;
};

export type ReadableBook = {
  found: boolean;
  source: string | null;
  sourceUrl: string | null;
  pdfUrl: string | null;
  chapters: Chapter[];
  note: string | null;
};

type Input = { title: string; author?: string };

function stripGutenbergBoilerplate(raw: string) {
  let text = raw.replace(/\r\n/g, "\n");
  const startMatch = text.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
  if (startMatch?.index != null) text = text.slice(startMatch.index + startMatch[0].length);
  const endMatch = text.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (endMatch?.index != null) text = text.slice(0, endMatch.index);
  return text.trim();
}

function splitChapters(text: string): Chapter[] {
  const lines = text.split("\n");
  const headingRe =
    /^\s*(chapter|book|part|letter|act|canto|section)\s+([0-9]+|[ivxlcdm]+|[a-z]+)\b.*$/i;

  const chapters: Chapter[] = [];
  let currentTitle = "Opening";
  let buffer: string[] = [];

  const push = () => {
    const body = buffer.join("\n").trim();
    if (body.length > 400) {
      chapters.push({ index: chapters.length, title: currentTitle, text: body });
    } else if (chapters.length && body) {
      chapters[chapters.length - 1]!.text += `\n\n${body}`;
    }
    buffer = [];
  };

  for (const line of lines) {
    if (headingRe.test(line) && line.trim().length < 80) {
      push();
      currentTitle = line.trim().replace(/\s+/g, " ");
    } else {
      buffer.push(line);
    }
  }
  push();

  if (chapters.length <= 1) {
    // No detectable chapters — slice into readable parts.
    const body = text.trim();
    const size = 18000;
    const parts: Chapter[] = [];
    for (let i = 0; i < body.length && parts.length < 40; i += size) {
      parts.push({
        index: parts.length,
        title: `Part ${parts.length + 1}`,
        text: body.slice(i, i + size),
      });
    }
    return parts;
  }

  return chapters.slice(0, 60).map((c, i) => ({ ...c, index: i }));
}

export const fetchReadableBook = createServerFn({ method: "GET" })
  .inputValidator((input: Input) => ({
    title: String(input.title ?? "").slice(0, 160).trim(),
    author: String(input.author ?? "").slice(0, 120).trim(),
  }))
  .handler(async ({ data }): Promise<ReadableBook> => {
    const empty: ReadableBook = {
      found: false,
      source: null,
      sourceUrl: null,
      pdfUrl: null,
      chapters: [],
      note: null,
    };
    if (!data.title) return empty;

    try {
      const query = [data.title, data.author].filter(Boolean).join(" ");
      const res = await fetch(
        `https://gutendex.com/books?search=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) },
      );
      if (!res.ok) return { ...empty, note: "Reader service unavailable right now." };
      const json = (await res.json()) as {
        results?: Array<{
          id: number;
          title: string;
          authors?: Array<{ name: string }>;
          formats?: Record<string, string>;
        }>;
      };

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const wanted = normalize(data.title);
      const candidates = json.results ?? [];
      const match = candidates.find((b) => {
        const t = normalize(b.title);
        return t === wanted || t.startsWith(wanted) || wanted.startsWith(t);
      });

      if (!match) {
        return {
          ...empty,
          note: "No free full text is available for this title. Copyrighted books can only be read through their publisher.",
        };
      }

      const formats = match.formats ?? {};
      const txtUrl =
        formats["text/plain; charset=utf-8"] ??
        formats["text/plain; charset=us-ascii"] ??
        formats["text/plain"] ??
        Object.entries(formats).find(([k]) => k.startsWith("text/plain"))?.[1];
      const pdfUrl = formats["application/pdf"] ?? null;
      const sourceUrl = `https://www.gutenberg.org/ebooks/${match.id}`;

      if (!txtUrl) {
        return { ...empty, source: "Project Gutenberg", sourceUrl, pdfUrl, note: "Only an external copy is available." };
      }

      const textRes = await fetch(txtUrl, { signal: AbortSignal.timeout(20000) });
      if (!textRes.ok) return { ...empty, source: "Project Gutenberg", sourceUrl, pdfUrl };
      const raw = await textRes.text();
      const chapters = splitChapters(stripGutenbergBoilerplate(raw));

      return {
        found: chapters.length > 0,
        source: "Project Gutenberg",
        sourceUrl,
        pdfUrl: pdfUrl ?? `https://www.gutenberg.org/ebooks/${match.id}.pdf.images`,
        chapters,
        note: null,
      };
    } catch {
      return { ...empty, note: "Could not load this book's text." };
    }
  });
