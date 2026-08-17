import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, BookOpen } from "lucide-react";
import { fetchExternalBookDetails } from "@/lib/bookReviews.functions";
import { goodreadsReviewsForTitle } from "@/lib/goodreadsReviews";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";
import { Book3D } from "@/components/Book3D";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CommunityReview = {
  id: string;
  rating: number;
  body: string | null;
  has_spoilers: boolean | null;
  created_at: string;
  profiles: { username: string; display_name: string | null } | null;
};

type Search = { title: string; author?: string | undefined; cover?: string | undefined };

export const Route = createFileRoute("/reviews/$workId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    title: typeof search["title"] === "string" ? search["title"] : "",
    author: typeof search["author"] === "string" ? search["author"] : undefined,
    cover: typeof search["cover"] === "string" ? search["cover"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book reviews — BooksOcean" },
      {
        name: "description",
        content: "All the reader reviews and ratings for one book, gathered in one place on BooksOcean.",
      },
      { property: "og:title", content: "Book reviews — BooksOcean" },
      {
        property: "og:description",
        content: "Reader reviews, star breakdowns and community ratings for trending books.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { workId } = Route.useParams();
  const { title, author, cover } = Route.useSearch();
  const getDetails = useServerFn(fetchExternalBookDetails);

  const details = useQuery({
    queryKey: ["external-book", workId, title, author],
    queryFn: () => getDetails({ data: { workId, title, author: author ?? null } }),
    enabled: title.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  const community = useQuery({
    queryKey: ["community-reviews-for", title, author],
    enabled: title.length > 0,
    queryFn: async () => {
      const { data: books } = await supabase
        .from("books")
        .select("id, title, author, cover_url")
        .ilike("title", title)
        .limit(3);
      if (!books || books.length === 0) return { bookId: null as string | null, reviews: [] };
      const book = books[0]!;
      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, rating, body, has_spoilers, created_at, profiles(username, display_name)")
        .eq("book_id", book.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return { bookId: book.id, reviews: reviews ?? [] };
    },
  });

  const curated = goodreadsReviewsForTitle(title);
  const d = details.data;
  const coverUrl = cover ?? d?.coverUrl ?? null;
  const totalRatings = d?.histogram?.reduce((sum, b) => sum + b.count, 0) ?? 0;

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[220px_1fr]">
          <div className="mx-auto w-[180px] md:mx-0">
            <Book3D coverUrl={coverUrl} title={title} />
          </div>
          <div>
            <h1 className="text-4xl leading-tight">{title || "Book"}</h1>
            {(author || d?.author) && (
              <p className="mt-2 text-muted-foreground">{author ?? d?.author}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {typeof d?.averageRating === "number" && (
                <>
                  <StarRating value={d.averageRating} size={18} />
                  <span className="text-sm text-muted-foreground">
                    {d.averageRating.toFixed(2)}
                    {d.ratingsCount ? ` · ${d.ratingsCount.toLocaleString()} ratings` : ""}
                  </span>
                </>
              )}
              {d?.firstPublishYear && (
                <span className="text-xs uppercase tracking-widest text-gold/80">
                  {d.firstPublishYear}
                </span>
              )}
            </div>
            {details.isLoading ? (
              <Skeleton className="mt-5 h-20 w-full" />
            ) : (
              d?.description && (
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {d.description.slice(0, 700)}
                  {d.description.length > 700 ? "…" : ""}
                </p>
              )
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/search">
                  Add to my shelves
                </Link>
              </Button>
              {d?.goodreadsSearchUrl && (
                <Button asChild variant="outline">
                  <a href={d.goodreadsSearchUrl} target="_blank" rel="noopener noreferrer">
                    More on Goodreads <ExternalLink size={14} className="ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rating breakdown */}
      {totalRatings > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <h2 className="text-2xl">How readers rated it</h2>
            <div className="mt-5 max-w-xl space-y-2">
              {d!.histogram.map((bucket) => {
                const pct = totalRatings ? Math.round((bucket.count / totalRatings) * 100) : 0;
                return (
                  <div key={bucket.stars} className="flex items-center gap-3 text-sm">
                    <span className="w-14 text-muted-foreground">{bucket.stars} star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 text-right text-xs text-muted-foreground">
                      {bucket.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Reader reviews */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl">Reader reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every review of this book, from BooksOcean readers and the wider reading community.
        </p>

        {curated.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {curated.map((r) => (
              <article key={r.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <StarRating value={r.rating} size={15} />
                  <span className="text-xs uppercase tracking-[0.2em] text-gold/70">
                    {r.reviewer} · Goodreads
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </article>
            ))}
          </div>
        )}

        <h3 className="mt-10 text-xl">From BooksOcean</h3>
        {community.isLoading ? (
          <Skeleton className="mt-4 h-24 w-full" />
        ) : community.data && community.data.reviews.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(community.data.reviews as CommunityReview[]).map((r) => (
              <article key={r.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <StarRating value={r.rating} size={15} />
                  {r.profiles && (
                    <Link
                      to="/u/$username"
                      params={{ username: r.profiles.username }}
                      className="text-xs text-muted-foreground hover:text-gold"
                    >
                      @{r.profiles.username}
                    </Link>
                  )}
                </div>
                {r.body && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {r.has_spoilers ? "Contains spoilers — open the book page to read." : r.body}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen size={15} className="text-gold/70" />
            No one here has reviewed this yet.{" "}
            <Link to="/search" className="text-gold underline">
              Add it and be the first.
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
