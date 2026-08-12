import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { searchOpenLibrary } from "@/lib/openlibrary.functions";
import { findOrCreateBook } from "@/lib/books";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Book3D } from "@/components/Book3D";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search books — BookTok" },
      { name: "description", content: "Search millions of books, or add one yourself, then put it on your shelf." },
      { property: "og:title", content: "Search books — BookTok" },
      { property: "og:description", content: "Find any book and add it to your shelves." },
    ],
  }),
  component: SearchPage,
});

const manualSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().min(1, "Author is required").max(120),
  coverUrl: z.string().trim().url("Cover must be a valid URL").max(500).or(z.literal("")),
  description: z.string().trim().max(2000),
  publishedYear: z.string().trim().max(4),
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const runSearch = useServerFn(searchOpenLibrary);

  const results = useQuery({
    queryKey: ["ol-search", query],
    queryFn: () => runSearch({ data: { q: query } }),
    enabled: query.length > 1,
  });

  const addBook = useMutation({
    mutationFn: async (input: {
      title: string;
      author: string;
      coverUrl?: string | null;
      description?: string | null;
      publishedYear?: number | null;
      openLibraryId?: string | null;
    }) => {
      if (!user) throw new Error("Sign in to add books.");
      return findOrCreateBook({ ...input, userId: user.id });
    },
    onSuccess: (book) => navigate({ to: "/books/$bookId", params: { bookId: book.id } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const [manual, setManual] = useState({
    title: "",
    author: "",
    coverUrl: "",
    description: "",
    publishedYear: "",
  });

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const parsed = manualSchema.safeParse(manual);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    const year = Number(parsed.data.publishedYear);
    addBook.mutate({
      title: parsed.data.title,
      author: parsed.data.author,
      coverUrl: parsed.data.coverUrl || null,
      description: parsed.data.description || null,
      publishedYear: Number.isFinite(year) && year > 0 ? year : null,
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl">Find a book</h1>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(term.trim());
        }}
      >
        <Input
          value={term}
          maxLength={120}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Title, author, series…"
          aria-label="Search books"
        />
        <Button type="submit">Search</Button>
      </form>

      {results.isFetching && (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-2/3 w-full" />
          ))}
        </div>
      )}

      {results.data && results.data.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-3 lg:grid-cols-4">
          {results.data.map((result) => (
            <div key={result.openLibraryId} className="space-y-2">
              <Book3D
                title={result.title}
                author={result.author}
                coverUrl={result.coverUrl}
                width={150}
                thickness={22}
              />
              <h3 className="line-clamp-2 text-center font-display text-base leading-tight">{result.title}</h3>

              <p className="text-center text-xs text-muted-foreground">
                {result.author}
                {result.publishedYear ? ` · ${result.publishedYear}` : ""}
              </p>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={addBook.isPending}
                onClick={() =>
                  user
                    ? addBook.mutate({
                        title: result.title,
                        author: result.author,
                        coverUrl: result.coverUrl,
                        publishedYear: result.publishedYear,
                        openLibraryId: result.openLibraryId,
                      })
                    : navigate({ to: "/auth" })
                }
              >
                {user ? "Open book" : "Sign in to add"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {results.data && results.data.length === 0 && query && !results.isFetching && (
        <p className="mt-8 text-sm text-muted-foreground">No matches. Add it yourself below.</p>
      )}

      <section className="mt-16 max-w-xl">
        <h2 className="text-2xl">Add a book yourself</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Indie, ARC or self-published? Enter the details manually.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submitManual}>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              maxLength={200}
              value={manual.title}
              onChange={(e) => setManual({ ...manual, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              maxLength={120}
              value={manual.author}
              onChange={(e) => setManual({ ...manual, author: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover">Cover image URL (optional)</Label>
            <Input
              id="cover"
              maxLength={500}
              value={manual.coverUrl}
              onChange={(e) => setManual({ ...manual, coverUrl: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year">Published year (optional)</Label>
            <Input
              id="year"
              maxLength={4}
              inputMode="numeric"
              value={manual.publishedYear}
              onChange={(e) => setManual({ ...manual, publishedYear: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              maxLength={2000}
              value={manual.description}
              onChange={(e) => setManual({ ...manual, description: e.target.value })}
            />
          </div>
          {user ? (
            <Button type="submit" disabled={addBook.isPending}>
              Add book
            </Button>
          ) : (
            <Button type="button" onClick={() => navigate({ to: "/auth" })}>
              Sign in to add a book
            </Button>
          )}
        </form>
      </section>
    </div>
  );
}
