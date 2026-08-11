import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDiscovery } from "@/lib/books";
import { BookCard } from "@/components/BookCard";
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
          "Build your shelves, rate every read, write spoiler-safe reviews and follow the readers whose taste you trust.",
      },
      { property: "og:title", content: "BookTok — Track, rate and review the books you read" },
      {
        property: "og:description",
        content: "Shelves, star ratings and reviews for people who read too much.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data, isLoading } = useQuery({ queryKey: ["discovery"], queryFn: fetchDiscovery });

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">For people who read too much</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl leading-[1.05] sm:text-7xl">
            Every book you finish deserves a verdict.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Shelve what you're reading, rate it out of five, write the review — and see what the
            readers you follow could not put down.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/search">Find a book</Link>
            </Button>
          </div>
        </div>
      </section>

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

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-3xl">Latest reviews</h2>
        <div className="mt-6 space-y-4">
          {data?.reviews.slice(0, 6).map((review) => (
            <article key={review.id} className="rounded-sm border border-border bg-card p-5">
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
