import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookById } from "@/lib/books";
import { fetchReadableBook, type ReadableBook } from "@/lib/reader.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/read/$bookId")({
  head: () => ({
    meta: [
      { title: "Read online — BooksOcean" },
      {
        name: "description",
        content:
          "Read books online on BooksOcean. First chapter free, full book and offline reading with a free account.",
      },
      { property: "og:title", content: "Read online — BooksOcean" },
      {
        property: "og:description",
        content: "Free first chapter for everyone, full text and offline reading for members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReaderPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="mx-auto max-w-4xl px-4 py-16">
      {error.message}
    </p>
  ),
});

function offlineKey(bookId: string) {
  return `booksocean:offline:${bookId}`;
}

function ReaderPage() {
  const { bookId } = Route.useParams();
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const [offline, setOffline] = useState<ReadableBook | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);

  const bookQuery = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetchBookById(bookId),
  });
  const book = bookQuery.data;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(offlineKey(bookId));
      if (raw) {
        setOffline(JSON.parse(raw) as ReadableBook);
        setSavedOffline(true);
      }
    } catch {
      /* ignore */
    }
  }, [bookId]);

  const textQuery = useQuery({
    queryKey: ["readable", book?.title, book?.author],
    enabled: Boolean(book?.title),
    staleTime: 1000 * 60 * 60,
    queryFn: () => fetchReadableBook({ data: { title: book!.title, author: book!.author } }),
  });

  const readable = textQuery.data ?? offline;
  const chapters = useMemo(() => readable?.chapters ?? [], [readable]);
  const locked = !user && active > 0;

  function saveOffline() {
    if (!user) {
      toast.error("Create a free account to save books for offline reading.");
      return;
    }
    if (!readable) return;
    try {
      localStorage.setItem(offlineKey(bookId), JSON.stringify(readable));
      setSavedOffline(true);
      toast.success("Saved for offline reading on this device.");
    } catch {
      toast.error("Not enough space to store this book offline.");
    }
  }

  function removeOffline() {
    localStorage.removeItem(offlineKey(bookId));
    setSavedOffline(false);
    toast.success("Removed from offline library.");
  }

  if (bookQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!book) return <p className="mx-auto max-w-4xl px-4 py-16">Book not found.</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        to="/books/$bookId"
        params={{ bookId }}
        className="text-xs uppercase tracking-[0.2em] text-gold/80 hover:text-gold"
      >
        ← Back to book
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl leading-tight">{book.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
          {readable?.source && (
            <p className="mt-2 text-xs text-muted-foreground">
              Full text courtesy of{" "}
              <a
                className="text-gold hover:underline"
                href={readable.sourceUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
              >
                {readable.source}
              </a>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {readable?.pdfUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={readable.pdfUrl} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            </Button>
          )}
          {savedOffline ? (
            <Button variant="outline" size="sm" onClick={removeOffline}>
              Saved offline ✓
            </Button>
          ) : (
            <Button size="sm" onClick={saveOffline} disabled={!readable?.found}>
              Save for offline
            </Button>
          )}
        </div>
      </header>

      {textQuery.isLoading && !offline && (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-10/12" />
        </div>
      )}

      {readable && !readable.found && (
        <p className="mt-10 rounded-lg border border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
          {readable.note ??
            "No readable copy is available for this title yet. We can only serve books that are free to read and share."}
          {readable.sourceUrl && (
            <>
              {" "}
              <a className="text-gold hover:underline" href={readable.sourceUrl} target="_blank" rel="noreferrer">
                View external copy
              </a>
            </>
          )}
        </p>
      )}

      {chapters.length > 0 && (
        <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
          <nav className="max-h-[70vh] space-y-1 overflow-y-auto pr-2">
            {chapters.map((c) => (
              <button
                key={c.index}
                onClick={() => setActive(c.index)}
                className={`block w-full truncate rounded px-3 py-2 text-left text-sm transition ${
                  c.index === active
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {c.title}
                {!user && c.index > 0 && <span className="ml-1 text-[10px]">🔒</span>}
              </button>
            ))}
          </nav>

          <article className="min-w-0">
            {locked ? (
              <div className="rounded-xl border border-gold/30 bg-card/50 p-8 text-center">
                <h2 className="text-2xl">Keep reading with a free account</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  The first chapter is free for everyone. Sign up to read the whole book and save it
                  for offline reading.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild>
                    <Link to="/auth">Create free account</Link>
                  </Button>
                  <Button variant="outline" onClick={() => setActive(0)}>
                    Back to chapter 1
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl text-gold">{chapters[active]?.title}</h2>
                <div className="mt-4 space-y-4 whitespace-pre-wrap text-[15px] leading-8 text-foreground/90">
                  {(chapters[active]?.text ?? "")
                    .split(/\n{2,}/)
                    .slice(0, 400)
                    .map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                </div>
                <div className="mt-10 flex justify-between border-t border-border/60 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={active === 0}
                    onClick={() => setActive((a) => Math.max(0, a - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    disabled={active >= chapters.length - 1}
                    onClick={() => setActive((a) => Math.min(chapters.length - 1, a + 1))}
                  >
                    Next chapter
                  </Button>
                </div>
                {!user && (
                  <p className="mt-6 text-center text-xs text-muted-foreground">
                    Free preview — chapter 1 of {chapters.length}.{" "}
                    <Link to="/auth" className="text-gold hover:underline">
                      Sign up
                    </Link>{" "}
                    to read the rest and download for offline.
                  </p>
                )}
              </>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
