import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchDiscovery } from "@/lib/books";
import { fetchTrendingBooks } from "@/lib/googlebooks.functions";
import { BookCard } from "@/components/BookCard";
import { Book3D } from "@/components/Book3D";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BookTok — Track, rate and review the books you read" },
      {
        name: "description",
        content:
          "Discover trending books, build your shelves, rate every read and write spoiler-safe reviews with the readers whose taste you trust.",
      },
      { property: "og:title", content: "BookTok — Track, rate and review the books you read" },
      {
        property: "og:description",
        content: "Trending books, star ratings and spoiler-safe reviews for people who read too much.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data, isLoading } = useQuery({ queryKey: ["discovery"], queryFn: fetchDiscovery });
  const googleTrending = useServerFn(fetchTrendingBooks);
  const trending = useQuery({
    queryKey: ["trending-books"],
    queryFn: () => googleTrending({ data: {} }),
    staleTime: 1000 * 60 * 30,
  });

  const heroBooks = (trending.data ?? []).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_20%,color-mix(in_oklch,var(--color-gold)_18%,transparent),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">For people who read too much</p>
            <h1 className="mt-5 max-w-2xl text-5xl leading-[1.05] sm:text-6xl">
              Every book you finish deserves a verdict.
            </h1>
            <p className="mt-6 max-w-lg text-muted-foreground">
              Shelve what you're reading, rate it out of five, write the review — and see what the
              readers you follow could not put down.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/search">Find a book</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/feed">See what's being read</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Books</dt>
                <dd className="font-display text-2xl text-gold">{data?.trending.length ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Reviews</dt>
                <dd className="font-display text-2xl text-gold">{data?.reviews.length ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Trending</dt>
                <dd className="font-display text-2xl text-gold">{trending.data?.length ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="flex min-h-[280px] items-center justify-center gap-2 sm:gap-6">
            {heroBooks.length > 0
              ? heroBooks.map((b, i) => (
                  <div key={b.id} className={i === 1 ? "z-10" : "hidden opacity-90 sm:block"}>
                    <Book3D
                      title={b.title}
                      author={b.author}
                      coverUrl={b.coverUrl}
                      width={i === 1 ? 170 : 120}
                    />
                  </div>
                ))
              : Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className={i === 1 ? "h-64 w-40" : "hidden h-48 w-28 sm:block"} />
                ))}
          </div>
        </div>
      </section>

      {/* Trending worldwide (Google Books) */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl">Trending right now</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Popular BookTok picks, pulled live from the web. Tap one to find it and add it to your shelves.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/search">Search all books</Link>
            </Button>
          </div>

          {trending.isLoading ? (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-2/3 w-full" />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {(trending.data ?? []).slice(0, 8).map((b) => (
                <Link
                  key={b.id}
                  to="/search"
                  className="group block space-y-2"
                  aria-label={`Find ${b.title} on BookTok`}
                >
                  <div className="overflow-hidden rounded-sm border border-border transition-colors group-hover:border-gold">
                    {b.coverUrl ? (
                      <img
                        src={b.coverUrl}
                        alt={`Cover of ${b.title}`}
                        loading="lazy"
                        className="aspect-2/3 w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-2/3 w-full items-center justify-center bg-muted p-3 text-center font-display text-sm text-muted-foreground">
                        {b.title}
                      </div>
                    )}
                  </div>
                  <h3 className="line-clamp-2 font-display text-lg leading-tight">{b.title}</h3>
                  <p className="text-xs text-muted-foreground">{b.author}</p>
                  {typeof b.averageRating === "number" && (
                    <div className="flex items-center gap-2">
                      <StarRating value={b.averageRating} size={13} />
                      <span className="text-xs text-muted-foreground">
                        {b.averageRating.toFixed(1)}
                        {b.ratingsCount ? ` · ${b.ratingsCount}` : ""}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending on BookTok (community) */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl">Trending on BookTok</h2>
        <p className="mt-1 text-sm text-muted-foreground">Most reviewed in recent activity.</p>
        {isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-full" />
            ))}
          </div>
        ) : data && data.trending.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {data.trending.map((item) => (
              <BookCard
                key={item.book.id}
                book={item.book}
                average={item.average}
                count={item.count}
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No reviews yet. <Link to="/search" className="text-gold underline">Be the first.</Link>
          </p>
        )}
      </section>

      {/* Latest reviews */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-3xl">Latest reviews</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data?.reviews.slice(0, 6).map((review) => (
            <article
              key={review.id}
              className="rounded-sm border border-border bg-card p-5 transition-colors hover:border-gold"
            >
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={review.rating} size={15} />
                {review.books && (
                  <Link
                    to="/books/$bookId"
                    params={{ bookId: review.book_id }}
                    className="font-display text-xl hover:text-gold"
                  >
                    {review.books.title}
                  </Link>
                )}
                {review.profiles && (
                  <Link
                    to="/u/$username"
                    params={{ username: review.profiles.username }}
                    className="text-xs text-muted-foreground hover:text-gold"
                  >
                    @{review.profiles.username}
                  </Link>
                )}
              </div>
              {review.body && (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {review.has_spoilers ? "Contains spoilers — open the book page to read." : review.body}
                </p>
              )}
            </article>
          ))}
          {data && data.reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing reviewed yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
