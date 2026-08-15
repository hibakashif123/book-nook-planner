import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { searchStudyMaterial } from "@/lib/study.functions";
import { findOrCreateBook } from "@/lib/books";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookCover } from "@/components/BookCard";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study guides & textbooks — BookTok" },
      {
        name: "description",
        content:
          "Search textbooks, study guides, exam prep and reference notes across every subject, language and country.",
      },
      { property: "og:title", content: "Study guides & textbooks — BookTok" },
      {
        property: "og:description",
        content: "Textbooks, revision notes and exam prep for every subject and language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudyPage,
});

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer science",
  "Medicine",
  "Engineering",
  "Economics",
  "Law",
  "History",
  "Psychology",
  "Accounting",
  "Language learning",
  "Islamic studies",
];

const LEVELS = ["School", "O Level", "A Level", "Undergraduate", "Exam prep", "Lecture notes"];

const LANGUAGES = [
  { code: "", label: "Any language" },
  { code: "eng", label: "English" },
  { code: "urd", label: "Urdu" },
  { code: "spa", label: "Spanish" },
  { code: "fre", label: "French" },
  { code: "ger", label: "German" },
  { code: "ara", label: "Arabic" },
  { code: "hin", label: "Hindi" },
  { code: "chi", label: "Chinese" },
  { code: "por", label: "Portuguese" },
  { code: "rus", label: "Russian" },
  { code: "jpn", label: "Japanese" },
];

const PLACES = ["", "Pakistan", "India", "United States", "United Kingdom", "Nigeria", "Germany", "Japan"];

function StudyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState({ q: "", subject: "", level: "", language: "", place: "" });
  const run = useServerFn(searchStudyMaterial);

  const results = useQuery({
    queryKey: ["study", filters],
    queryFn: () => run({ data: filters }),
    staleTime: 1000 * 60 * 10,
  });

  const addBook = useMutation({
    mutationFn: async (input: {
      title: string;
      author: string;
      coverUrl?: string | null;
      publishedYear?: number | null;
      openLibraryId?: string | null;
    }) => {
      if (!user) throw new Error("Sign in to add books.");
      return findOrCreateBook({ ...input, userId: user.id });
    },
    onSuccess: (book) => navigate({ to: "/books/$bookId", params: { bookId: book.id } }),
    onError: (error: Error) => toast.error(error.message),
  });

  function chip(active: boolean) {
    return `rounded-full border px-3 py-1 text-xs transition ${
      active
        ? "border-gold bg-gold/15 text-gold"
        : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
    }`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Beyond the novels</p>
      <h1 className="mt-2 text-4xl">Study guides &amp; textbooks</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Textbooks, revision notes, exam prep and reference material for every subject, language and country.
        Add any of them to your shelves and review them like any other book.
      </p>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: term.trim() }));
        }}
      >
        <Input
          value={term}
          maxLength={120}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Organic chemistry, calculus notes, CSS past papers…"
          aria-label="Search study material"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Subject</p>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                className={chip(filters.subject === s)}
                onClick={() => setFilters((f) => ({ ...f, subject: f.subject === s ? "" : s }))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Level</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                className={chip(filters.level === l)}
                onClick={() => setFilters((f) => ({ ...f, level: f.level === l ? "" : l }))}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Language
            <select
              className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
              value={filters.language}
              onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Country / region
            <select
              className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
              value={filters.place}
              onChange={(e) => setFilters((f) => ({ ...f, place: e.target.value }))}
            >
              {PLACES.map((p) => (
                <option key={p || "any"} value={p}>
                  {p || "Anywhere"}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {results.isFetching && (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-2/3 w-full" />
          ))}
        </div>
      )}

      {!results.isFetching && results.data && results.data.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
          {results.data.map((r) => (
            <div key={r.openLibraryId} className="space-y-2">
              <BookCover title={r.title} coverUrl={r.coverUrl} />
              <h3 className="line-clamp-2 font-display text-sm leading-tight">{r.title}</h3>
              <p className="text-xs text-muted-foreground">
                {r.author}
                {r.publishedYear ? ` · ${r.publishedYear}` : ""}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={addBook.isPending}
                onClick={() =>
                  user
                    ? addBook.mutate({
                        title: r.title,
                        author: r.author,
                        coverUrl: r.coverUrl,
                        publishedYear: r.publishedYear,
                        openLibraryId: r.openLibraryId,
                      })
                    : navigate({ to: "/auth" })
                }
              >
                {user ? "Open" : "Sign in to add"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!results.isFetching && results.data && results.data.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing found for those filters. Try a different subject or language, or add it manually from
          the search page.
        </p>
      )}
    </div>
  );
}
